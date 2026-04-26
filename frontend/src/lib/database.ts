// frontend/src/lib/database.ts
// Direct Supabase queries — NO Express middleman
// RLS handles all security. This file is the ONLY data access layer.

import {supabase} from "../config/supabaseClient";

export async function uploadOrderFile(file: File): Promise<string> {
  const { data: {user} } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (file.size > 2 * 1024 * 1024) throw new Error("File size exceeds 2MB limit");
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  const filePath = `customer-uploads/${fileName}`;
  const {error: uploadError} = await supabase.storage.from("order-files").upload(filePath, file, { cacheControl: "3600", upsert: false });
  if (uploadError) { console.error("Error uploading file:", uploadError); throw uploadError; }
  const { data: {publicUrl} } = supabase.storage.from("order-files").getPublicUrl(filePath);
  return publicUrl;
}

export async function uploadProfilePicture(file: File): Promise<string> {
  const { data: {user} } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (file.size > 2 * 1024 * 1024) throw new Error("File size exceeds 2MB limit");
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  const {error: uploadError} = await supabase.storage.from("user-profile").upload(fileName, file, { cacheControl: "3600", upsert: true });
  if (uploadError) { console.error("Error uploading profile picture:", uploadError); throw uploadError; }
  const { data: {publicUrl} } = supabase.storage.from("user-profile").getPublicUrl(fileName);
  return publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
export const db = {
  async getMyProfile() {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) return null;
    const {data} = await supabase.from("users").select("*").eq("id", user.id).single();
    return data;
  },

  async updateMyProfile(updates: { first_name?: string; last_name?: string; contact_number?: string; address?: string; email?: string; avatar_url?: string }) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    if (updates.first_name !== undefined || updates.last_name !== undefined) {
      await supabase.auth.updateUser({ data: { first_name: updates.first_name, last_name: updates.last_name } });
    }
    const {data, error} = await supabase.from("users").update(updates).eq("id", user.id).select().single();
    if (error) throw error;
    return data;
  },

  async updateMyPassword(newPassword: string) {
    const {error} = await supabase.auth.updateUser({password: newPassword});
    if (error) throw error;
  },

  async getUsers(filters?: {role?: string; status?: string}) {
    let query = supabase.from("users").select("*").order("created_at", {ascending: false});
    if (filters?.role) query = query.eq("role", filters.role);
    if (filters?.status === "active") query = query.eq("is_active", true);
    if (filters?.status === "inactive") query = query.eq("is_active", false);
    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ═══════════════════════════════════════════════════════════════════════════
  async getEmployees() {
    const {data, error} = await supabase.from("employees").select("*").order("employee_code");
    if (error) throw error;
    return data || [];
  },

  async createEmployee(emp: { employee_code?: string; full_name: string; position: string; role?: string; base_hourly_rate?: number; hire_date?: string }) {
    const {data, error} = await supabase.from("employees").insert([{ ...emp, is_active: true, base_hourly_rate: emp.base_hourly_rate || 0, hire_date: emp.hire_date || new Date().toISOString().split("T")[0] }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateEmployee(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase.from("employees").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLIERS
  // ═══════════════════════════════════════════════════════════════════════════
  async getSuppliers() {
    const {data, error} = await supabase.from("suppliers").select("*").order("name");
    if (error) throw error;
    return data || [];
  },

  async createSupplier(s: { name: string; contact_person?: string; phone?: string; email?: string; address?: string }) {
    const {data, error} = await supabase.from("suppliers").insert([{...s, is_active: true, is_flagged: false}]).select().single();
    if (error) throw error;
    return data;
  },

  async updateSupplier(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase.from("suppliers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY
  // ═══════════════════════════════════════════════════════════════════════════
  async getInventoryItems() {
    const {data, error} = await supabase.from("inventory_items").select("*, item_suppliers(id, supplier_unit_price, lead_time_days, is_preferred, suppliers(id, name))").order("name");
    if (error) throw error;
    return data || [];
  },

  async createInventoryItem(item: { name: string; unit_of_measure: string; current_quantity?: number; reorder_point?: number; unit_cost?: number; description?: string }) {
    const {data, error} = await supabase.from("inventory_items").insert([{...item, is_active: true}]).select().single();
    if (error) throw error;
    return data;
  },

  async updateInventoryItem(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase.from("inventory_items").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════
  async getProducts(filters?: {category?: string; search?: string}) {
    let query = supabase.from("products").select("*").order("category").order("name");
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  async createProduct(p: Record<string, any>) {
    const {data, error} = await supabase.from("products").insert([{...p, is_active: true}]).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase.from("products").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  async getOrders(filters?: { status?: string; assigned_designer?: string; assigned_production?: string }) {
    let query = supabase.from("orders").select(`*, customer:customer_id(id, first_name, last_name, email, contact_number), designer:assigned_designer(id, first_name, last_name), production_staff:assigned_production(id, full_name), order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications, file_url)`).order("created_at", {ascending: false});
    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
    if (filters?.assigned_designer) query = query.eq("assigned_designer", filters.assigned_designer);
    if (filters?.assigned_production) query = query.eq("assigned_production", filters.assigned_production);
    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrderById(id: string) {
    const {data, error} = await supabase.from("orders").select(`*, customer:customer_id(id, first_name, last_name, email, contact_number), designer:assigned_designer(id, first_name, last_name), production_staff:assigned_production(id, full_name), order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications, file_url), payments(id, amount, payment_method, reference_number, notes, received_by, created_at)`).eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async createOrder(order: { customer_id?: string | null; guest_name?: string | null; guest_phone?: string | null; guest_email?: string | null; order_type: string; special_instructions?: string; due_date?: string; assigned_designer?: string; assigned_production?: string; comments?: string; design_file_url?: string; items: { product_id?: string; product_name: string; quantity: number; unit_price: number; specifications?: string; file_url?: string }[] }) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    let orderNumber: string;
    try {
      const {data: seq} = await supabase.rpc("get_next_order_seq");
      orderNumber = `ORD-${new Date().getFullYear()}-${String(seq ?? Date.now()).padStart(5, "0")}`;
    } catch {
      orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }
    const totalAmount = order.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const {data: newOrder, error: orderErr} = await supabase.from("orders").insert([{ order_number: orderNumber, customer_id: order.customer_id || null, guest_name: order.guest_name || null, guest_phone: order.guest_phone || null, guest_email: order.guest_email || null, created_by: user.id, order_type: order.order_type || "walk-in", status: "in_queue", payment_status: "unpaid", special_instructions: order.special_instructions || null, comments: order.comments || null, due_date: order.due_date || null, total_amount: totalAmount, amount_paid: 0, assigned_designer: order.assigned_designer || null, assigned_production: order.assigned_production || null, design_file_url: order.design_file_url || null }]).select().single();
    if (orderErr) throw orderErr;
    const items = order.items.map((i) => ({ order_id: newOrder.id, product_id: i.product_id || null, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price, subtotal: i.quantity * i.unit_price, specifications: i.specifications || null, file_url: i.file_url || null }));
    await supabase.from("order_items").insert(items);
    return newOrder;
  },

  async updateOrder(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase.from("orders").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async updateCustomerDesign(orderId: string, url: string) {
    const {data: items, error: fetchError} = await supabase.from("order_items").select("id").eq("order_id", orderId).limit(1);
    if (fetchError) throw fetchError;
    if (!items || items.length === 0) throw new Error("No items found for this order");
    const {data, error} = await supabase.from("order_items").update({file_url: url}).eq("id", items[0].id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteOrder(id: string) {
    await supabase.from("payments").delete().eq("order_id", id);
    await supabase.from("order_items").delete().eq("order_id", id);
    const {error} = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
  },

  async deductInventoryForOrder(orderId: string) {
    const { data: items, error: itemsErr } = await supabase.from("order_items").select("product_id, quantity").eq("order_id", orderId);
    if (itemsErr) throw itemsErr;
    for (const item of items || []) {
      if (!item.product_id) continue;
      const { data: bom, error: bomErr } = await supabase.from("product_supply_mapping").select("inventory_item_id, quantity_required").eq("product_id", item.product_id);
      if (bomErr) throw bomErr;
      for (const mapping of bom || []) {
        const { data: inv, error: invErr } = await supabase.from("inventory_items").select("current_quantity").eq("id", mapping.inventory_item_id).single();
        if (invErr) throw invErr;
        const newQty = Number(inv.current_quantity) - (Number(mapping.quantity_required) * item.quantity);
        const { error: updateErr } = await supabase.from("inventory_items").update({ current_quantity: newQty, updated_at: new Date().toISOString() }).eq("id", mapping.inventory_item_id);
        if (updateErr) throw updateErr;
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("inventory_changes").insert([{ inventory_item_id: mapping.inventory_item_id, change_type: 'Order Production', quantity_change: -(Number(mapping.quantity_required) * item.quantity), quantity_before: Number(inv.current_quantity), quantity_after: newQty, reason: `Automatic deduction for order ${orderId}`, changed_by: user?.id }]);
      }
    }
  },

  // ── Payments ─────────────────────────────────────────────────────────
  async recordPayment(orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const {error: payErr} = await supabase.from("payments").insert([{ order_id: orderId, ...payment, received_by: user.id }]);
    if (payErr) throw payErr;
    const {data: order} = await supabase.from("orders").select("amount_paid, total_amount").eq("id", orderId).single();
    if (order) {
      const newPaid = parseFloat(order.amount_paid) + payment.amount;
      const total = parseFloat(order.total_amount);
      const ps = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid";
      await supabase.from("orders").update({amount_paid: newPaid, payment_status: ps}).eq("id", orderId);
    }
  },

  async getPayments(orderId: string) {
    const {data, error} = await supabase.from("payments").select("*").eq("order_id", orderId).order("created_at", {ascending: false});
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CART
  // ═══════════════════════════════════════════════════════════════════════════
  async getCart() {
    const {data, error} = await supabase.from("cart_items").select("*, product:product_id(id, name, description, category, size_spec, variant, final_price)").order("created_at", {ascending: false});
    if (error) throw error;
    return data || [];
  },

  async addToCart(productId: string, quantity: number = 1, forceNewRow: boolean = false, specifications?: string, fileUrl?: string) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    if (!forceNewRow) {
      const {data: existingList, error: queryErr} = await supabase.from("cart_items").select("id, quantity").eq("customer_id", user.id).eq("product_id", productId).order("created_at", {ascending: false}).limit(1);
      if (!queryErr && existingList && existingList.length > 0) {
        const existing = existingList[0];
        const {data, error} = await supabase.from("cart_items").update({quantity: existing.quantity + quantity, specifications, file_url: fileUrl}).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      }
    }
    const {data, error} = await supabase.from("cart_items").insert([{customer_id: user.id, product_id: productId, quantity, specifications, file_url: fileUrl || null}]).select().single();
    if (error) throw error;
    return data;
  },

  async updateCartItem(cartItemId: string, updates: {quantity?: number; specifications?: string; fileUrl?: string; file_url?: string}) {
    const dbUpdates: any = { ...updates };
    if ('fileUrl' in dbUpdates) { dbUpdates.file_url = dbUpdates.fileUrl; delete dbUpdates.fileUrl; }
    const {data, error} = await supabase.from("cart_items").update(dbUpdates).eq("id", cartItemId).select().single();
    if (error) throw error;
    return data;
  },

  async removeCartItem(cartItemId: string) {
    const {error} = await supabase.from("cart_items").delete().eq("id", cartItemId);
    if (error) throw error;
  },

  async clearCart() {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const {error} = await supabase.from("cart_items").delete().eq("customer_id", user.id);
    if (error) throw error;
  },

  async checkout(specialInstructions?: string, dueDate?: string) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const cartItems = await db.getCart();
    if (!cartItems.length) throw new Error("Cart is empty");
    const order = await db.createOrder({ customer_id: user.id, order_type: "online", special_instructions: specialInstructions, due_date: dueDate, design_file_url: cartItems[0]?.file_url, items: cartItems.map((ci) => ({ product_id: ci.product_id, product_name: ci.product?.name || "Unknown", quantity: ci.quantity, unit_price: parseFloat(ci.product?.final_price || "0"), specifications: ci.specifications, file_url: ci.file_url })) });
    await db.clearCart();
    return order;
  },

  async getStaffList() {
    const {data, error} = await supabase.from("users").select("id, first_name, last_name, role").in("role", ["designer", "production", "admin"]).eq("is_active", true).order("role").order("first_name");
    if (error) throw error;
    return data || [];
  },

  async deleteInventoryItem(id: string) {
    const {error} = await supabase.from("inventory_items").update({is_active: false}).eq("id", id);
    if (error) throw error;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS WITH BOM
  // ═══════════════════════════════════════════════════════════════════════════
  async getProductsWithBOM() {
    const {data, error} = await supabase.from("products").select("*, product_supply_mapping(id, inventory_item_id, quantity_required, inventory_items:inventory_item_id(id, name, unit_of_measure, unit_cost))").order("category").order("name");
    if (error) throw error;
    return data || [];
  },

  async createProductWithBOM(product: { name: string; category?: string; variant?: string; size_spec?: string; material_cost: number; profit_fee: number; final_price: number; description?: string }, bom: {inventory_item_id: string; quantity_required: number}[]) {
    const {data: p, error: pErr} = await supabase.from("products").insert([{...product, is_active: true}]).select().single();
    if (pErr) throw pErr;
    if (bom.length > 0) { const rows = bom.map((b) => ({product_id: p.id, ...b})); const {error: bErr} = await supabase.from("product_supply_mapping").insert(rows); if (bErr) throw bErr; }
    return p;
  },

  async updateProductWithBOM(id: string, product: Record<string, any>, bom?: {inventory_item_id: string; quantity_required: number}[]) {
    product.updated_at = new Date().toISOString();
    const {data, error} = await supabase.from("products").update(product).eq("id", id).select().single();
    if (error) throw error;
    if (bom !== undefined) {
      await supabase.from("product_supply_mapping").delete().eq("product_id", id);
      if (bom.length > 0) { const rows = bom.map((b) => ({product_id: id, ...b})); await supabase.from("product_supply_mapping").insert(rows); }
    }
    return data;
  },

  async deleteProduct(id: string) {
    const {error} = await supabase.from("products").update({is_active: false, updated_at: new Date().toISOString()}).eq("id", id);
    if (error) throw error;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERIES
  // ═══════════════════════════════════════════════════════════════════════════
  async getDeliveries(filters?: {status?: string}) {
    let query = supabase.from("deliveries").select(`*, inventory_item:inventory_item_id(id, name, unit_of_measure, purchase_unit, conversion_rate), supplier:supplier_id(id, name), requester:requested_by(id, first_name, last_name)`).order("created_at", {ascending: false});
    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  async createDelivery(d: { inventory_item_id: string; supplier_id?: string; requested_quantity: number; expected_arrival_date?: string; notes?: string }) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const {data, error} = await supabase.from("deliveries").insert([{ ...d, requested_by: user.id, status: "requested" }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateDelivery(id: string, updates: Record<string, any>) {
    updates.updated_at = new Date().toISOString();
    const {data, error} = await supabase.from("deliveries").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async confirmDeliveryReceipt(id: string, receipt: { received_quantity: number; receipt_reference_number: string }) {
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const {data: delivery, error: dErr} = await supabase.from("deliveries").update({ status: "received", received_quantity: receipt.received_quantity, receipt_reference_number: receipt.receipt_reference_number, received_date: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("*, inventory_item:inventory_item_id(id, conversion_rate, current_quantity)").single();
    if (dErr) throw dErr;
    const item = delivery.inventory_item;
    const conversionRate = Number(item.conversion_rate) || 1;
    const addQty = receipt.received_quantity * conversionRate;
    const newQty = Number(item.current_quantity) + addQty;
    const {error: iErr} = await supabase.from("inventory_items").update({current_quantity: newQty, updated_at: new Date().toISOString()}).eq("id", item.id);
    if (iErr) throw iErr;
    await supabase.from("inventory_changes").insert([{ inventory_item_id: item.id, change_type: "Manual Adjustment", quantity_change: addQty, quantity_before: Number(item.current_quantity), quantity_after: newQty, reason: `Delivery receipt #${receipt.receipt_reference_number}`, changed_by: user.id }]);
    return delivery;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════════════
  chat: {
    async getConversations() {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) return [];
      const {data, error} = await supabase.from("chat_messages").select(`id, sender_id, receiver_id, message, sent_at, sender:sender_id(id, first_name, last_name, role), receiver:receiver_id(id, first_name, last_name, role)`).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("sent_at", {ascending: false});
      if (error) throw error;
      if (!data) return [];
      const conversationsMap = new Map<string, any>();
      for (const msg of data as any[]) {
        const isSender = msg.sender_id === user.id;
        const otherProfile = isSender ? msg.receiver : msg.sender;
        const otherId = isSender ? msg.receiver_id : msg.sender_id;
        if (!otherId) continue;
        if (conversationsMap.has(otherId)) continue;
        conversationsMap.set(otherId, { id: otherId, userId: otherId, displayName: otherProfile ? `${otherProfile.first_name || ""} ${otherProfile.last_name || ""}`.trim() : "Unknown User", userRole: otherProfile?.role || "user", lastMessage: msg.message, lastMessageTime: new Date(msg.sent_at).toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" }), unreadCount: 0, isActive: true, messages: [] });
      }
      return Array.from(conversationsMap.values());
    },

    async getMessages(otherUserId: string) {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) return [];
      const {data, error} = await supabase.from("chat_messages").select(`id, sender_id, message, attachment_url, sent_at, sender:sender_id(first_name, last_name, role)`).or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`).order("sent_at", {ascending: true});
      if (error) throw error;
      if (!data) return [];
      const STAFF_ROLES = ["admin", "cashier", "designer", "production"];
      return data.map((msg: any) => ({ id: msg.id, senderId: msg.sender_id, senderName: msg.sender ? `${msg.sender.first_name || ""} ${msg.sender.last_name || ""}`.trim() : "Unknown", content: msg.message, attachmentUrl: msg.attachment_url || undefined, timestamp: new Date(msg.sent_at).toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }), isFromAdmin: STAFF_ROLES.includes((msg.sender?.role || "").toLowerCase()) }));
    },

    async sendMessage(receiverId: string, message: string, orderId?: string, attachmentUrl?: string) {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {data, error} = await supabase.from("chat_messages").insert([{ sender_id: user.id, receiver_id: receiverId, message, order_id: orderId || null, attachment_url: attachmentUrl || null }]).select().single();
      if (error) throw error;
      return data;
    },

    async uploadChatImage(file: File): Promise<string> {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (file.size > 2 * 1024 * 1024) throw new Error("Image must be under 2 MB");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const {error: upErr} = await supabase.storage.from("chat-attachments").upload(path, file, {upsert: false});
      if (upErr) throw upErr;
      const {data: urlData} = supabase.storage.from("chat-attachments").getPublicUrl(path);
      return urlData.publicUrl;
    },

    subscribeToMessages(callback: (payload: any) => void) {
      return supabase.channel("chat_messages_realtime").on("postgres_changes", {event: "INSERT", schema: "public", table: "chat_messages"}, callback).subscribe();
    },

    async getPotentialRecipients(currentUserRole: string) {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) return [];
      const STAFF_ROLES = ["admin", "cashier", "designer", "production"];
      const isStaff = STAFF_ROLES.includes((currentUserRole || "").toLowerCase());
      let query = supabase.from("users").select("id, first_name, last_name, role").eq("is_active", true).neq("id", user.id);
      if (!isStaff) { query = query.in("role", ["admin", "cashier", "designer", "production", "Admin", "Cashier", "Designer", "Production"]); }
      const {data, error} = await query.order("first_name");
      if (error) throw error;
      if (!data) return [];
      return data.map((u: any) => ({ userId: u.id, displayName: `${u.first_name || ""} ${u.last_name || ""}`.trim(), userRole: u.role }));
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYROLL
  // ═══════════════════════════════════════════════════════════════════════════
  payroll: {
    async getPeriods() {
      const {data, error} = await supabase.from("payroll_periods").select("*").order("period_start", {ascending: false});
      if (error) throw error;
      return data || [];
    },

    // createPeriod kept for edge function compatibility — UI no longer exposes this
    async createPeriod(period: { period_start: string; period_end: string; pay_date?: string }) {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {data, error} = await supabase.from("payroll_periods").insert([{...period, status: "draft", created_by: user.id}]).select().single();
      if (error) throw error;
      return data;
    },

    async updatePeriod(id: string, updates: Record<string, any>) {
      const {data, error} = await supabase.from("payroll_periods").update({...updates, updated_at: new Date().toISOString()}).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },

    // Only allowed when period is still 'draft' — deletes period + all related records/logs
    async deletePeriod(id: string) {
      // Verify it's still draft before deleting
      const {data: period} = await supabase.from("payroll_periods").select("status").eq("id", id).single();
      if (period?.status !== "draft") throw new Error("Only draft periods can be deleted.");

      // Reset any CAs that were issued in this period back to approved
      await supabase.from("cash_advances").update({ status: "approved", payroll_period_id: null, updated_at: new Date().toISOString() }).eq("status", "added_to_current_payroll").eq("payroll_period_id", id);

      // Delete related data in order
      await supabase.from("payroll_records").delete().eq("payroll_period_id", id);
      await supabase.from("attendance_logs").delete().eq("payroll_period_id", id);
      await supabase.from("attendance_summary_imports").delete().eq("payroll_period_id", id);

      const {error} = await supabase.from("payroll_periods").delete().eq("id", id);
      if (error) throw error;
    },

    async getAttendanceLogs(periodId: string) {
      const {data, error} = await supabase.from("attendance_logs").select(`*, employee:employee_id(id, employee_code, full_name, position, base_hourly_rate, holiday_rate_multiplier, overtime_rate_multiplier)`).eq("payroll_period_id", periodId).order("created_at");
      if (error) throw error;
      return data || [];
    },

    async upsertAttendanceLog(log: { employee_id: string; payroll_period_id: string; worked_hours?: number; required_hours?: number; days_present?: number; late_timeslots?: number; early_leave_timeslots?: number; regular_overtime_hours?: number; holiday_overtime_hours?: number; special_overtime_hours?: number; business_trip_days?: number; absences?: number; on_leave_days?: number; additional_pay?: number; deduction_amount?: number }) {
      const {data, error} = await supabase.from("attendance_logs").upsert([{...log, updated_at: new Date().toISOString()}], {onConflict: "employee_id,payroll_period_id"}).select().single();
      if (error) throw error;
      return data;
    },

    async getPayrollRecords(periodId: string) {
      const {data, error} = await supabase.from("payroll_records").select(`*, employee:employee_id(id, employee_code, full_name, position)`).eq("payroll_period_id", periodId).order("created_at");
      if (error) throw error;
      return data || [];
    },

    async updatePayrollRecord(id: string, updates: Record<string, any>) {
      const {data, error} = await supabase.from("payroll_records").update({...updates, updated_at: new Date().toISOString()}).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },

    async computePayroll(periodId: string) {
      const {data: logs, error} = await supabase.from("attendance_logs").select(`*, employee:employee_id(id, employee_code, base_hourly_rate)`).eq("payroll_period_id", periodId);
      if (error) throw error;

      const results = [];

      for (const log of logs || []) {
        const emp = log.employee;
        if (!emp) continue;

        const dailyRate  = Number(emp.base_hourly_rate) || 0;
        const hourlyRate = dailyRate / 8;

        const daysPresent = Number(log.days_present) > 0
          ? Number(log.days_present)
          : Number(log.worked_hours) > 0
            ? Math.round(Number(log.worked_hours) / 8)
            : 0;

        const basicPay         = dailyRate * daysPresent;
        const regularHolidayPay = 0;
        const specialHolidayPay = 0;
        const regularOT         = hourlyRate * 1.25 * Number(log.regular_overtime_hours || 0);
        const holidayOT         = hourlyRate * 1.6  * Number(log.holiday_overtime_hours || 0);
        const specialOT         = hourlyRate * 1.3  * Number(log.special_overtime_hours || 0);

        const grossIncome = basicPay + regularHolidayPay + specialHolidayPay + regularOT + holidayOT + specialOT + Number(log.additional_pay || 0);

        const tardyDeductions      = hourlyRate * 0.5 * Number(log.late_timeslots || 0);
        const undertimeDeductions  = hourlyRate * 0.5 * Number(log.early_leave_timeslots || 0);

        const monthlyBasic  = dailyRate * 26;
        const philhealth    = Math.round((monthlyBasic * 0.015) / 5) * 5;
        const hdmf          = 200;
        const withholdingTax = 0;
        const sss            = 0;

        // ── CASH ADVANCE — DEFERRED DEDUCTION SYSTEM ─────────────────────────
        // Core rule: A CA requested in Period N is NEVER deducted in Period N.
        //            Step 1 issues CAs whose date_issued is WITHIN this period.
        //            Step 2 deducts CAs linked to the PREVIOUS period ID.
        //            Since periodId ≠ prevPeriod.id, same-run deduction is impossible.
        const MAX_ADVANCE = 2000;

        // Fetch this period's full date range
        const {data: thisPeriod} = await supabase.from("payroll_periods").select("id, period_start, period_end").eq("id", periodId).single();
        const periodStart = thisPeriod?.period_start as string;
        const periodEnd   = thisPeriod?.period_end   as string;

        // Find the previous period from the DB (no date arithmetic needed)
        const {data: prevPeriod} = await supabase.from("payroll_periods").select("id, period_start, period_end").lt("period_end", periodStart).order("period_end", {ascending: false}).limit(1).maybeSingle();

        // ── STEP 1: Issue approved CAs whose date_issued falls IN this period ──
        // KEY: date filter ensures computing Period B never touches Period A's CAs
        const {data: approvedCAs} = await supabase
          .from("cash_advances")
          .select("id, amount")
          .eq("employee_id", emp.id)
          .eq("status", "approved")
          .gte("date_issued", periodStart)   // must belong to THIS period
          .lte("date_issued", periodEnd);    // not before or after

        const cashAdvanceIssued = Math.min(
          (approvedCAs || []).reduce((s: number, a: any) => s + Number(a.amount), 0),
          MAX_ADVANCE
        );

        if (approvedCAs && approvedCAs.length > 0) {
          await supabase.from("cash_advances").update({
            status: "added_to_current_payroll",
            payroll_period_id: periodId,
            updated_at: new Date().toISOString(),
          }).in("id", (approvedCAs as any[]).map((a: any) => a.id));
        }

        // ── STEP 2: Deduct CAs issued in the PREVIOUS period ─────────────────
        let cashAdvanceDeduction = 0;
        if (prevPeriod) {
          const {data: prevIssuedCAs} = await supabase
            .from("cash_advances")
            .select("id, amount")
            .eq("employee_id", emp.id)
            .eq("status", "added_to_current_payroll")
            .eq("payroll_period_id", prevPeriod.id);  // previous period ONLY

          cashAdvanceDeduction = Math.min(
            (prevIssuedCAs || []).reduce((s: number, a: any) => s + Number(a.amount), 0),
            MAX_ADVANCE
          );

          if (prevIssuedCAs && prevIssuedCAs.length > 0) {
            await supabase.from("cash_advances").update({
              status: "deducted",
              updated_at: new Date().toISOString(),
            }).in("id", (prevIssuedCAs as any[]).map((a: any) => a.id));
          }
        }

        // ── Carry-over from previous payroll record ──────────────────────────
        const {data: prevRecord} = await supabase.from("payroll_records").select("carry_over_deduction").eq("employee_id", emp.id).neq("payroll_period_id", periodId).order("created_at", {ascending: false}).limit(1).maybeSingle();
        const carryOverFromPrevious = Number(prevRecord?.carry_over_deduction) || 0;

        const totalDeductions = tardyDeductions + undertimeDeductions + withholdingTax + cashAdvanceDeduction + carryOverFromPrevious + philhealth + hdmf;

        const netPayRaw     = grossIncome - totalDeductions;
        const netPay        = Math.max(0, netPayRaw);
        const carryOver     = netPayRaw < 0 ? Math.abs(netPayRaw) : 0;
        const taxableIncome = grossIncome - philhealth - hdmf;

        const {data: saved, error: saveErr} = await supabase.from("payroll_records").upsert([{
          payroll_period_id: periodId,
          employee_id: emp.id,
          daily_rate: dailyRate, days_present: daysPresent,
          basic_pay: basicPay, regular_holiday_pay: regularHolidayPay, special_holiday_pay: specialHolidayPay,
          regular_overtime: regularOT, holiday_overtime: holidayOT, special_overtime: specialOT,
          gross_income: grossIncome,
          tardy_deductions: tardyDeductions, undertime_deductions: undertimeDeductions,
          sss, philhealth, hdmf, withholding_tax: withholdingTax,
          cash_advance: cashAdvanceDeduction,      // deduction from PREVIOUS period CAs
          cash_advance_issued: cashAdvanceIssued,  // issued THIS period (employee received ₱)
          total_deductions: totalDeductions,
          net_pay: netPay, taxable_income: taxableIncome,
          carry_over_deduction: carryOver, carry_over_from_previous: carryOverFromPrevious,
          status: "pending",
          updated_at: new Date().toISOString(),
        }], {onConflict: "employee_id,payroll_period_id"}).select().single();

        if (saveErr) throw saveErr;
        results.push(saved);
      }

      return results;
    },

    // ── Reset payroll computation for a period ────────────────────────────
    // Completely undoes computePayroll so it can be re-run on the correct period.
    async resetPayroll(periodId: string) {
      // 1. Delete all payroll_records for this period
      const {error: delErr} = await supabase.from("payroll_records").delete().eq("payroll_period_id", periodId);
      if (delErr) throw delErr;

      // 2. CAs issued in this period → back to 'approved' (undo issuing)
      const {data: issuedCAs} = await supabase.from("cash_advances").select("id").eq("status", "added_to_current_payroll").eq("payroll_period_id", periodId);
      if (issuedCAs && issuedCAs.length > 0) {
        await supabase.from("cash_advances").update({ status: "approved", payroll_period_id: null, updated_at: new Date().toISOString() }).in("id", (issuedCAs as any[]).map((a: any) => a.id));
      }

      // 3. CAs deducted by this period → back to 'added_to_current_payroll'
      //    Find the previous period, then restore its CAs that were deducted
      const {data: thisPeriodData} = await supabase.from("payroll_periods").select("period_start").eq("id", periodId).single();
      if (thisPeriodData) {
        const {data: prevPeriodData} = await supabase.from("payroll_periods").select("id").lt("period_end", thisPeriodData.period_start).order("period_end", {ascending: false}).limit(1).maybeSingle();
        if (prevPeriodData) {
          await supabase.from("cash_advances").update({ status: "added_to_current_payroll", updated_at: new Date().toISOString() }).eq("status", "deducted").eq("payroll_period_id", prevPeriodData.id);
        }
      }

      return {success: true};
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CASH ADVANCES
  // ═══════════════════════════════════════════════════════════════════════════
  cashAdvances: {
    async getAll(filters?: {employee_id?: string; status?: string}) {
      let query = supabase.from("cash_advances").select(`*, employee:employee_id(id, employee_code, full_name, position), issuer:issued_by(id, first_name, last_name)`).order("created_at", {ascending: false});
      if (filters?.employee_id) query = query.eq("employee_id", filters.employee_id);
      if (filters?.status) query = query.eq("status", filters.status);
      const {data, error} = await query;
      if (error) throw error;
      return data || [];
    },

    async create(advance: {employee_id: string; amount: number; date_issued?: string; reason?: string}) {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {data, error} = await supabase.from("cash_advances").insert([{ ...advance, date_issued: advance.date_issued || new Date().toISOString().split("T")[0], status: "pending", issued_by: user.id }]).select(`*, employee:employee_id(id, employee_code, full_name, position), issuer:issued_by(id, first_name, last_name)`).single();
      if (error) throw error;
      return data;
    },

    async cancel(id: string) {
      const {data, error} = await supabase.from("cash_advances").update({status: "cancelled", updated_at: new Date().toISOString()}).eq("id", id).eq("status", "pending").select().single();
      if (error) throw error;
      return data;
    },

    async approve(id: string) {
      const {data, error} = await supabase.from("cash_advances").update({status: "approved", updated_at: new Date().toISOString()}).eq("id", id).eq("status", "pending").select().single();
      if (error) throw error;
      return data;
    },

    async decline(id: string, declineReason: string) {
      const {data, error} = await supabase.from("cash_advances").update({ status: "declined", decline_reason: declineReason, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending").select().single();
      if (error) throw error;
      return data;
    },

    async getPendingRequests() {
      const {data, error} = await supabase.from("cash_advances").select(`*, employee:employee_id(id, employee_code, full_name, position, base_hourly_rate), issuer:issued_by(id, first_name, last_name)`).eq("status", "pending").order("created_at", {ascending: true});
      if (error) throw error;
      return data || [];
    },

    async checkEligibility(employeeId: string): Promise<{ eligible: boolean; reason: "eligible" | "limit_reached" | "restricted_next_period" | "approved_awaiting_deduction"; remaining: number; totalUsed: number; detail?: {amount: number; date_issued: string; periodLabel?: string} }> {
      const MAX = 2000;
      const today = new Date().toISOString().split("T")[0];

      const {data: currentPeriodRow} = await supabase.from("payroll_periods").select("id, period_start, period_end").lte("period_start", today).gte("period_end", today).order("period_start", {ascending: false}).limit(1).maybeSingle();

      const getCalendarBounds = () => {
        const d = new Date(); const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
        if (day <= 15) return { currentStart: new Date(y, m, 1).toISOString().split("T")[0], currentEnd: new Date(y, m, 15).toISOString().split("T")[0] };
        const last = new Date(y, m + 1, 0).getDate();
        return { currentStart: new Date(y, m, 16).toISOString().split("T")[0], currentEnd: new Date(y, m, last).toISOString().split("T")[0] };
      };

      const currentPeriodId = currentPeriodRow?.id ?? null;
      const {currentStart, currentEnd} = currentPeriodRow ? { currentStart: currentPeriodRow.period_start, currentEnd: currentPeriodRow.period_end } : getCalendarBounds();

      // Rule 1: Restricted — has CA issued in a previous period not yet deducted
      const restrictedQuery = supabase.from("cash_advances").select("id, amount, date_issued, payroll_period_id").eq("employee_id", employeeId).eq("status", "added_to_current_payroll");
      const {data: restrictedCAs} = currentPeriodId ? await restrictedQuery.neq("payroll_period_id", currentPeriodId) : await restrictedQuery.lt("date_issued", currentStart);
      if (restrictedCAs && restrictedCAs.length > 0) {
        const prevTotal = (restrictedCAs as any[]).reduce((s: number, a: any) => s + Number(a.amount), 0);
        const rec = (restrictedCAs as any[])[0];
        return { eligible: false, reason: "restricted_next_period", remaining: 0, totalUsed: 0, detail: {amount: prevTotal, date_issued: rec.date_issued} };
      }

      // Rule 2: Period limit
      const {data: pendingApproved} = await supabase.from("cash_advances").select("amount").eq("employee_id", employeeId).in("status", ["pending", "approved"]);
      const issuedCurrentQuery = supabase.from("cash_advances").select("amount").eq("employee_id", employeeId).eq("status", "added_to_current_payroll");
      const {data: issuedCurrent} = currentPeriodId ? await issuedCurrentQuery.eq("payroll_period_id", currentPeriodId) : await issuedCurrentQuery.gte("date_issued", currentStart).lte("date_issued", currentEnd);

      const totalUsed = [...(pendingApproved || []), ...(issuedCurrent || [])].reduce((s: number, a: any) => s + Number(a.amount), 0);
      const remaining = Math.max(0, MAX - totalUsed);
      if (remaining <= 0) return { eligible: false, reason: "limit_reached", remaining: 0, totalUsed };
      return { eligible: true, reason: "eligible", remaining, totalUsed };
    },

    async requestByCashier(data: { employee_id: string; amount: number; reason?: string }) {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const MAX_AMOUNT = 2000;
      const amount = Math.round(data.amount);
      if (amount <= 0 || amount > MAX_AMOUNT) throw new Error(`Amount must be between ₱1 and ₱${MAX_AMOUNT.toLocaleString()}`);

      const today = new Date().toISOString().split("T")[0];
      const {data: currentPeriodRow} = await supabase.from("payroll_periods").select("id, period_start, period_end").lte("period_start", today).gte("period_end", today).order("period_start", {ascending: false}).limit(1).maybeSingle();
      const currentPeriodId = currentPeriodRow?.id ?? null;
      const d = new Date(); const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
      const currentStart = currentPeriodRow?.period_start ?? (day <= 15 ? new Date(y, m, 1).toISOString().split("T")[0] : new Date(y, m, 16).toISOString().split("T")[0]);

      const restrictedQuery = supabase.from("cash_advances").select("id").eq("employee_id", data.employee_id).eq("status", "added_to_current_payroll");
      const {data: restrictedCAs} = currentPeriodId ? await restrictedQuery.neq("payroll_period_id", currentPeriodId) : await restrictedQuery.lt("date_issued", currentStart);
      if ((restrictedCAs?.length ?? 0) > 0) throw new Error("Employee had a Cash Advance issued in the previous payroll period. They must wait until that deduction is processed before requesting again.");

      const {data: pendingApproved} = await supabase.from("cash_advances").select("amount").eq("employee_id", data.employee_id).in("status", ["pending", "approved"]);
      const issuedCurrentQuery = supabase.from("cash_advances").select("amount").eq("employee_id", data.employee_id).eq("status", "added_to_current_payroll");
      const {data: issuedCurrent} = currentPeriodId ? await issuedCurrentQuery.eq("payroll_period_id", currentPeriodId) : await issuedCurrentQuery.gte("date_issued", currentStart);
      const periodTotal = [...(pendingApproved || []), ...(issuedCurrent || [])].reduce((s: number, a: any) => s + Number(a.amount), 0);
      if (periodTotal + amount > MAX_AMOUNT) throw new Error(`This request would exceed the ₱${MAX_AMOUNT.toLocaleString()} period limit. Remaining: ₱${(MAX_AMOUNT - periodTotal).toLocaleString()}`);

      const {data: result, error} = await supabase.from("cash_advances").insert([{ employee_id: data.employee_id, amount, date_issued: new Date().toISOString().split("T")[0], reason: data.reason || null, status: "pending", issued_by: user.id, requested_by_cashier: user.id }]).select(`*, employee:employee_id(id, employee_code, full_name, position), issuer:issued_by(id, first_name, last_name)`).single();
      if (error) throw error;
      return result;
    },

    async getPendingCount(): Promise<number> {
      const {count, error} = await supabase.from("cash_advances").select("id", {count: "exact", head: true}).eq("status", "pending");
      if (error) return 0;
      return count ?? 0;
    },

    async getPendingTotal(employeeId: string): Promise<number> {
      const {data, error} = await supabase.from("cash_advances").select("amount").eq("employee_id", employeeId).eq("status", "pending");
      if (error) throw error;
      return (data || []).reduce((s, a) => s + Number(a.amount), 0);
    },
  },
};

//TEST