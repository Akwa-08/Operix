// backend/src/modules/orders/controllers/orderController.js

const { supabase } = require('../../../config/supabase');
const { successResponse, errorResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class OrderController {

  // ── GET ALL ORDERS ─────────────────────────────────────────────────────
  // Admin/Cashier: all orders. Designer: assigned. Production: assigned.
  getAllOrders = asyncHandler(async (req, res) => {
    const role = req.user?.role;
    const userId = req.user?.id;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id ( id, first_name, last_name, email, contact_number ),
        order_items ( id, product_id, product_name, quantity, unit_price, subtotal, specifications )
      `)
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (role === 'designer') {
      query = query.eq('assigned_designer', userId);
    } else if (role === 'production') {
      query = query.eq('assigned_production', userId);
    }

    // Optional status filter
    if (req.query.status && req.query.status !== 'all') {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return successResponse(res, data, 'Orders retrieved successfully');
  });

  // ── GET SINGLE ORDER ───────────────────────────────────────────────────
  getOrderById = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customer_id ( id, first_name, last_name, email, contact_number ),
        order_items ( id, product_id, product_name, quantity, unit_price, subtotal, specifications ),
        payments ( id, amount, payment_method, reference_number, notes, created_at )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return errorResponse(res, 'Order not found', 404);
    return successResponse(res, data, 'Order retrieved');
  });

  // ── CREATE ORDER ───────────────────────────────────────────────────────
  // Admin/Cashier create walk-in orders
  createOrder = asyncHandler(async (req, res) => {
    const { customer_id, order_type, items, special_instructions, due_date } = req.body;

    if (!items || items.length === 0) {
      return errorResponse(res, 'Order must have at least one item', 400);
    }

    // Generate order number
    const { data: seqData } = await supabase.rpc('get_next_order_seq');
    const seqNum = seqData ?? Date.now();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(seqNum).padStart(5, '0')}`;

    // Calculate total
    const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

    // Insert order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_id: customer_id || null,
        created_by: req.user.id,
        order_type: order_type || 'walk-in',
        status: 'in_queue',
        payment_status: 'unpaid',
        special_instructions: special_instructions || null,
        due_date: due_date || null,
        total_amount: totalAmount,
        amount_paid: 0,
      }])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id || null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.quantity * i.unit_price,
      specifications: i.specifications || null,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    // Fetch complete order with items
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`*, customer:customer_id ( id, first_name, last_name, email ), order_items ( * )`)
      .eq('id', order.id)
      .single();

    return successResponse(res, completeOrder, 'Order created', 201);
  });

  // ── UPDATE ORDER STATUS ────────────────────────────────────────────────
  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['in_queue', 'designing', 'payment', 'production', 'pickup', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be: ${validStatuses.join(', ')}`, 400);
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return errorResponse(res, 'Order not found', 404);
    return successResponse(res, data, `Order status updated to ${status}`);
  });

  // ── ASSIGN STAFF ───────────────────────────────────────────────────────
  assignStaff = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assigned_designer, assigned_production } = req.body;

    const payload = {};
    if (assigned_designer !== undefined) payload.assigned_designer = assigned_designer;
    if (assigned_production !== undefined) payload.assigned_production = assigned_production;

    if (!Object.keys(payload).length) {
      return errorResponse(res, 'Provide assigned_designer or assigned_production', 400);
    }

    const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return successResponse(res, data, 'Staff assigned');
  });

  // ── RECORD PAYMENT ─────────────────────────────────────────────────────
  recordPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, payment_method, reference_number, notes } = req.body;

    if (!amount || amount <= 0) return errorResponse(res, 'Amount must be > 0', 400);

    // Get current order
    const { data: order, error: orderErr } = await supabase.from('orders').select('*').eq('id', id).single();
    if (orderErr || !order) return errorResponse(res, 'Order not found', 404);

    // Insert payment
    const { error: payErr } = await supabase.from('payments').insert([{
      order_id: id,
      amount,
      payment_method: payment_method || 'cash',
      reference_number: reference_number || null,
      received_by: req.user.id,
      notes: notes || null,
    }]);
    if (payErr) throw payErr;

    // Update order amount_paid and payment_status
    const newPaid = parseFloat(order.amount_paid) + parseFloat(amount);
    const totalAmt = parseFloat(order.total_amount);
    let paymentStatus = 'partial';
    if (newPaid >= totalAmt) paymentStatus = 'paid';
    else if (newPaid <= 0) paymentStatus = 'unpaid';

    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ amount_paid: newPaid, payment_status: paymentStatus })
      .eq('id', id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    return successResponse(res, updated, `Payment of ₱${amount} recorded`);
  });

  // ── GET ORDER PAYMENTS ─────────────────────────────────────────────────
  getPayments = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return successResponse(res, data, 'Payments retrieved');
  });

  // ── GET ORDER STATS ────────────────────────────────────────────────────
  getStats = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from('orders').select('status, payment_status, total_amount, amount_paid, due_date');
    if (error) throw error;

    const now = new Date();
    const stats = {
      total: data.length,
      in_queue: 0, designing: 0, payment: 0, production: 0, pickup: 0, completed: 0, cancelled: 0,
      overdue: 0,
      totalRevenue: 0, totalCollected: 0,
      unpaid: 0, partial: 0, paid: 0,
    };

    data.forEach(o => {
      if (stats[o.status] !== undefined) stats[o.status]++;
      stats[`${o.payment_status}`] = (stats[o.payment_status] || 0) + 1;
      stats.totalRevenue += parseFloat(o.total_amount) || 0;
      stats.totalCollected += parseFloat(o.amount_paid) || 0;
      if (o.due_date && new Date(o.due_date) < now && !['completed', 'cancelled', 'pickup'].includes(o.status)) {
        stats.overdue++;
      }
    });

    return successResponse(res, stats, 'Order stats');
  });
}

module.exports = new OrderController();