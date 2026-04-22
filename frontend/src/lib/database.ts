// frontend/src/lib/database.ts
// Direct Supabase queries — NO Express middleman
// RLS handles all security. This file is the ONLY data access layer.

import {supabase} from "../config/supabaseClient";

/**
 * Uploads a file to the 'order-files' storage bucket.
 * Organizes files by user ID and timestamp to avoid collisions.
 */
export async function uploadOrderFile(file: File): Promise<string> {
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate file size (2MB limit as per UI)
  if (file.size > 2 * 1024 * 1024)
    throw new Error("File size exceeds 2MB limit");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  const filePath = `customer-uploads/${fileName}`;

  const {error: uploadError} = await supabase.storage
    .from("order-files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }

  const {
    data: {publicUrl},
  } = supabase.storage.from("order-files").getPublicUrl(filePath);

  return publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (own profile — admin CRUD uses backend /api/admin/*)
// ═══════════════════════════════════════════════════════════════════════════════

// NOTE: logSystemAction() has been replaced by db.logAudit() below.
// It wrote auto-read notifications (is_read:true) as a fake audit trail.
// db.logAudit() writes to the dedicated audit_logs table instead.

export const db = {
  // ── Profile ────────────────────────────────────────────────────────────
  async getMyProfile() {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) return null;
    const {data} = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    return data;
  },

  async updateMyProfile(updates: {
    first_name?: string;
    last_name?: string;
    contact_number?: string;
    address?: string;
    email?: string;
  }) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Sync name to auth metadata so AuthContext stays fresh
    if (updates.first_name !== undefined || updates.last_name !== undefined) {
      await supabase.auth.updateUser({
        data: {first_name: updates.first_name, last_name: updates.last_name},
      });
    }

    const {data, error} = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMyPassword(newPassword: string) {
    const {error} = await supabase.auth.updateUser({password: newPassword});
    if (error) throw error;
  },

  // ── User-facing unread notification (is_read: false) ───────────────────
  // Use this for real events (messages received, order updates, etc.)
  // Starts as unread so it appears in the user's notification badge.
  async notifyUser(
    userId: string,
    module: string,
    title: string,
    message: string,
  ) {
    try {
      await supabase.from("notifications").insert([
        {
          user_id: userId,
          related_module: module,
          title,
          message,
          is_read: false,
        },
      ]);
    } catch (err) {
      console.error("notifyUser error:", err);
    }
  },

  // ── Structured audit log (admin-visible, writes to audit_logs table) ────
  // Use this for staff actions: creates, updates, deletes, flags, payments.
  // Requires migration_audit_logs_and_production_fk.sql to be run first.
  async logAudit(
    action: string,
    targetTable?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return;
      const {data: profile} = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role?.toLowerCase() || "unknown";
      if (role === "customer" || role === "unknown") return;

      await supabase.from("audit_logs").insert([
        {
          actor_id: user.id,
          actor_role: profile?.role || "unknown",
          action,
          target_table: targetTable || null,
          target_id: targetId || null,
          metadata: metadata || null,
        },
      ]);
    } catch (err) {
      console.error("logAudit error:", err);
    }
  },

  // ── Users list (staff can read all via RLS) ────────────────────────────
  async getUsers(filters?: {role?: string; status?: string}) {
    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", {ascending: false});
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
    const {data, error} = await supabase
      .from("employees")
      .select("*")
      .order("employee_code");
    if (error) throw error;
    return data || [];
  },

  async createEmployee(emp: {
    employee_code?: string;
    full_name: string;
    position: string;
    role?: string;
    base_hourly_rate?: number;
    hire_date?: string;
  }) {
    const {data, error} = await supabase
      .from("employees")
      .insert([
        {
          ...emp,
          is_active: true,
          base_hourly_rate: emp.base_hourly_rate || 0,
          hire_date: emp.hire_date || new Date().toISOString().split("T")[0],
          role: emp.role || "Production", // Default to Production if not specified
        },
      ])
      .select()
      .single();
    if (error) throw error;
    await db.logAudit("employee.create", "employees", data?.id, {
      full_name: emp.full_name,
      position: emp.position,
      employee_code: emp.employee_code,
    });
    return data;
  },

  async updateEmployee(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLIERS
  // ═══════════════════════════════════════════════════════════════════════════
  async getSuppliers() {
    const {data, error} = await supabase
      .from("suppliers")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async createSupplier(s: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    const {data, error} = await supabase
      .from("suppliers")
      .insert([{...s, is_active: true, is_flagged: false}])
      .select()
      .single();
    if (error) throw error;
    await db.logAudit("supplier.create", "suppliers", data?.id, {
      name: s.name,
      contact_person: s.contact_person,
    });
    return data;
  },

  async updateSupplier(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase
      .from("suppliers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY
  // ═══════════════════════════════════════════════════════════════════════════
  async getInventoryItems() {
    const {data, error} = await supabase
      .from("inventory_items")
      .select(
        "*, item_suppliers(id, supplier_unit_price, lead_time_days, is_preferred, suppliers(id, name))",
      )
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async createInventoryItem(item: {
    name: string;
    unit_of_measure: string;
    current_quantity?: number;
    reorder_point?: number;
    unit_cost?: number;
    description?: string;
  }) {
    const {data, error} = await supabase
      .from("inventory_items")
      .insert([{...item, is_active: true}])
      .select()
      .single();
    if (error) throw error;
    await db.logAudit("inventory.create", "inventory_items", data?.id, {
      name: item.name,
      initial_qty: item.current_quantity || 0,
    });
    return data;
  },

  async updateInventoryItem(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════
  async getProducts(filters?: {category?: string; search?: string}) {
    let query = supabase
      .from("products")
      .select("*")
      .order("category")
      .order("name");
    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.search)
      query = query.or(
        `name.ilike.%${filters.search}%,category.ilike.%${filters.search}%`,
      );
    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  async createProduct(p: Record<string, any>) {
    const {data, error} = await supabase
      .from("products")
      .insert([{...p, is_active: true}])
      .select()
      .single();
    if (error) throw error;
    await db.logAudit("product.create", "products", data?.id, {
      name: p.name,
      category: p.category,
    });
    return data;
  },

  async updateProduct(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  async getOrders(filters?: {
    status?: string;
    assigned_designer?: string;
    assigned_production?: string;
  }) {
    let query = supabase
      .from("orders")
      .select(
        `
      *,
      customer:customer_id(id, first_name, last_name, email, contact_number),
      designer:assigned_designer(id, first_name, last_name),
      production_staff:assigned_production(id, full_name),
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications, file_url)
    `,
      )
      .order("created_at", {ascending: false});

    if (filters?.status && filters.status !== "all")
      query = query.eq("status", filters.status);
    if (filters?.assigned_designer)
      query = query.eq("assigned_designer", filters.assigned_designer);
    if (filters?.assigned_production)
      query = query.eq("assigned_production", filters.assigned_production);

    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrderById(id: string) {
    const {data, error} = await supabase
      .from("orders")
      .select(
        `
      *,
      customer:customer_id(id, first_name, last_name, email, contact_number),
      designer:assigned_designer(id, first_name, last_name),
      production_staff:assigned_production(id, full_name),
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications, file_url),
      payments(id, amount, payment_method, reference_number, notes, received_by, created_at)
    `,
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async createOrder(order: {
    customer_id?: string | null;
    guest_name?: string | null;
    guest_phone?: string | null;
    guest_email?: string | null;
    order_type: string;
    special_instructions?: string;
    due_date?: string;
    assigned_designer?: string;
    assigned_production?: string;
    comments?: string;
    items: {
      product_id?: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      specifications?: string;
      file_url?: string;
    }[];
  }) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Detect the creating actor's role to enable designer auto-assignment.
    // If a designer creates a walk-in order, they are auto-assigned and the
    // order skips the queue, going directly to 'designing' status.
    const {data: actorProfile} = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const isDesigner = actorProfile?.role?.toLowerCase() === "designer";

    // Generate order number
    let orderNumber: string;
    try {
      const {data: seq} = await supabase.rpc("get_next_order_seq");
      orderNumber = `ORD-${new Date().getFullYear()}-${String(seq ?? Date.now()).padStart(5, "0")}`;
    } catch {
      orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }

    const totalAmount = order.items.reduce(
      (s, i) => s + i.quantity * i.unit_price,
      0,
    );

    // Designer creating a walk-in order → self-assign, skip queue
    const resolvedDesigner = isDesigner
      ? order.assigned_designer || user.id
      : order.assigned_designer || null;
    const resolvedStatus = isDesigner ? "designing" : "in_queue";

    const {data: newOrder, error: orderErr} = await supabase
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          customer_id: order.customer_id || null,
          guest_name: order.guest_name || null,
          guest_phone: order.guest_phone || null,
          guest_email: order.guest_email || null,
          created_by: user.id,
          order_type: order.order_type || "walk-in",
          status: resolvedStatus,
          payment_status: "unpaid",
          special_instructions: order.special_instructions || null,
          comments: order.comments || null,
          due_date: order.due_date || null,
          total_amount: totalAmount,
          amount_paid: 0,
          assigned_designer: resolvedDesigner,
          assigned_production: order.assigned_production || null,
        },
      ])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert items
    const items = order.items.map((i) => ({
      order_id: newOrder.id,
      product_id: i.product_id || null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.quantity * i.unit_price,
      specifications: i.specifications || null,
      file_url: i.file_url || null,
    }));

    await supabase.from("order_items").insert(items);
    await db.logAudit("order.create", "orders", newOrder.id, {
      order_number: orderNumber,
      items: items.length,
      total: totalAmount,
    });
    return newOrder;
  },

  async updateOrder(id: string, updates: Record<string, any>) {
    const {data, error} = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteOrder(id: string) {
    const {data: order} = await supabase
      .from("orders")
      .select("order_number")
      .eq("id", id)
      .single();
    await supabase.from("payments").delete().eq("order_id", id);
    await supabase.from("order_items").delete().eq("order_id", id);
    const {error} = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
    if (order)
      await db.logAudit("order.delete", "orders", id, {
        order_number: order.order_number,
      });
  },

  async updateOrderItemFile(orderId: string, fileUrl: string) {
    // Update the file_url on the order items (Customer Design)
    const {error} = await supabase
      .from("order_items")
      .update({file_url: fileUrl})
      .eq("order_id", orderId);

    if (error) {
      console.error("Error updating order item file:", error);
      throw error;
    }
  },

  async directOrder(data: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    specifications?: string;
    fileUrl?: string;
    dueDate?: string;
  }) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    return await db.createOrder({
      customer_id: user.id,
      order_type: "online",
      due_date: data.dueDate,
      special_instructions: data.specifications,
      items: [
        {
          product_id: data.productId,
          product_name: data.productName,
          quantity: data.quantity,
          unit_price: data.unitPrice,
          specifications: data.specifications,
          file_url: data.fileUrl,
        },
      ],
    });
  },

  // ── Payments ─────────────────────────────────────────────────────────
  async recordPayment(
    orderId: string,
    payment: {
      amount: number;
      payment_method: string;
      reference_number?: string;
      receipt_number?: string;
      notes?: string;
    },
  ) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Insert payment
    const {error: payErr} = await supabase.from("payments").insert([
      {
        order_id: orderId,
        ...payment,
        received_by: user.id,
      },
    ]);
    if (payErr) throw payErr;

    // Log the payment
    const methodStr = payment.payment_method.toUpperCase();
    const refs = [];
    if (payment.reference_number) refs.push(`Ref: ${payment.reference_number}`);
    if (payment.receipt_number) refs.push(`Receipt: ${payment.receipt_number}`);
    await db.logAudit("payment.process", "payments", undefined, {
      order_id: orderId,
      amount: payment.amount,
      method: methodStr,
    });

    // Update order totals
    const {data: order} = await supabase
      .from("orders")
      .select("amount_paid, total_amount, order_id")
      .eq("id", orderId)
      .single();
    if (order) {
      const newPaid = parseFloat(order.amount_paid) + payment.amount;
      const total = parseFloat(order.total_amount);
      const ps = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid";
      await supabase
        .from("orders")
        .update({amount_paid: newPaid, payment_status: ps})
        .eq("id", orderId);

      // Also write to order_logs for order-specific trail
      await supabase.from("order_logs").insert([
        {
          order_id: orderId,
          updated_by: user.id,
          status: ps,
          note: `Payment of ₱${payment.amount.toLocaleString()} received via ${methodStr}.`,
        },
      ]);
    }
  },

  async getPayments(orderId: string) {
    const {data, error} = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", {ascending: false});
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CART (customer only — RLS enforces ownership)
  // ═══════════════════════════════════════════════════════════════════════════
  async getCart() {
    const {data, error} = await supabase
      .from("cart_items")
      .select(
        "*, product:product_id(id, name, description, category, size_spec, variant, final_price)",
      )
      .order("created_at", {ascending: false});
    if (error) throw error;
    return data || [];
  },

  async addToCart(
    productId: string,
    quantity: number = 1,
    forceNewRow: boolean = false,
    specifications?: string,
    fileUrl?: string,
  ) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (!forceNewRow) {
      // Find the most recent matching item to increment safely
      let query = supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("customer_id", user.id)
        .eq("product_id", productId);

      const {data: existingList, error: queryErr} = await query
        .order("created_at", {ascending: false})
        .limit(1);

      if (!queryErr && existingList && existingList.length > 0) {
        const existing = existingList[0];
        const {data, error} = await supabase
          .from("cart_items")
          .update({
            quantity: existing.quantity + quantity,
            specifications,
            file_url: fileUrl,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    // Insert as a new row (e.g., completely different design intent or brand new cart entry)
    const {data, error} = await supabase
      .from("cart_items")
      .insert([
        {
          customer_id: user.id,
          product_id: productId,
          quantity,
          specifications,
          file_url: fileUrl,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCartItem(
    cartItemId: string,
    updates: {quantity?: number; specifications?: string; file_url?: string},
  ) {
    const {data, error} = await supabase
      .from("cart_items")
      .update(updates)
      .eq("id", cartItemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeCartItem(cartItemId: string) {
    const {error} = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);
    if (error) throw error;
  },

  async clearCart() {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const {error} = await supabase
      .from("cart_items")
      .delete()
      .eq("customer_id", user.id);
    if (error) throw error;
  },

  async checkout(specialInstructions?: string, dueDate?: string) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const cartItems = await db.getCart();
    if (!cartItems.length) throw new Error("Cart is empty");

    const order = await db.createOrder({
      customer_id: user.id,
      order_type: "online",
      special_instructions: specialInstructions,
      due_date: dueDate,
      items: cartItems.map((ci) => ({
        product_id: ci.product_id,
        product_name: ci.product?.name || "Unknown",
        quantity: ci.quantity,
        unit_price: parseFloat(ci.product?.final_price || "0"),
        specifications: ci.specifications,
        file_url: ci.file_url,
      })),
    });

    await db.clearCart();
    return order;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF LIST (for assignment dropdowns)
  // ═══════════════════════════════════════════════════════════════════════════
  async getStaffList() {
    const {data, error} = await supabase
      .from("users")
      .select("id, first_name, last_name, role")
      .in("role", ["designer", "production", "admin"])
      .eq("is_active", true)
      .order("role")
      .order("first_name");
    if (error) throw error;
    return data || [];
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY — extended
  // ═══════════════════════════════════════════════════════════════════════════
  async deleteInventoryItem(id: string) {
    const {error} = await supabase
      .from("inventory_items")
      .update({is_active: false})
      .eq("id", id);
    if (error) throw error;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTS WITH BOM
  // ═══════════════════════════════════════════════════════════════════════════
  async getProductsWithBOM() {
    const {data, error} = await supabase
      .from("products")
      .select(
        "*, product_supply_mapping(id, inventory_item_id, quantity_required, inventory_items:inventory_item_id(id, name, unit_of_measure, unit_cost))",
      )
      .order("category")
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async createProductWithBOM(
    product: {
      name: string;
      category?: string;
      variant?: string;
      size_spec?: string;
      material_cost: number;
      profit_fee: number;
      final_price: number;
      description?: string;
    },
    bom: {inventory_item_id: string; quantity_required: number}[],
  ) {
    const {data: p, error: pErr} = await supabase
      .from("products")
      .insert([{...product, is_active: true}])
      .select()
      .single();
    if (pErr) throw pErr;

    if (bom.length > 0) {
      const rows = bom.map((b) => ({product_id: p.id, ...b}));
      const {error: bErr} = await supabase
        .from("product_supply_mapping")
        .insert(rows);
      if (bErr) throw bErr;
    }
    await db.logAudit("product.create", "products", p.id, {
      name: product.name,
      bom_items: bom.length,
    });
    return p;
  },

  async updateProductWithBOM(
    id: string,
    product: Record<string, any>,
    bom?: {inventory_item_id: string; quantity_required: number}[],
  ) {
    product.updated_at = new Date().toISOString();
    const {data, error} = await supabase
      .from("products")
      .update(product)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (bom !== undefined) {
      // Replace all BOM rows
      await supabase
        .from("product_supply_mapping")
        .delete()
        .eq("product_id", id);
      if (bom.length > 0) {
        const rows = bom.map((b) => ({product_id: id, ...b}));
        await supabase.from("product_supply_mapping").insert(rows);
      }
    }
    return data;
  },

  async deleteProduct(id: string) {
    const {error} = await supabase
      .from("products")
      .update({is_active: false, updated_at: new Date().toISOString()})
      .eq("id", id);
    if (error) throw error;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERIES
  // ═══════════════════════════════════════════════════════════════════════════
  async getDeliveries(filters?: {status?: string}) {
    let query = supabase
      .from("deliveries")
      .select(
        `
      *,
      inventory_item:inventory_item_id(id, name, unit_of_measure, purchase_unit, conversion_rate),
      supplier:supplier_id(id, name),
      requester:requested_by(id, first_name, last_name)
    `,
      )
      .order("created_at", {ascending: false});
    if (filters?.status && filters.status !== "all")
      query = query.eq("status", filters.status);
    const {data, error} = await query;
    if (error) throw error;
    return data || [];
  },

  async createDelivery(d: {
    inventory_item_id: string;
    supplier_id?: string;
    requested_quantity: number;
    expected_arrival_date?: string;
    notes?: string;
  }) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const {data, error} = await supabase
      .from("deliveries")
      .insert([
        {
          ...d,
          requested_by: user.id,
          status: "requested",
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDelivery(id: string, updates: Record<string, any>) {
    updates.updated_at = new Date().toISOString();
    const {data, error} = await supabase
      .from("deliveries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Confirm delivery receipt: update status + auto-restock inventory */
  async confirmDeliveryReceipt(
    id: string,
    receipt: {
      received_quantity: number;
      receipt_reference_number: string;
    },
  ) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Update delivery record
    const {data: delivery, error: dErr} = await supabase
      .from("deliveries")
      .update({
        status: "received",
        received_quantity: receipt.received_quantity,
        receipt_reference_number: receipt.receipt_reference_number,
        received_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "*, inventory_item:inventory_item_id(id, conversion_rate, current_quantity)",
      )
      .single();
    if (dErr) throw dErr;

    // 2. Auto-restock: received_qty * conversion_rate → add to current_quantity
    const item = delivery.inventory_item;
    const conversionRate = Number(item.conversion_rate) || 1;
    const addQty = receipt.received_quantity * conversionRate;
    const newQty = Number(item.current_quantity) + addQty;

    const {error: iErr} = await supabase
      .from("inventory_items")
      .update({current_quantity: newQty, updated_at: new Date().toISOString()})
      .eq("id", item.id);
    if (iErr) throw iErr;

    // 3. Log inventory change
    await supabase.from("inventory_changes").insert([
      {
        inventory_item_id: item.id,
        change_type: "Manual Adjustment",
        quantity_change: addQty,
        quantity_before: Number(item.current_quantity),
        quantity_after: newQty,
        reason: `Delivery receipt #${receipt.receipt_reference_number}`,
        changed_by: user.id,
      },
    ]);

    await db.logAudit("delivery.received", "deliveries", id, {
      item_id: item.id,
      added_qty: addQty,
      receipt_ref: receipt.receipt_reference_number,
    });
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
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return [];

      const {data, error} = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          message,
          sent_at,
          sender:sender_id(id, first_name, last_name, role),
          receiver:receiver_id(id, first_name, last_name, role)
        `,
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("sent_at", {ascending: false});

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
          displayName: otherProfile
            ? `${otherProfile.first_name || ""} ${otherProfile.last_name || ""}`.trim()
            : "Unknown User",
          userRole: otherProfile?.role || "user",
          lastMessage: msg.message,
          lastMessageTime: new Date(msg.sent_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
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
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return [];

      const {data, error} = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          sender_id,
          message,
          attachment_url,
          sent_at,
          sender:sender_id(first_name, last_name, role)
        `,
        )
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`,
        )
        .order("sent_at", {ascending: true});

      if (error) throw error;
      if (!data) return [];

      const STAFF_ROLES = ["admin", "cashier", "designer", "production"];

      return data.map((msg: any) => {
        // Supabase timestamps are UTC but lack the Z suffix — normalize so
        // JS interprets correctly regardless of client timezone.
        const rawTs: string = msg.sent_at || "";
        const utcTs =
          rawTs.includes("Z") || rawTs.includes("+")
            ? rawTs
            : rawTs.replace(" ", "T") + "Z";
        return {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender
            ? `${msg.sender.first_name || ""} ${msg.sender.last_name || ""}`.trim()
            : "Unknown",
          content: msg.message || "",
          attachmentUrl: msg.attachment_url || undefined,
          timestamp: new Date(utcTs).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          isFromAdmin: STAFF_ROLES.includes(
            (msg.sender?.role || "").toLowerCase(),
          ),
        };
      });
    },

    /**
     * Inserts a new message row. RLS enforces sender_id === auth.uid().
     */
    async sendMessage(
      receiverId: string,
      message: string,
      orderId?: string,
      attachmentUrl?: string,
    ) {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const {data, error} = await supabase
        .from("chat_messages")
        .insert([
          {
            sender_id: user.id,
            receiver_id: receiverId,
            message: message || "",
            attachment_url: attachmentUrl || null,
            order_id: orderId || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Notify receiver with an unread notification
      try {
        const senderRow = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        const senderName = senderRow.data
          ? `${senderRow.data.first_name || ""} ${senderRow.data.last_name || ""}`.trim()
          : "Someone";
        const preview = message ? message.substring(0, 80) : "📷 Image";
        await supabase.from("notifications").insert([
          {
            user_id: receiverId,
            related_module: "messages",
            related_id: data.id,
            title: `New message from ${senderName}`,
            message: preview,
            is_read: false,
          },
        ]);
      } catch {
        // Notification failure should not break messaging
      }

      return data;
    },

    /**
     * Uploads an image file to the chat-attachments Supabase Storage bucket.
     * Returns the public URL. Throws if file > 2 MB or bucket is missing.
     */
    async uploadChatImage(file: File): Promise<string> {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Image must be under 2 MB");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const {error: upErr} = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, {upsert: false});
      if (upErr) throw upErr;

      const {data: urlData} = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(path);
      return urlData.publicUrl;
    },

    /**
     * Opens a Supabase Realtime channel and calls `callback` whenever
     * a new row is inserted into chat_messages.
     * Returns the channel so the caller can `.unsubscribe()` on cleanup.
     */
    subscribeToMessages(callback: (payload: any) => void) {
      return supabase
        .channel("chat_messages_realtime")
        .on(
          "postgres_changes",
          {event: "INSERT", schema: "public", table: "chat_messages"},
          callback,
        )
        .subscribe();
    },

    /**
     * Returns the list of users that the current user is allowed to message.
     * Staff/Admins see ALL active users.
     * Customers only see active staff/admin users.
     */
    async getPotentialRecipients(currentUserRole: string) {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return [];

      const STAFF_ROLES = ["admin", "cashier", "designer", "production"];
      const isStaff = STAFF_ROLES.includes(
        (currentUserRole || "").toLowerCase(),
      );

      let query = supabase
        .from("users")
        .select("id, first_name, last_name, role")
        .eq("is_active", true)
        .neq("id", user.id); // never show yourself

      // Customers may only discover staff, not other customers
      // TST_07_03: Customers cannot start new conversations, so return empty list for them
      if (!isStaff) {
        return [];
      }

      const {data, error} = await query.order("first_name");
      if (error) throw error;
      if (!data) return [];

      return data.map((u: any) => ({
        userId: u.id,
        displayName: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
        userRole: u.role,
      }));
    },
  },

  // ── CASH ADVANCES ──────────────────────────────────────────────────
  cashAdvances: {

    async getAll(filters?: { employee_id?: string; status?: string }) {
      let query = supabase
        .from('cash_advances')
        .select(`
          *,
          employee:employee_id(id, employee_code, full_name, position),
          issuer:issued_by(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.status)      query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async create(advance: {
      employee_id: string;
      amount: number;
      date_issued?: string;
      reason?: string;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cash_advances')
        .insert([{
          ...advance,
          date_issued: advance.date_issued || new Date().toISOString().split('T')[0],
          status:      'pending',
          issued_by:   user.id,
        }])
        .select(`
          *,
          employee:employee_id(id, employee_code, full_name, position),
          issuer:issued_by(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },

    async cancel(id: string) {
      const { data, error } = await supabase
        .from('cash_advances')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending') // can only cancel pending advances
        .select().single();
      if (error) throw error;
      return data;
    },

    async approve(id: string) {
      const { data, error } = await supabase
        .from('cash_advances')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending')
        .select().single();
      if (error) throw error;
      return data;
    },

    async decline(id: string, declineReason: string) {
      const { data, error } = await supabase
        .from('cash_advances')
        .update({
          status:         'declined',
          decline_reason: declineReason,
          updated_at:     new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'pending')
        .select().single();
      if (error) throw error;
      return data;
    },

    async getPendingRequests() {
      const { data, error } = await supabase
        .from('cash_advances')
        .select(`
          *,
          employee:employee_id(
            id, employee_code, full_name, position, base_hourly_rate
          ),
          issuer:issued_by(id, first_name, last_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    // ── Cashier: check eligibility (returns boolean only, no amounts) ──────
    async checkEligibility(employeeId: string): Promise<{
      eligible: boolean;
      reason: 'eligible' | 'limit_reached' | 'approved_awaiting_deduction';
      remaining: number;      // how much can still be requested this period
      totalUsed: number;      // sum already pending/approved this period
      detail?: { amount: number; date_issued: string };
    }> {
      const MAX = 2000;
      const now = new Date();

      // ── Boundary between periods: 15 days ago ───────────────────────────────
      const fifteenDaysAgo = new Date(now);
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const periodStart = fifteenDaysAgo.toISOString().split('T')[0];

      // Rule 1: Block if there is an APPROVED but NOT YET DEDUCTED advance
      //         from a PREVIOUS period (older than 15 days).
      //         Employee must wait until payroll runs and deducts it first.
      const { data: prevUnpaid } = await supabase
        .from('cash_advances')
        .select('id, amount, date_issued')
        .eq('employee_id', employeeId)
        .eq('status', 'approved')
        .lt('date_issued', periodStart);

      if (prevUnpaid && prevUnpaid.length > 0) {
        const rec = prevUnpaid[0] as any;
        return {
          eligible: false,
          reason: 'approved_awaiting_deduction',
          remaining: 0,
          totalUsed: Number(rec.amount),
          detail: { amount: Number(rec.amount), date_issued: rec.date_issued },
        };
      }

      // Rule 2: Within the CURRENT 15-day period, sum all pending + approved.
      //         Employee can keep requesting as long as total doesn't reach ₱2,000.
      const { data: current } = await supabase
        .from('cash_advances')
        .select('id, amount, status')
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'approved'])
        .gte('date_issued', periodStart);

      const totalUsed = (current || []).reduce((s: number, a: any) => s + Number(a.amount), 0);
      const remaining = Math.max(0, MAX - totalUsed);

      if (remaining <= 0) {
        return { eligible: false, reason: 'limit_reached', remaining: 0, totalUsed };
      }

      return { eligible: true, reason: 'eligible', remaining, totalUsed };
    },

    // ── Cashier: submit a request (up to ₱2,000 max) ─────────────────────
    async requestByCashier(data: { employee_id: string; amount: number; reason?: string }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const MAX_AMOUNT = 2000;
      const amount = Math.round(data.amount);

      if (amount <= 0 || amount > MAX_AMOUNT) {
        throw new Error(`Amount must be between ₱1 and ₱${MAX_AMOUNT.toLocaleString()}`);
      }

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const periodStart = fifteenDaysAgo.toISOString().split('T')[0];

      // Block if previous period has an approved but undeducted advance
      const { data: prevUnpaid } = await supabase
        .from('cash_advances')
        .select('id')
        .eq('employee_id', data.employee_id)
        .eq('status', 'approved')
        .lt('date_issued', periodStart);

      if ((prevUnpaid?.length ?? 0) > 0) {
        throw new Error('Employee has an approved advance from a previous period that has not yet been deducted');
      }

      // Sum current-period pending + approved
      const { data: current } = await supabase
        .from('cash_advances')
        .select('amount')
        .eq('employee_id', data.employee_id)
        .in('status', ['pending', 'approved'])
        .gte('date_issued', periodStart);

      const periodTotal = (current || []).reduce((s: number, a: any) => s + Number(a.amount), 0);
      if (periodTotal + amount > MAX_AMOUNT) {
        throw new Error(`This request would exceed the ₱${MAX_AMOUNT.toLocaleString()} period limit. Remaining: ₱${(MAX_AMOUNT - periodTotal).toLocaleString()}`);
      }

      const { data: result, error } = await supabase
        .from('cash_advances')
        .insert([{
          employee_id:          data.employee_id,
          amount,
          date_issued:          new Date().toISOString().split('T')[0],
          reason:               data.reason || null,
          status:               'pending',
          issued_by:            user.id,
          requested_by_cashier: user.id,
        }])
        .select(`
          *,
          employee:employee_id(id, employee_code, full_name, position),
          issuer:issued_by(id, first_name, last_name)
        `)
        .single();

      if (error) throw error;
      return result;
    },

    async getPendingCount(): Promise<number> {
      const { count, error } = await supabase
        .from('cash_advances')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },

    async getPendingTotal(employeeId: string): Promise<number> {
      const { data, error } = await supabase
        .from('cash_advances')
        .select('amount')
        .eq('employee_id', employeeId)
        .eq('status', 'pending');
      if (error) throw error;
      return (data || []).reduce((s, a) => s + Number(a.amount), 0);
    },
  },

  payroll: {

    async getPeriods() {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async createPeriod(period: { period_start: string; period_end: string; pay_date?: string }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert([{ ...period, status: 'draft', created_by: user.id }])
        .select().single();
      if (error) throw error;
      return data;
    },

    async updatePeriod(id: string, updates: Record<string, any>) {
      const { data, error } = await supabase
        .from('payroll_periods')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async getAttendanceLogs(periodId: string) {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          employee:employee_id(
            id, employee_code, full_name, position,
            base_hourly_rate, holiday_rate_multiplier, overtime_rate_multiplier
          )
        `)
        .eq('payroll_period_id', periodId)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },

    async upsertAttendanceLog(log: {
      employee_id: string; payroll_period_id: string;
      worked_hours?: number; required_hours?: number;
      days_present?: number;
      late_timeslots?: number; early_leave_timeslots?: number;
      regular_overtime_hours?: number; holiday_overtime_hours?: number;
      special_overtime_hours?: number; business_trip_days?: number;
      absences?: number; on_leave_days?: number;
      additional_pay?: number; deduction_amount?: number;
    }) {
      const { data, error } = await supabase
        .from('attendance_logs')
        .upsert([{ ...log, updated_at: new Date().toISOString() }], {
          onConflict: 'employee_id,payroll_period_id',
        })
        .select().single();
      if (error) throw error;
      return data;
    },

    async getPayrollRecords(periodId: string) {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          employee:employee_id(id, employee_code, full_name, position)
        `)
        .eq('payroll_period_id', periodId)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },

    async updatePayrollRecord(id: string, updates: Record<string, any>) {
      const { data, error } = await supabase
        .from('payroll_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async computePayroll(periodId: string) {
      const { data: logs, error } = await supabase
        .from('attendance_logs')
        .select(`
          *,
          employee:employee_id(
            id, employee_code, base_hourly_rate
          )
        `)
        .eq('payroll_period_id', periodId);
      if (error) throw error;

      const results = [];

      for (const log of logs || []) {
        const emp = log.employee;
        if (!emp) continue;

        // ────────────────────────────────────────────────────────────────────
        // BASE RATES
        // Daily Rate = Base Hourly Rate × 8 hrs/day
        // Source: employees.base_hourly_rate (set manually per employee)
        // ────────────────────────────────────────────────────────────────────
        // ✅ base_hourly_rate stores the DAILY RATE directly
        // Hourly rate is derived for OT and tardy calculations
        const dailyRate  = Number(emp.base_hourly_rate) || 0;
        const hourlyRate = dailyRate / 8;

        // ────────────────────────────────────────────────────────────────────
        // DAYS PRESENT
        // ✅ FIX: Use days_present stored directly from XLS Summary "Attend Actual"
        //        (e.g. "22/16" → 16 actual days attended)
        //        Falls back to hours ÷ 8 only if days_present wasn't imported.
        //
        // WHY THE DISCREPANCY EXISTED:
        //   Old code: Math.round(worked_hours / 8)
        //   NENENG:   88.73h ÷ 8 = 11 days ❌ (she actually attended 16 days,
        //             but some days she left early — hours don't equal full days)
        //   Correct:  attend_actual = 16 ✓
        // ────────────────────────────────────────────────────────────────────
        const daysPresent = Number(log.days_present) > 0
          ? Number(log.days_present)
          : (Number(log.worked_hours) > 0 ? Math.round(Number(log.worked_hours) / 8) : 0);

        // ────────────────────────────────────────────────────────────────────
        // BASIC PAY
        // Formula: Daily Rate × Days Present
        // ────────────────────────────────────────────────────────────────────
        const basicPay = dailyRate * daysPresent;

        // ────────────────────────────────────────────────────────────────────
        // HOLIDAY PAY
        // Regular Holiday (+100%): employee gets paid double (×2.00)
        // Special Holiday  (+30%): employee gets paid 130% (×1.30)
        // Source: attendance_logs.holiday_overtime_hours / special_overtime_hours
        //         (these fields track holiday DAYS worked — currently manual entry)
        // TODO: Add regular_holiday_days and special_holiday_days columns to
        //       attendance_logs for proper holiday-day tracking.
        // ────────────────────────────────────────────────────────────────────
        const regularHolidayPay = 0; // dailyRate * 2.00 * regular_holiday_days
        const specialHolidayPay = 0; // dailyRate * 1.30 * special_holiday_days

        // ────────────────────────────────────────────────────────────────────
        // OVERTIME
        // From XLS Summary "Overtime Regular" and "Overtime Special" columns
        // (stored in HH.MM biometric format, converted to decimal hours by server)
        //
        // Regular Day OT     (+0.25): Hourly Rate × 1.25 × OT hours
        // Regular Holiday OT (+0.60): Hourly Rate × 1.60 × OT hours
        // Special Holiday OT (+0.30): Hourly Rate × 1.30 × OT hours
        // ────────────────────────────────────────────────────────────────────
        const regularOT = hourlyRate * 1.25 * Number(log.regular_overtime_hours || 0);
        const holidayOT = hourlyRate * 1.60 * Number(log.holiday_overtime_hours || 0);
        const specialOT = hourlyRate * 1.30 * Number(log.special_overtime_hours || 0);

        // ────────────────────────────────────────────────────────────────────
        // GROSS INCOME
        // = Basic Pay + Regular Holiday Pay + Special Holiday Pay
        //   + Regular OT + Holiday OT + Special OT + Additional Pay
        // ────────────────────────────────────────────────────────────────────
        const grossIncome = basicPay
          + regularHolidayPay
          + specialHolidayPay
          + regularOT
          + holidayOT
          + specialOT
          + Number(log.additional_pay || 0);

        // ────────────────────────────────────────────────────────────────────
        // TARDY & UNDERTIME DEDUCTIONS
        // Source: XLS Exceptional sheet → total late_minutes
        //         Server converts: late_minutes / 30 → late_timeslots (1 slot = 30min)
        //
        // Formula: (Daily Rate ÷ 8) × (timeslots × 0.5 hrs)
        //        = Hourly Rate × 0.5 × timeslots
        // ────────────────────────────────────────────────────────────────────
        const tardyDeductions    = hourlyRate * 0.5 * Number(log.late_timeslots || 0);
        const undertimeDeductions = hourlyRate * 0.5 * Number(log.early_leave_timeslots || 0);

        // ────────────────────────────────────────────────────────────────────
        // PHILHEALTH
        // Formula: Monthly Basic Salary × 3% ÷ 2 (employee semi-monthly share)
        //          Rounded to nearest ₱5
        // Monthly Basic = Daily Rate × 26 working days/month
        // Verified against payroll register:
        //   ₱635/day → ₱247.65 → ₱250 ✓
        //   ₱985/day → ₱384.15 → ₱385 ✓
        // ────────────────────────────────────────────────────────────────────
        const monthlyBasic = dailyRate * 26;
        const philhealth   = Math.round(monthlyBasic * 0.015 / 5) * 5;

        // ────────────────────────────────────────────────────────────────────
        // HDMF (PAG-IBIG)
        // Fixed: ₱200.00 per semi-monthly period
        // ────────────────────────────────────────────────────────────────────
        const hdmf = 200;

        // ────────────────────────────────────────────────────────────────────
        // WITHHOLDING TAX
        // ₱0 for most employees (monthly equivalent below ₱20,833 threshold)
        // TODO: Implement BIR tax table brackets for higher earners
        // ────────────────────────────────────────────────────────────────────
        const withholdingTax = 0;

        // ────────────────────────────────────────────────────────────────────
        // NOTE: SSS is NOT included in this payroll register format.
        //       Based on the VTA Link payroll register table, deductions are:
        //       Withholding Tax + Cash Advances + PhilHealth + HDMF only.
        // ────────────────────────────────────────────────────────────────────
        const sss = 0; // Not used in this payroll format

        // ────────────────────────────────────────────────────────────────────
        // CASH ADVANCE DEDUCTION
        // Business Rule: Max ₱2,000 per 15-day payroll period
        // Workflow:
        //   1. Cashier submits → status = 'pending'
        //   2. Admin approves → status = 'approved'
        //   3. Compute Payroll → deducted, status = 'deducted'
        //
        // Carry-Over Rule:
        //   If (grossIncome - totalOtherDeductions - cashAdvance) < 0,
        //   the deficit is stored as carry_over_deduction for the NEXT period.
        // ────────────────────────────────────────────────────────────────────
        const MAX_ADVANCE = 2000; // ₱2,000 hard limit per period

        const { data: advances } = await supabase
          .from('cash_advances')
          .select('id, amount')
          .eq('employee_id', emp.id)
          .eq('status', 'approved');

        // Cap each advance at ₱2,000 and sum
        const cashAdvance = Math.min(
          (advances || []).reduce((s: number, a: any) => s + Number(a.amount), 0),
          MAX_ADVANCE
        );

        // Fetch carry-over from the previous period for this employee
        const { data: prevRecord } = await supabase
          .from('payroll_records')
          .select('carry_over_deduction')
          .eq('employee_id', emp.id)
          .neq('payroll_period_id', periodId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // returns null instead of error when no row found

        const carryOverFromPrevious = Number(prevRecord?.carry_over_deduction) || 0;

        // Mark advances as deducted
        if (advances && advances.length > 0) {
          await supabase
            .from('cash_advances')
            .update({
              status:            'deducted',
              payroll_period_id: periodId,
              updated_at:        new Date().toISOString(),
            })
            .in('id', (advances as any[]).map((a: any) => a.id));
        }

        // ────────────────────────────────────────────────────────────────────
        // TOTAL DEDUCTIONS (including carry-over from previous period)
        // ────────────────────────────────────────────────────────────────────
        const totalDeductions = tardyDeductions
          + undertimeDeductions
          + withholdingTax
          + cashAdvance
          + carryOverFromPrevious
          + philhealth
          + hdmf;

        // NET PAY — may go negative (carry-over to next period)
        const netPayRaw     = grossIncome - totalDeductions;
        const netPay        = Math.max(0, netPayRaw); // paid out is never negative
        const carryOver     = netPayRaw < 0 ? Math.abs(netPayRaw) : 0; // deficit → next period
        const taxableIncome = grossIncome - philhealth - hdmf;

        const { data: saved, error: saveErr } = await supabase
          .from('payroll_records')
          .upsert([{
            payroll_period_id:    periodId,
            employee_id:          emp.id,
            daily_rate:           dailyRate,
            days_present:         daysPresent,
            basic_pay:            basicPay,
            regular_holiday_pay:  regularHolidayPay,
            special_holiday_pay:  specialHolidayPay,
            regular_overtime:     regularOT,
            holiday_overtime:     holidayOT,
            special_overtime:     specialOT,
            gross_income:         grossIncome,
            tardy_deductions:     tardyDeductions,
            undertime_deductions: undertimeDeductions,
            sss,
            philhealth,
            hdmf,
            withholding_tax:      withholdingTax,
            cash_advance:         cashAdvance,
            total_deductions:     totalDeductions,
            net_pay:              netPay,
            taxable_income:       taxableIncome,
            carry_over_deduction:     carryOver,
            carry_over_from_previous: carryOverFromPrevious,
            status:               'pending',
            updated_at:           new Date().toISOString(),
          }], { onConflict: 'employee_id,payroll_period_id' })
          .select().single();

        if (saveErr) throw saveErr;
        results.push(saved);
      }

      return results;
    },
  },
};
