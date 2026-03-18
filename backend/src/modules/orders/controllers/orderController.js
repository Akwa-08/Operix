const { supabase } = require('../../../config/supabase');
const { successResponse, errorResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class OrderController {
  getAllOrders = asyncHandler(async (req, res) => {
    const role = req.user?.role;
    const userId = req.user?.id;
    let query = supabase.from('orders').select(`
      *, customer:customer_id ( id, first_name, last_name, email, contact_number ),
      designer:assigned_designer ( id, first_name, last_name ),
      production_staff:assigned_production ( id, first_name, last_name ),
      order_items ( id, product_id, product_name, quantity, unit_price, subtotal, specifications )
    `).order('created_at', { ascending: false });

    if (role === 'designer') query = query.eq('assigned_designer', userId);
    else if (role === 'production') query = query.eq('assigned_production', userId);
    if (req.query.status && req.query.status !== 'all') query = query.eq('status', req.query.status);
    if (req.query.period) {
      const now = new Date(); let from;
      if (req.query.period === 'today') from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      else if (req.query.period === 'week') from = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
      else if (req.query.period === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      else if (req.query.period === 'year') from = new Date(now.getFullYear(), 0, 1).toISOString();
      if (from) query = query.gte('created_at', from);
    }
    if (req.query.assigned_designer) query = query.eq('assigned_designer', req.query.assigned_designer);
    if (req.query.assigned_production) query = query.eq('assigned_production', req.query.assigned_production);

    const { data, error } = await query;
    if (error) throw error;
    return successResponse(res, data, 'Orders retrieved');
  });

  getOrderById = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('orders').select(`
      *, customer:customer_id ( id, first_name, last_name, email, contact_number ),
      designer:assigned_designer ( id, first_name, last_name ),
      production_staff:assigned_production ( id, first_name, last_name ),
      order_items ( id, product_id, product_name, quantity, unit_price, subtotal, specifications ),
      payments ( id, amount, payment_method, reference_number, notes, created_at )
    `).eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return errorResponse(res, 'Order not found', 404);
    return successResponse(res, data, 'Order retrieved');
  });

  createOrder = asyncHandler(async (req, res) => {
    const { customer_id, order_type, items, special_instructions, due_date, assigned_designer, assigned_production, comments } = req.body;
    if (!items || items.length === 0) return errorResponse(res, 'Order must have at least one item', 400);

    let orderNumber;
    try {
      const { data: seqData } = await supabase.rpc('get_next_order_seq');
      orderNumber = `ORD-${new Date().getFullYear()}-${String(seqData ?? Date.now()).padStart(5, '0')}`;
    } catch { orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`; }

    const totalAmount = items.reduce((sum, i) => sum + ((i.quantity||1) * (i.unit_price||0)), 0);

    const insertPayload = {
      order_number: orderNumber, customer_id: customer_id || null, created_by: req.user.id,
      order_type: order_type || 'walk-in', status: 'in_queue', payment_status: 'unpaid',
      special_instructions: special_instructions || null, comments: comments || null,
      due_date: due_date || null, total_amount: totalAmount, amount_paid: 0,
      assigned_designer: assigned_designer || null, assigned_production: assigned_production || null,
    };

    let order, orderErr;
    ({ data: order, error: orderErr } = await supabase.from('orders').insert([insertPayload]).select().single());
    
    if (orderErr && orderErr.code === '23505') {
      insertPayload.order_number = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      ({ data: order, error: orderErr } = await supabase.from('orders').insert([insertPayload]).select().single());
    }
    if (orderErr) throw orderErr;

    const orderItems = items.map(i => ({
      order_id: order.id, product_id: i.product_id || null, product_name: i.product_name || 'Custom Item',
      quantity: i.quantity || 1, unit_price: i.unit_price || 0, subtotal: (i.quantity||1) * (i.unit_price||0),
      specifications: i.specifications || null,
    }));
    await supabase.from('order_items').insert(orderItems);

    const { data: complete } = await supabase.from('orders')
      .select(`*, customer:customer_id(id,first_name,last_name,email), order_items(*)`)
      .eq('id', order.id).single();
    return successResponse(res, complete, 'Order created', 201);
  });

  updateOrder = asyncHandler(async (req, res) => {
    const allowed = ['special_instructions','comments','due_date','order_type','total_amount'];
    const payload = {};
    for (const f of allowed) { if (req.body[f] !== undefined) payload[f] = req.body[f]; }
    if (!Object.keys(payload).length) return errorResponse(res, 'No fields to update', 400);
    const { data, error } = await supabase.from('orders').update(payload).eq('id', req.params.id).select().single();
    if (error) throw error;
    return successResponse(res, data, 'Order updated');
  });

  deleteOrder = asyncHandler(async (req, res) => {
    await supabase.from('payments').delete().eq('order_id', req.params.id);
    await supabase.from('order_items').delete().eq('order_id', req.params.id);
    const { error } = await supabase.from('orders').delete().eq('id', req.params.id);
    if (error) throw error;
    return successResponse(res, null, 'Order deleted');
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const role = req.user?.role;
    const valid = ['in_queue','designing','payment','production','pickup','completed','cancelled'];
    if (!valid.includes(status)) return errorResponse(res, `Invalid status: ${valid.join(', ')}`, 400);
    if (status === 'pickup' && role !== 'production' && role !== 'admin')
      return errorResponse(res, 'Only production can mark pickup', 403);
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', req.params.id).select().single();
    if (error) throw error;
    return successResponse(res, data, `Status → ${status}`);
  });

  assignStaff = asyncHandler(async (req, res) => {
    const { assigned_designer, assigned_production } = req.body;
    const payload = {};
    if (assigned_designer !== undefined) payload.assigned_designer = assigned_designer || null;
    if (assigned_production !== undefined) payload.assigned_production = assigned_production || null;
    if (!Object.keys(payload).length) return errorResponse(res, 'Provide assigned_designer or assigned_production', 400);
    const { data, error } = await supabase.from('orders').update(payload).eq('id', req.params.id)
      .select(`*, designer:assigned_designer(id,first_name,last_name), production_staff:assigned_production(id,first_name,last_name)`).single();
    if (error) throw error;
    return successResponse(res, data, 'Staff assigned');
  });

  selfAssign = asyncHandler(async (req, res) => {
    const role = req.user?.role; const userId = req.user?.id;
    const payload = {};
    if (role === 'designer') payload.assigned_designer = userId;
    else if (role === 'production') payload.assigned_production = userId;
    else return errorResponse(res, 'Only designer/production can self-assign', 403);
    // Also update status if assigning designer to unassigned order
    if (role === 'designer') payload.status = 'designing';
    const { data, error } = await supabase.from('orders').update(payload).eq('id', req.params.id).select().single();
    if (error) throw error;
    return successResponse(res, data, 'Self-assigned');
  });

  recordPayment = asyncHandler(async (req, res) => {
    const { amount, payment_method, reference_number, notes } = req.body;
    if (!amount || amount <= 0) return errorResponse(res, 'Amount > 0 required', 400);
    if (!payment_method) return errorResponse(res, 'Payment method required', 400);
    const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (!order) return errorResponse(res, 'Order not found', 404);
    const { data: payment, error: payErr } = await supabase.from('payments').insert([{
      order_id: req.params.id, amount, payment_method,
      reference_number: reference_number || null, received_by: req.user.id, notes: notes || null,
    }]).select().single();
    if (payErr) throw payErr;
    const newPaid = parseFloat(order.amount_paid) + parseFloat(amount);
    const total = parseFloat(order.total_amount);
    const ps = newPaid >= total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
    const { data: updated } = await supabase.from('orders').update({ amount_paid: newPaid, payment_status: ps }).eq('id', req.params.id).select().single();
    return successResponse(res, { order: updated, payment }, `₱${amount} recorded`);
  });

  getPayments = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('payments')
      .select(`*, received_by_user:received_by(first_name,last_name)`)
      .eq('order_id', req.params.id).order('created_at', { ascending: false });
    if (error) throw error;
    return successResponse(res, data, 'Payments retrieved');
  });

  getStaffList = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('users')
      .select('id, first_name, last_name, role')
      .in('role', ['designer','production','admin']).eq('is_active', true).order('role').order('first_name');
    if (error) throw error;
    return successResponse(res, data, 'Staff list');
  });

  getStats = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('orders').select('status, payment_status, total_amount, amount_paid, due_date, created_at');
    if (error) throw error;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const stats = { total: data.length, in_queue:0, designing:0, payment:0, production:0, pickup:0, completed:0, cancelled:0,
      overdue:0, totalRevenue:0, totalCollected:0, unpaid:0, partial:0, paid:0, today:0, thisWeek:0, thisMonth:0 };
    data.forEach(o => {
      if (stats[o.status] !== undefined) stats[o.status]++;
      stats[o.payment_status] = (stats[o.payment_status]||0) + 1;
      stats.totalRevenue += parseFloat(o.total_amount)||0;
      stats.totalCollected += parseFloat(o.amount_paid)||0;
      if (o.due_date && new Date(o.due_date) < now && !['completed','cancelled','pickup'].includes(o.status)) stats.overdue++;
      const c = new Date(o.created_at);
      if (c >= todayStart) stats.today++;
      if (c >= new Date(now.getTime()-7*24*60*60*1000)) stats.thisWeek++;
      if (c >= new Date(now.getFullYear(),now.getMonth(),1)) stats.thisMonth++;
    });
    return successResponse(res, stats, 'Stats');
  });
}

module.exports = new OrderController();