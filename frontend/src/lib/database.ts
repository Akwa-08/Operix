// frontend/src/lib/database.ts
// Direct Supabase queries — NO Express middleman
// RLS handles all security. This file is the ONLY data access layer.

import { supabase } from '../config/supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (own profile — admin CRUD uses backend /api/admin/*)
// ═══════════════════════════════════════════════════════════════════════════════

export const db = {

  // ── Profile ────────────────────────────────────────────────────────────
  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    return data;
  },

  async updateMyProfile(updates: { first_name?: string; last_name?: string; contact_number?: string; address?: string; email?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Sync name to auth metadata so AuthContext stays fresh
    if (updates.first_name !== undefined || updates.last_name !== undefined) {
      await supabase.auth.updateUser({
        data: { first_name: updates.first_name, last_name: updates.last_name }
      });
    }

    const { data, error } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },

  async updateMyPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  // ── Users list (staff can read all via RLS) ────────────────────────────
  async getUsers(filters?: { role?: string; status?: string }) {
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });
    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.status === 'active') query = query.eq('is_active', true);
    if (filters?.status === 'inactive') query = query.eq('is_active', false);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ═══════════════════════════════════════════════════════════════════════════
  async getEmployees() {
    const { data, error } = await supabase.from('employees').select('*').order('employee_code');
    if (error) throw error;
    return data || [];
  },

  async createEmployee(emp: { employee_code?: string; full_name: string; position: string; base_hourly_rate?: number; hire_date?: string }) {
    const { data, error } = await supabase.from('employees').insert([{
      ...emp, is_active: true,
      base_hourly_rate: emp.base_hourly_rate || 0,
      hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateEmployee(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLIERS
  // ═══════════════════════════════════════════════════════════════════════════
  async getSuppliers() {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async createSupplier(s: { name: string; contact_person?: string; phone?: string; email?: string; address?: string }) {
    const { data, error } = await supabase.from('suppliers').insert([{ ...s, is_active: true, is_flagged: false }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateSupplier(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY
  // ═══════════════════════════════════════════════════════════════════════════
  async getInventoryItems() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, item_suppliers(id, supplier_unit_price, lead_time_days, is_preferred, suppliers(id, name))')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async createInventoryItem(item: { name: string; unit_of_measure: string; current_quantity?: number; reorder_point?: number; unit_cost?: number; description?: string }) {
    const { data, error } = await supabase.from('inventory_items').insert([{ ...item, is_active: true }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateInventoryItem(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('inventory_items').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════
  async getProducts(filters?: { category?: string; search?: string }) {
    let query = supabase.from('products').select('*').order('category').order('name');
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createProduct(p: Record<string, any>) {
    const { data, error } = await supabase.from('products').insert([{ ...p, is_active: true }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  async getOrders(filters?: { status?: string; assigned_designer?: string; assigned_production?: string }) {
    let query = supabase.from('orders').select(`
      *,
      customer:customer_id(id, first_name, last_name, email, contact_number),
      designer:assigned_designer(id, first_name, last_name),
      production_staff:assigned_production(id, first_name, last_name),
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications)
    `).order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters?.assigned_designer) query = query.eq('assigned_designer', filters.assigned_designer);
    if (filters?.assigned_production) query = query.eq('assigned_production', filters.assigned_production);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrderById(id: string) {
    const { data, error } = await supabase.from('orders').select(`
      *,
      customer:customer_id(id, first_name, last_name, email, contact_number),
      designer:assigned_designer(id, first_name, last_name),
      production_staff:assigned_production(id, first_name, last_name),
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications),
      payments(id, amount, payment_method, reference_number, notes, received_by, created_at)
    `).eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createOrder(order: {
    customer_id?: string | null; guest_name?: string | null; guest_phone?: string | null; guest_email?: string | null; order_type: string; special_instructions?: string;
    due_date?: string; assigned_designer?: string; assigned_production?: string;
    comments?: string; items: { product_id?: string; product_name: string; quantity: number; unit_price: number; specifications?: string }[];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate order number
    let orderNumber: string;
    try {
      const { data: seq } = await supabase.rpc('get_next_order_seq');
      orderNumber = `ORD-${new Date().getFullYear()}-${String(seq ?? Date.now()).padStart(5, '0')}`;
    } catch {
      orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }

    const totalAmount = order.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

    const { data: newOrder, error: orderErr } = await supabase.from('orders').insert([{
      order_number: orderNumber,
      customer_id: order.customer_id || null,
      guest_name: order.guest_name || null,
      guest_phone: order.guest_phone || null,
      guest_email: order.guest_email || null,
      created_by: user.id,
      order_type: order.order_type || 'walk-in',
      status: 'in_queue',
      payment_status: 'unpaid',
      special_instructions: order.special_instructions || null,
      comments: order.comments || null,
      due_date: order.due_date || null,
      total_amount: totalAmount,
      amount_paid: 0,
      assigned_designer: order.assigned_designer || null,
      assigned_production: order.assigned_production || null,
    }]).select().single();

    if (orderErr) throw orderErr;

    // Insert items
    const items = order.items.map(i => ({
      order_id: newOrder.id,
      product_id: i.product_id || null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.quantity * i.unit_price,
      specifications: i.specifications || null,
    }));

    await supabase.from('order_items').insert(items);
    return newOrder;
  },

  async updateOrder(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteOrder(id: string) {
    await supabase.from('payments').delete().eq('order_id', id);
    await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Payments ─────────────────────────────────────────────────────────
  async recordPayment(orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Insert payment
    const { error: payErr } = await supabase.from('payments').insert([{
      order_id: orderId, ...payment, received_by: user.id,
    }]);
    if (payErr) throw payErr;

    // Update order totals
    const { data: order } = await supabase.from('orders').select('amount_paid, total_amount').eq('id', orderId).single();
    if (order) {
      const newPaid = parseFloat(order.amount_paid) + payment.amount;
      const total = parseFloat(order.total_amount);
      const ps = newPaid >= total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
      await supabase.from('orders').update({ amount_paid: newPaid, payment_status: ps }).eq('id', orderId);
    }
  },

  async getPayments(orderId: string) {
    const { data, error } = await supabase.from('payments').select('*').eq('order_id', orderId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CART (customer only — RLS enforces ownership)
  // ═══════════════════════════════════════════════════════════════════════════
  async getCart() {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:product_id(id, name, description, category, size_spec, variant, final_price)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addToCart(productId: string, quantity: number = 1, forceNewRow: boolean = false, specifications?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!forceNewRow) {
      // Find the most recent matching item to increment safely
      let query = supabase.from('cart_items').select('id, quantity').eq('customer_id', user.id).eq('product_id', productId);
      
      const { data: existingList, error: queryErr } = await query.order('created_at', { ascending: false }).limit(1);
      
      if (!queryErr && existingList && existingList.length > 0) {
        const existing = existingList[0];
        const { data, error } = await supabase.from('cart_items').update({ quantity: existing.quantity + quantity, specifications }).eq('id', existing.id).select().single();
        if (error) throw error;
        return data;
      }
    }

    // Insert as a new row (e.g., completely different design intent or brand new cart entry)
    const { data, error } = await supabase.from('cart_items').insert([{ customer_id: user.id, product_id: productId, quantity, specifications }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateCartItem(cartItemId: string, updates: { quantity?: number; specifications?: string }) {
    const { data, error } = await supabase.from('cart_items').update(updates).eq('id', cartItemId).select().single();
    if (error) throw error;
    return data;
  },

  async removeCartItem(cartItemId: string) {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (error) throw error;
  },

  async clearCart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('cart_items').delete().eq('customer_id', user.id);
    if (error) throw error;
  },

  async checkout(specialInstructions?: string, dueDate?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const cartItems = await db.getCart();
    if (!cartItems.length) throw new Error('Cart is empty');

    const order = await db.createOrder({
      customer_id: user.id,
      order_type: 'online',
      special_instructions: specialInstructions,
      due_date: dueDate,
      items: cartItems.map(ci => ({
        product_id: ci.product_id,
        product_name: ci.product?.name || 'Unknown',
        quantity: ci.quantity,
        unit_price: parseFloat(ci.product?.final_price || '0'),
        specifications: ci.specifications,
      })),
    });

    await db.clearCart();
    return order;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF LIST (for assignment dropdowns)
  // ═══════════════════════════════════════════════════════════════════════════
  async getStaffList() {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .in('role', ['designer', 'production', 'admin'])
      .eq('is_active', true)
      .order('role').order('first_name');
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY — extended
  // ═══════════════════════════════════════════════════════════════════════════
  async deleteInventoryItem(id: string) {
    const { error } = await supabase.from('inventory_items').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS WITH BOM
  // ═══════════════════════════════════════════════════════════════════════════
  async getProductsWithBOM() {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_supply_mapping(id, inventory_item_id, quantity_required, inventory_items:inventory_item_id(id, name, unit_of_measure, unit_cost))')
      .order('category').order('name');
    if (error) throw error;
    return data || [];
  },

  async createProductWithBOM(product: {
    name: string; category?: string; variant?: string; size_spec?: string;
    material_cost: number; profit_fee: number; final_price: number; description?: string;
  }, bom: { inventory_item_id: string; quantity_required: number }[]) {
    const { data: p, error: pErr } = await supabase.from('products')
      .insert([{ ...product, is_active: true }]).select().single();
    if (pErr) throw pErr;

    if (bom.length > 0) {
      const rows = bom.map(b => ({ product_id: p.id, ...b }));
      const { error: bErr } = await supabase.from('product_supply_mapping').insert(rows);
      if (bErr) throw bErr;
    }
    return p;
  },

  async updateProductWithBOM(id: string,
    product: Record<string, any>,
    bom?: { inventory_item_id: string; quantity_required: number }[]
  ) {
    product.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single();
    if (error) throw error;

    if (bom !== undefined) {
      // Replace all BOM rows
      await supabase.from('product_supply_mapping').delete().eq('product_id', id);
      if (bom.length > 0) {
        const rows = bom.map(b => ({ product_id: id, ...b }));
        await supabase.from('product_supply_mapping').insert(rows);
      }
    }
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERIES
  // ═══════════════════════════════════════════════════════════════════════════
  async getDeliveries(filters?: { status?: string }) {
    let query = supabase.from('deliveries').select(`
      *,
      inventory_item:inventory_item_id(id, name, unit_of_measure, purchase_unit, conversion_rate),
      supplier:supplier_id(id, name),
      requester:requested_by(id, first_name, last_name)
    `).order('created_at', { ascending: false });
    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createDelivery(d: {
    inventory_item_id: string; supplier_id?: string; requested_quantity: number;
    expected_arrival_date?: string; notes?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('deliveries').insert([{
      ...d, requested_by: user.id, status: 'requested',
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateDelivery(id: string, updates: Record<string, any>) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('deliveries').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Confirm delivery receipt: update status + auto-restock inventory */
  async confirmDeliveryReceipt(id: string, receipt: {
    received_quantity: number; receipt_reference_number: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Update delivery record
    const { data: delivery, error: dErr } = await supabase.from('deliveries').update({
      status: 'received',
      received_quantity: receipt.received_quantity,
      receipt_reference_number: receipt.receipt_reference_number,
      received_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id).select('*, inventory_item:inventory_item_id(id, conversion_rate, current_quantity)').single();
    if (dErr) throw dErr;

    // 2. Auto-restock: received_qty * conversion_rate → add to current_quantity
    const item = delivery.inventory_item;
    const conversionRate = Number(item.conversion_rate) || 1;
    const addQty = receipt.received_quantity * conversionRate;
    const newQty = Number(item.current_quantity) + addQty;

    const { error: iErr } = await supabase.from('inventory_items')
      .update({ current_quantity: newQty, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (iErr) throw iErr;

    // 3. Log inventory change
    await supabase.from('inventory_changes').insert([{
      inventory_item_id: item.id,
      change_type: 'Manual Adjustment',
      quantity_change: addQty,
      quantity_before: Number(item.current_quantity),
      quantity_after: newQty,
      reason: `Delivery receipt #${receipt.receipt_reference_number}`,
      changed_by: user.id,
    }]);

    return delivery;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════════════
  chat: {
    /**
     * Returns a deduplicated list of conversations for the current user.
     * Each conversation represents a unique "other person" the user has
     * exchanged messages with.
     */
    async getConversations() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          sent_at,
          sender:sender_id(id, first_name, last_name, role),
          receiver:receiver_id(id, first_name, last_name, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Build a Map keyed on the OTHER person's user id.
      // We iterate newest-first so the first occurrence IS the latest message.
      const conversationsMap = new Map<string, any>();

      for (const msg of data as any[]) {
        const isSender = msg.sender_id === user.id;
        // Try to use the joined object; fall back to just the id if RLS hid the profile.
        const otherProfile = isSender ? msg.receiver : msg.sender;
        const otherId = isSender ? msg.receiver_id : msg.sender_id;

        if (!otherId) continue;
        if (conversationsMap.has(otherId)) continue; // already captured the latest

        conversationsMap.set(otherId, {
          id: otherId,
          userId: otherId,
          userName: otherProfile
            ? `${otherProfile.first_name || ''} ${otherProfile.last_name || ''}`.trim()
            : 'Unknown User',
          userRole: otherProfile?.role || 'user',
          lastMessage: msg.message,
          lastMessageTime: new Date(msg.sent_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unreadCount: 0,
          isActive: true,
          messages: [],
        });
      }

      return Array.from(conversationsMap.values());
    },

    /**
     * Returns the full message history between the current user and otherUserId,
     * ordered oldest-first so the UI can render top-to-bottom.
     */
    async getMessages(otherUserId: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message,
          sent_at,
          sender:sender_id(first_name, last_name, role)
        `)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('sent_at', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      const STAFF_ROLES = ['admin', 'cashier', 'designer', 'production'];

      return data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender
          ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim()
          : 'Unknown',
        content: msg.message,
        timestamp: new Date(msg.sent_at).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
        isFromAdmin: STAFF_ROLES.includes((msg.sender?.role || '').toLowerCase()),
      }));
    },

    /**
     * Inserts a new message row. RLS enforces sender_id === auth.uid().
     */
    async sendMessage(receiverId: string, message: string, orderId?: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: user.id,
          receiver_id: receiverId,
          message,
          order_id: orderId || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    /**
     * Opens a Supabase Realtime channel and calls `callback` whenever
     * a new row is inserted into chat_messages.
     * Returns the channel so the caller can `.unsubscribe()` on cleanup.
     */
    subscribeToMessages(callback: (payload: any) => void) {
      return supabase
        .channel('chat_messages_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          callback
        )
        .subscribe();
    },

    /**
     * Returns the list of users that the current user is allowed to message.
     * Staff/Admins see ALL active users.
     * Customers only see active staff/admin users.
     */
    async getPotentialRecipients(currentUserRole: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const STAFF_ROLES = ['admin', 'cashier', 'designer', 'production'];
      const isStaff = STAFF_ROLES.includes((currentUserRole || '').toLowerCase());

      let query = supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('is_active', true)
        .neq('id', user.id); // never show yourself

      // Customers may only discover staff, not other customers
      if (!isStaff) {
        query = query.in('role', ['admin', 'cashier', 'designer', 'production', 'Admin', 'Cashier', 'Designer', 'Production']);
      }

      const { data, error } = await query.order('first_name');
      if (error) throw error;
      if (!data) return [];

      return data.map((u: any) => ({
        userId: u.id,
        userName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        userRole: u.role,
      }));
    },
  },
};