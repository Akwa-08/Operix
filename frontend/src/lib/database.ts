// frontend/src/lib/database.ts
// Direct Supabase queries — NO Express middleman
// RLS handles all security. This file is the ONLY data access layer.

import {supabase} from "../config/supabaseClient";
import {sanitizeInput, isValidUUID} from "../util/security";

/**
 * Uploads a file to the 'order-files' storage bucket.
 * Organizes files by user ID and timestamp to avoid collisions.
 * If an oldUrl is provided, it attempts to delete the previous file from storage.
 */
export async function uploadOrderFile(
  file: File,
  oldUrl?: string,
): Promise<string> {
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

  // Delete old file if it exists and belongs to the 'order-files' bucket
  if (oldUrl && oldUrl.includes("order-files/")) {
    try {
      const oldPath = oldUrl.split("order-files/").pop();
      if (oldPath) {
        await supabase.storage.from("order-files").remove([oldPath]);
        console.log(
          "Successfully removed old order file from storage:",
          oldPath,
        );
      }
    } catch (deleteError) {
      console.warn("Failed to delete old order file:", deleteError);
    }
  }

  const {
    data: {publicUrl},
  } = supabase.storage.from("order-files").getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Uploads a profile picture to the 'user-profile' storage bucket.
 * If an oldUrl is provided, it attempts to delete the previous file from storage.
 */
export async function uploadProfilePicture(
  file: File,
  oldUrl?: string,
): Promise<string> {
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate file size (2MB limit)
  if (file.size > 2 * 1024 * 1024)
    throw new Error("File size exceeds 2MB limit");

  // 1. Prepare new file info
  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // 2. Upload new file
  const {error: uploadError} = await supabase.storage
    .from("user-profile")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading profile picture:", uploadError);
    throw uploadError;
  }

  // 3. Delete old file if it exists and belongs to the 'user-profile' bucket
  if (oldUrl && oldUrl.includes("user-profile/")) {
    try {
      // Extract the path after 'user-profile/'
      // URL format: .../storage/v1/object/public/user-profile/uuid/timestamp.png
      const oldPath = oldUrl.split("user-profile/").pop();
      if (oldPath) {
        await supabase.storage.from("user-profile").remove([oldPath]);
        console.log("Successfully removed old avatar from storage:", oldPath);
      }
    } catch (deleteError) {
      // We don't throw here to avoid failing the whole update just because of cleanup
      console.warn("Failed to delete old profile picture:", deleteError);
    }
  }

  const {
    data: {publicUrl},
  } = supabase.storage.from("user-profile").getPublicUrl(fileName);

  return publicUrl;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (own profile — admin CRUD uses backend /api/admin/*)
// ═══════════════════════════════════════════════════════════════════════════════

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
    avatar_url?: string;
  }) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

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
        },
      ])
      .select()
      .single();
    if (error) throw error;
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
    if (filters?.search) {
      const cleanSearch = sanitizeInput(filters.search);
      if (cleanSearch) {
        query = query.or(
          `name.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%`,
        );
      }
    }
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
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, specifications, file_url),
      payments(id, amount, payment_method, reference_number, created_at)
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
      payments(id, amount, payment_method, reference_number, created_at)
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
    design_file_url?: string;
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
          status: "in_queue",
          payment_status: "unpaid",
          special_instructions: order.special_instructions || null,
          comments: order.comments || null,
          due_date: order.due_date || null,
          total_amount: totalAmount,
          amount_paid: 0,
          assigned_designer: order.assigned_designer || null,
          assigned_production: order.assigned_production || null,
          design_file_url: order.design_file_url || null,
        },
      ])
      .select()
      .single();

    if (orderErr) throw orderErr;

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

  async updateDesignerOrderDetails(
    orderId: string,
    updates: {total_amount?: number; due_date?: string},
  ) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {data: actor, error: actorErr} = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (actorErr) throw actorErr;
    if ((actor?.role || "").toLowerCase() !== "designer") {
      throw new Error("Only designers can edit order pricing in this flow");
    }

    const {data: order, error: orderErr} = await supabase
      .from("orders")
      .select("id, assigned_designer, status, total_amount")
      .eq("id", orderId)
      .single();
    if (orderErr) throw orderErr;
    if (!order) throw new Error("Order not found");
    if (order.assigned_designer !== user.id) {
      throw new Error("You can only edit orders assigned to you");
    }
    if (order.status !== "designing") {
      throw new Error("Order can only be edited during Designing phase");
    }

    const payload: Record<string, any> = {};
    if (updates.total_amount !== undefined) {
      const current = Number(order.total_amount) || 0;
      const incoming = Number(updates.total_amount);
      if (!Number.isFinite(incoming) || incoming <= 0) {
        throw new Error("Total amount must be a valid positive number");
      }
      if (incoming < current) {
        throw new Error("Designers can only increase the total amount");
      }
      payload.total_amount = incoming;
    }
    if (updates.due_date !== undefined) payload.due_date = updates.due_date;
    if (Object.keys(payload).length === 0) return order;

    const {data, error} = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * 2a: Cashier/Admin assigns a designer while order remains in_queue.
   * Designing starts only when the assigned designer explicitly accepts.
   */
  async assignDesignerForAcceptance(orderId: string, designerId: string) {
    const {data: order, error: fetchError} = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();
    if (fetchError) throw fetchError;
    if (!order) throw new Error("Order not found");

    if (order.status !== "in_queue") {
      throw new Error(
        "Only in-queue orders can be assigned for design acceptance",
      );
    }

    const {data, error} = await supabase
      .from("orders")
      .update({
        assigned_designer: designerId,
        // Keep in_queue. Designing begins only on explicit designer acceptance.
        status: "in_queue",
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 2a: Assigned designer accepts the order and starts designing.
   */
  async designerAcceptAssignedOrder(orderId: string) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {data: order, error: fetchError} = await supabase
      .from("orders")
      .select("id, order_number, customer_id, assigned_designer, status")
      .eq("id", orderId)
      .single();
    if (fetchError) throw fetchError;
    if (!order) throw new Error("Order not found");

    if (order.assigned_designer !== user.id) {
      throw new Error("Only the assigned designer can accept this order");
    }
    if (order.status !== "in_queue") {
      throw new Error("Only in-queue orders can be accepted for designing");
    }

    const {data: updated, error: updateErr} = await supabase
      .from("orders")
      .update({status: "designing"})
      .eq("id", orderId)
      .select()
      .single();
    if (updateErr) throw updateErr;

    if (order.customer_id) {
      try {
        const {data: profile} = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        const designerName = profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "Your designer";

        await db.chat.sendMessage(
          order.customer_id,
          `Hi! Your order **${order.order_number}** has been accepted by ${designerName} and is now in the Designing phase.`,
          orderId,
        );
      } catch (msgErr) {
        console.warn("Designer acceptance notification failed:", msgErr);
      }
    }

    return updated;
  },

  /**
   * 2b: Designer self-picks an unassigned in_queue order and starts designing.
   */
  async designerSelfPickOrder(orderId: string) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {data: order, error: fetchError} = await supabase
      .from("orders")
      .select("id, order_number, customer_id, assigned_designer, status")
      .eq("id", orderId)
      .single();
    if (fetchError) throw fetchError;
    if (!order) throw new Error("Order not found");

    if (order.status !== "in_queue") {
      throw new Error("Only in-queue orders can be self-picked");
    }
    if (order.assigned_designer) {
      throw new Error("Order is already assigned to another designer");
    }

    const {data: updated, error: updateErr} = await supabase
      .from("orders")
      .update({assigned_designer: user.id, status: "designing"})
      .eq("id", orderId)
      .select()
      .single();
    if (updateErr) throw updateErr;

    if (order.customer_id) {
      try {
        const {data: profile} = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        const designerName = profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          : "Your designer";

        await db.chat.sendMessage(
          order.customer_id,
          `Hi! Your order **${order.order_number}** has been picked up by ${designerName} and is now in the Designing phase.`,
          orderId,
        );
      } catch (msgErr) {
        console.warn("Self-pick notification failed:", msgErr);
      }
    }

    return updated;
  },

  async updateCustomerDesign(orderId: string, url: string) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {data: actor, error: actorErr} = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (actorErr) throw actorErr;

    if ((actor?.role || "").toLowerCase() === "designer") {
      throw new Error(
        "Designer cannot upload or replace customer initial design",
      );
    }

    const {data: order, error: orderErr} = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();
    if (orderErr) throw orderErr;
    if (!order) throw new Error("Order not found");

    if (!["in_queue", "designing"].includes(order.status)) {
      throw new Error(
        "Initial design can only be replaced during In-Queue or Designing phase",
      );
    }

    // 3: Customer uploads initial design. Keep both order-level and item-level refs.
    await supabase
      .from("orders")
      .update({design_file_url: url})
      .eq("id", orderId);

    // We also update the first item in order_items for this order
    const {data: items, error: fetchError} = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!items || items.length === 0)
      throw new Error("No items found for this order");

    const {data, error} = await supabase
      .from("order_items")
      .update({file_url: url})
      .eq("id", items[0].id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 3: Designer submits final design (preview) while in Designing.
   */
  async submitFinalDesign(orderId: string, url: string) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {data: order, error: fetchError} = await supabase
      .from("orders")
      .select("id, customer_id, assigned_designer, status")
      .eq("id", orderId)
      .single();
    if (fetchError) throw fetchError;
    if (!order) throw new Error("Order not found");

    if (order.assigned_designer !== user.id) {
      throw new Error("Only the assigned designer can submit final design");
    }
    if (order.status !== "designing") {
      throw new Error(
        "Final design can only be submitted during Designing phase",
      );
    }

    const {data, error} = await supabase
      .from("orders")
      .update({final_design_url: url})
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw error;

    if (order.customer_id) {
      try {
        await db.chat.sendMessage(
          order.customer_id,
          "Your final design preview is ready. Please review and accept it to move your order to Payment.",
          orderId,
          url,
        );
      } catch (msgErr) {
        console.warn("Final design notification failed:", msgErr);
      }
    }

    return data;
  },

  /**
   * 3: Customer accepts final design; order moves from Designing -> Payment.
   */
  async customerAcceptFinalDesign(orderId: string) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {data: order, error: fetchError} = await supabase
      .from("orders")
      .select("id, customer_id, assigned_designer, status, final_design_url")
      .eq("id", orderId)
      .eq("customer_id", user.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!order) {
      throw new Error(
        "Order not found or you do not have access to accept this design",
      );
    }

    if (order.customer_id !== user.id) {
      throw new Error(
        "Only the customer for this order can accept final design",
      );
    }
    if (order.status !== "designing") {
      throw new Error("Order is not currently in Designing phase");
    }
    if (!order.final_design_url) {
      throw new Error("No final design found to accept");
    }

    const {data, error} = await supabase
      .from("orders")
      .update({status: "payment"})
      .eq("id", orderId)
      .eq("customer_id", user.id)
      .eq("status", "designing")
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error(
        "Unable to move order to Payment. Access denied or order state changed.",
      );
    }

    if (order.assigned_designer) {
      try {
        await db.chat.sendMessage(
          order.assigned_designer,
          "Customer accepted the final design. The order has now moved to Payment.",
          orderId,
        );
      } catch (msgErr) {
        console.warn(
          "Designer payment transition notification failed:",
          msgErr,
        );
      }
    }

    return data;
  },

  async deleteOrder(id: string) {
    await supabase.from("payments").delete().eq("order_id", id);
    await supabase.from("order_items").delete().eq("order_id", id);
    const {error} = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
  },

  async deductInventoryForOrder(orderId: string) {
    // Skip if already deducted for this order to avoid double-subtracting.
    const {data: existingLog, error: existingLogErr} = await supabase
      .from("inventory_changes")
      .select("id")
      .eq("reason", `Automatic deduction for order ${orderId}`)
      .limit(1)
      .maybeSingle();
    if (existingLogErr) throw existingLogErr;
    if (existingLog?.id) return;

    // 1. Get order items
    const {data: items, error: itemsErr} = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);
    if (itemsErr) throw itemsErr;

    for (const item of items || []) {
      if (!item.product_id) continue;

      // 2. Get BOM for this product
      const {data: bom, error: bomErr} = await supabase
        .from("product_supply_mapping")
        .select("inventory_item_id, quantity_required")
        .eq("product_id", item.product_id);
      if (bomErr) throw bomErr;

      for (const mapping of bom || []) {
        // 3. Deduct from inventory
        const {data: inv, error: invErr} = await supabase
          .from("inventory_items")
          .select("current_quantity")
          .eq("id", mapping.inventory_item_id)
          .single();
        if (invErr) throw invErr;

        const newQty =
          Number(inv.current_quantity) -
          Number(mapping.quantity_required) * item.quantity;

        const {error: updateErr} = await supabase
          .from("inventory_items")
          .update({
            current_quantity: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mapping.inventory_item_id);
        if (updateErr) throw updateErr;

        // 4. Log the change
        const {
          data: {user},
        } = await supabase.auth.getUser();
        await supabase.from("inventory_changes").insert([
          {
            inventory_item_id: mapping.inventory_item_id,
            change_type: "Manual Adjustment",
            quantity_change: -(
              Number(mapping.quantity_required) * item.quantity
            ),
            quantity_before: Number(inv.current_quantity),
            quantity_after: newQty,
            reason: `Automatic deduction for order ${orderId}`,
            changed_by: user?.id,
          },
        ]);
      }
    }
  },

  // ── Payments ─────────────────────────────────────────────────────────
  async recordPayment(
    orderId: string,
    payment: {
      amount: number;
      payment_method: string;
      reference_number?: string;
      notes?: string;
    },
  ) {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {error: payErr} = await supabase.from("payments").insert([
      {
        order_id: orderId,
        amount: payment.amount,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
      },
    ]);
    if (payErr) throw payErr;

    const {data: order} = await supabase
      .from("orders")
      .select("amount_paid, total_amount")
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
      const {data: existingList, error: queryErr} = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("customer_id", user.id)
        .eq("product_id", productId)
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

    const {data, error} = await supabase
      .from("cart_items")
      .insert([
        {
          customer_id: user.id,
          product_id: productId,
          quantity,
          specifications,
          file_url: fileUrl || null,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCartItem(
    cartItemId: string,
    updates: {
      quantity?: number;
      specifications?: string;
      fileUrl?: string;
      file_url?: string;
    },
  ) {
    const dbUpdates: any = {...updates};
    if ("fileUrl" in dbUpdates) {
      dbUpdates.file_url = dbUpdates.fileUrl;
      delete dbUpdates.fileUrl;
    }

    const {data, error} = await supabase
      .from("cart_items")
      .update(dbUpdates)
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
      design_file_url: cartItems[0]?.file_url,
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

    const item = delivery.inventory_item;
    const conversionRate = Number(item.conversion_rate) || 1;
    const addQty = receipt.received_quantity * conversionRate;
    const newQty = Number(item.current_quantity) + addQty;

    const {error: iErr} = await supabase
      .from("inventory_items")
      .update({current_quantity: newQty, updated_at: new Date().toISOString()})
      .eq("id", item.id);
    if (iErr) throw iErr;

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

    return delivery;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════════════════
  chat: {
    formatChatTimestamp(dateStr: string) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return date.toLocaleDateString([], {month: "short", day: "numeric"});
    },

    async getConversations() {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return [];

      const {data, error} = await supabase
        .from("chat_messages")
        .select(
          `
          id, sender_id, receiver_id, message, sent_at,
          sender:sender_id(id, first_name, last_name, role),
          receiver:receiver_id(id, first_name, last_name, role)
        `,
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("sent_at", {ascending: false});

      if (error) throw error;
      if (!data) return [];

      const conversationsMap = new Map<string, any>();

      for (const msg of data as any[]) {
        const isSender = msg.sender_id === user.id;
        const otherProfile = isSender ? msg.receiver : msg.sender;
        const otherId = isSender ? msg.receiver_id : msg.sender_id;

        if (!otherId) continue;
        if (conversationsMap.has(otherId)) continue;

        conversationsMap.set(otherId, {
          id: otherId,
          userId: otherId,
          displayName: otherProfile
            ? `${otherProfile.first_name || ""} ${otherProfile.last_name || ""}`.trim()
            : "Unknown User",
          userRole: otherProfile?.role || "user",
          lastMessage: msg.message,
          lastMessageTime: this.formatChatTimestamp(msg.sent_at),
          unreadCount: 0,
          isActive: true,
          messages: [],
        });
      }

      return Array.from(conversationsMap.values());
    },

    async getMessages(otherUserId: string) {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) return [];

      if (!isValidUUID(otherUserId)) {
        console.error("Invalid otherUserId:", otherUserId);
        return [];
      }

      const {data, error} = await supabase
        .from("chat_messages")
        .select(
          `id, sender_id, message, attachment_url, sent_at, sender:sender_id(first_name, last_name, role)`,
        )
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`,
        )
        .order("sent_at", {ascending: true});

      if (error) throw error;
      if (!data) return [];

      const STAFF_ROLES = ["admin", "cashier", "designer", "production"];

      return data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender
          ? `${msg.sender.first_name || ""} ${msg.sender.last_name || ""}`.trim()
          : "Unknown",
        content: msg.message,
        attachmentUrl: msg.attachment_url || undefined,
        timestamp: this.formatChatTimestamp(msg.sent_at),
        isFromAdmin: STAFF_ROLES.includes(
          (msg.sender?.role || "").toLowerCase(),
        ),
      }));
    },

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

      if (!isValidUUID(receiverId)) throw new Error("Invalid receiverId");
      if (orderId && !isValidUUID(orderId)) throw new Error("Invalid orderId");

      const {data, error} = await supabase
        .from("chat_messages")
        .insert([
          {
            sender_id: user.id,
            receiver_id: receiverId,
            message: message.trim(),
            order_id: orderId || null,
            attachment_url: attachmentUrl || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async uploadChatImage(file: File, oldUrl?: string): Promise<string> {
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

      // Delete old file if it exists and belongs to the 'chat-attachments' bucket
      if (oldUrl && oldUrl.includes("chat-attachments/")) {
        try {
          const oldPath = oldUrl.split("chat-attachments/").pop();
          if (oldPath) {
            await supabase.storage.from("chat-attachments").remove([oldPath]);
            console.log(
              "Successfully removed old chat attachment from storage:",
              oldPath,
            );
          }
        } catch (deleteError) {
          console.warn("Failed to delete old chat attachment:", deleteError);
        }
      }

      const {data: urlData} = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(path);
      return urlData.publicUrl;
    },

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
        .neq("id", user.id);

      if (!isStaff) {
        query = query.in("role", [
          "admin",
          "cashier",
          "designer",
          "production",
          "Admin",
          "Cashier",
          "Designer",
          "Production",
        ]);
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYROLL
  // ═══════════════════════════════════════════════════════════════════════════
  payroll: {
    async getPeriods() {
      const {data, error} = await supabase
        .from("payroll_periods")
        .select("*")
        .order("period_start", {ascending: false});
      if (error) throw error;
      return data || [];
    },

    async createPeriod(period: {
      period_start: string;
      period_end: string;
      pay_date?: string;
    }) {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {data, error} = await supabase
        .from("payroll_periods")
        .insert([{...period, status: "draft", created_by: user.id}])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updatePeriod(id: string, updates: Record<string, any>) {
      const {data, error} = await supabase
        .from("payroll_periods")
        .update({...updates, updated_at: new Date().toISOString()})
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getAttendanceLogs(periodId: string) {
      const {data, error} = await supabase
        .from("attendance_logs")
        .select(
          `
          *,
          employee:employee_id(
            id, employee_code, full_name, position,
            base_hourly_rate, holiday_rate_multiplier, overtime_rate_multiplier
          )
        `,
        )
        .eq("payroll_period_id", periodId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },

    async upsertAttendanceLog(log: {
      employee_id: string;
      payroll_period_id: string;
      worked_hours?: number;
      required_hours?: number;
      days_present?: number;
      late_timeslots?: number;
      early_leave_timeslots?: number;
      regular_overtime_hours?: number;
      holiday_overtime_hours?: number;
      special_overtime_hours?: number;
      business_trip_days?: number;
      absences?: number;
      on_leave_days?: number;
      additional_pay?: number;
      deduction_amount?: number;
    }) {
      const {data, error} = await supabase
        .from("attendance_logs")
        .upsert([{...log, updated_at: new Date().toISOString()}], {
          onConflict: "employee_id,payroll_period_id",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getPayrollRecords(periodId: string) {
      const {data, error} = await supabase
        .from("payroll_records")
        .select(
          `
          *,
          employee:employee_id(id, employee_code, full_name, position)
        `,
        )
        .eq("payroll_period_id", periodId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },

    async updatePayrollRecord(id: string, updates: Record<string, any>) {
      const {data, error} = await supabase
        .from("payroll_records")
        .update({...updates, updated_at: new Date().toISOString()})
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async computePayroll(periodId: string) {
      const {data: logs, error} = await supabase
        .from("attendance_logs")
        .select(
          `
          *,
          employee:employee_id(
            id, employee_code, base_hourly_rate
          )
        `,
        )
        .eq("payroll_period_id", periodId);
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
        const dailyRate = Number(emp.base_hourly_rate) || 0;
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
        const daysPresent =
          Number(log.days_present) > 0
            ? Number(log.days_present)
            : Number(log.worked_hours) > 0
              ? Math.round(Number(log.worked_hours) / 8)
              : 0;

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
        const regularOT =
          hourlyRate * 1.25 * Number(log.regular_overtime_hours || 0);
        const holidayOT =
          hourlyRate * 1.6 * Number(log.holiday_overtime_hours || 0);
        const specialOT =
          hourlyRate * 1.3 * Number(log.special_overtime_hours || 0);

        // ────────────────────────────────────────────────────────────────────
        // GROSS INCOME
        // = Basic Pay + Regular Holiday Pay + Special Holiday Pay
        //   + Regular OT + Holiday OT + Special OT + Additional Pay
        // ────────────────────────────────────────────────────────────────────
        const grossIncome =
          basicPay +
          regularHolidayPay +
          specialHolidayPay +
          regularOT +
          holidayOT +
          specialOT +
          Number(log.additional_pay || 0);

        // ────────────────────────────────────────────────────────────────────
        // TARDY & UNDERTIME DEDUCTIONS
        // Source: XLS Exceptional sheet → total late_minutes
        //         Server converts: late_minutes / 30 → late_timeslots (1 slot = 30min)
        //
        // Formula: (Daily Rate ÷ 8) × (timeslots × 0.5 hrs)
        //        = Hourly Rate × 0.5 × timeslots
        // ────────────────────────────────────────────────────────────────────
        const tardyDeductions =
          hourlyRate * 0.5 * Number(log.late_timeslots || 0);
        const undertimeDeductions =
          hourlyRate * 0.5 * Number(log.early_leave_timeslots || 0);

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
        const philhealth = Math.round((monthlyBasic * 0.015) / 5) * 5;

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
        // ────────────────────────────────────────────────────────────────────
        // CASH ADVANCE — DEFERRED DEDUCTION SYSTEM (Correct Implementation)
        //
        // Core rule: A CA requested in Period N is NEVER deducted in Period N.
        //            It is deducted in Period N+1.
        //
        // How we prevent same-period deduction:
        //   Step 1 marks CAs with payroll_period_id = CURRENT period
        //   Step 2 deducts CAs with payroll_period_id = PREVIOUS period ID
        //   Since current ≠ previous, deduction NEVER happens in the same run.
        //
        // Lifecycle:
        //   pending → approved → added_to_current_payroll [Period N]
        //                      → deducted                 [Period N+1]
        // ────────────────────────────────────────────────────────────────────
        const MAX_ADVANCE = 2000;

        // Fetch THIS period's dates
        const {data: thisPeriod} = await supabase
          .from("payroll_periods")
          .select("id, period_start, period_end")
          .eq("id", periodId)
          .single();

        const periodStart = thisPeriod?.period_start as string;

        // Find the PREVIOUS payroll period by database — no date math needed
        // "Previous" = the period whose period_end is the latest date before this period's start
        const {data: prevPeriod} = await supabase
          .from("payroll_periods")
          .select("id, period_start, period_end")
          .lt("period_end", periodStart) // ended before this period began
          .order("period_end", {ascending: false})
          .limit(1)
          .maybeSingle();

        // ── STEP 1: Issue all currently APPROVED CAs ─────────────────────────
        // Any approved CA at compute time = issued to employee THIS period.
        // Mark with payroll_period_id = current period so Step 2 never touches them.
        const {data: approvedCAs} = await supabase
          .from("cash_advances")
          .select("id, amount")
          .eq("employee_id", emp.id)
          .eq("status", "approved");

        const cashAdvanceIssued = Math.min(
          (approvedCAs || []).reduce(
            (s: number, a: any) => s + Number(a.amount),
            0,
          ),
          MAX_ADVANCE,
        );

        if (approvedCAs && approvedCAs.length > 0) {
          await supabase
            .from("cash_advances")
            .update({
              status: "added_to_current_payroll",
              payroll_period_id: periodId, // ← linked to CURRENT period
              updated_at: new Date().toISOString(),
            })
            .in(
              "id",
              (approvedCAs as any[]).map((a: any) => a.id),
            );
        }

        // ── STEP 2: Deduct CAs issued in the PREVIOUS period ─────────────────
        // Find CAs whose payroll_period_id = previous period ID.
        // This CANNOT overlap with Step 1 (current periodId ≠ prevPeriod.id).
        // Edge case: if prevPeriod is null (this is the very first period),
        // or if prevPeriod payroll was never computed — deduction = 0 (CA stays
        // as added_to_current_payroll until a subsequent period processes it).
        let cashAdvanceDeduction = 0;

        if (prevPeriod) {
          const {data: prevIssuedCAs} = await supabase
            .from("cash_advances")
            .select("id, amount")
            .eq("employee_id", emp.id)
            .eq("status", "added_to_current_payroll")
            .eq("payroll_period_id", prevPeriod.id); // ← linked to PREVIOUS period ONLY

          cashAdvanceDeduction = Math.min(
            (prevIssuedCAs || []).reduce(
              (s: number, a: any) => s + Number(a.amount),
              0,
            ),
            MAX_ADVANCE,
          );

          if (prevIssuedCAs && prevIssuedCAs.length > 0) {
            await supabase
              .from("cash_advances")
              .update({
                status: "deducted",
                updated_at: new Date().toISOString(),
              })
              .in(
                "id",
                (prevIssuedCAs as any[]).map((a: any) => a.id),
              );
          }
        }

        // ── Carry-over from previous payroll record ──────────────────────────
        const {data: prevRecord} = await supabase
          .from("payroll_records")
          .select("carry_over_deduction")
          .eq("employee_id", emp.id)
          .neq("payroll_period_id", periodId)
          .order("created_at", {ascending: false})
          .limit(1)
          .maybeSingle();

        const carryOverFromPrevious =
          Number(prevRecord?.carry_over_deduction) || 0;

        // ────────────────────────────────────────────────────────────────────
        // TOTAL DEDUCTIONS
        // cashAdvanceDeduction = CA from PREVIOUS period now being collected
        // cashAdvanceIssued    = CA given THIS period (shown on payslip, not deducted)
        // ────────────────────────────────────────────────────────────────────
        const totalDeductions =
          tardyDeductions +
          undertimeDeductions +
          withholdingTax +
          cashAdvanceDeduction + // ← deduction from prev period
          carryOverFromPrevious +
          philhealth +
          hdmf;

        // NET PAY — may go negative (carry-over to next period)
        const netPayRaw = grossIncome - totalDeductions;
        const netPay = Math.max(0, netPayRaw); // paid out is never negative
        const carryOver = netPayRaw < 0 ? Math.abs(netPayRaw) : 0; // deficit → next period
        const taxableIncome = grossIncome - philhealth - hdmf;

        const {data: saved, error: saveErr} = await supabase
          .from("payroll_records")
          .upsert(
            [
              {
                payroll_period_id: periodId,
                employee_id: emp.id,
                daily_rate: dailyRate,
                days_present: daysPresent,
                basic_pay: basicPay,
                regular_holiday_pay: regularHolidayPay,
                special_holiday_pay: specialHolidayPay,
                regular_overtime: regularOT,
                holiday_overtime: holidayOT,
                special_overtime: specialOT,
                gross_income: grossIncome,
                tardy_deductions: tardyDeductions,
                undertime_deductions: undertimeDeductions,
                sss,
                philhealth,
                hdmf,
                withholding_tax: withholdingTax,
                cash_advance: cashAdvanceDeduction, // deduction from PREVIOUS period CAs
                cash_advance_issued: cashAdvanceIssued, // issued THIS period (employee received ₱)
                total_deductions: totalDeductions,
                net_pay: netPay,
                taxable_income: taxableIncome,
                carry_over_deduction: carryOver,
                carry_over_from_previous: carryOverFromPrevious,
                status: "pending",
                updated_at: new Date().toISOString(),
              },
            ],
            {onConflict: "employee_id,payroll_period_id"},
          )
          .select()
          .single();

        if (saveErr) throw saveErr;
        results.push(saved);
      }

      return results;
    },

    async resetPayroll(periodId: string) {
      const {error: delErr} = await supabase
        .from("payroll_records")
        .delete()
        .eq("payroll_period_id", periodId);
      if (delErr) throw delErr;

      const {data: issuedCAs} = await supabase
        .from("cash_advances")
        .select("id")
        .eq("status", "added_to_current_payroll")
        .eq("payroll_period_id", periodId);
      if (issuedCAs && issuedCAs.length > 0) {
        await supabase
          .from("cash_advances")
          .update({
            status: "approved",
            payroll_period_id: null,
            updated_at: new Date().toISOString(),
          })
          .in(
            "id",
            (issuedCAs as any[]).map((a: any) => a.id),
          );
      }

      const {data: thisPeriodData} = await supabase
        .from("payroll_periods")
        .select("period_start")
        .eq("id", periodId)
        .single();
      if (thisPeriodData) {
        const {data: prevPeriodData} = await supabase
          .from("payroll_periods")
          .select("id")
          .lt("period_end", thisPeriodData.period_start)
          .order("period_end", {ascending: false})
          .limit(1)
          .maybeSingle();
        if (prevPeriodData) {
          await supabase
            .from("cash_advances")
            .update({
              status: "added_to_current_payroll",
              updated_at: new Date().toISOString(),
            })
            .eq("status", "deducted")
            .eq("payroll_period_id", prevPeriodData.id);
        }
      }
      return {success: true};
    },

    async deletePeriod(id: string) {
      const {data: period} = await supabase
        .from("payroll_periods")
        .select("status")
        .eq("id", id)
        .single();
      if (period?.status !== "draft")
        throw new Error("Only draft periods can be deleted.");

      await supabase
        .from("cash_advances")
        .update({
          status: "approved",
          payroll_period_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("status", "added_to_current_payroll")
        .eq("payroll_period_id", id);
      await supabase
        .from("payroll_records")
        .delete()
        .eq("payroll_period_id", id);
      await supabase
        .from("attendance_logs")
        .delete()
        .eq("payroll_period_id", id);
      await supabase
        .from("attendance_summary_imports")
        .delete()
        .eq("payroll_period_id", id);

      const {error} = await supabase
        .from("payroll_periods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CASH ADVANCES
  // ═══════════════════════════════════════════════════════════════════════════
  cashAdvances: {
    async getAll(filters?: {employee_id?: string; status?: string}) {
      let query = supabase
        .from("cash_advances")
        .select(
          `
          *,
          employee:employee_id(id, employee_code, full_name, position),
          issuer:issued_by(id, first_name, last_name)
        `,
        )
        .order("created_at", {ascending: false});

      if (filters?.employee_id)
        query = query.eq("employee_id", filters.employee_id);
      if (filters?.status) query = query.eq("status", filters.status);

      const {data, error} = await query;
      if (error) throw error;
      return data || [];
    },

    async create(advance: {
      employee_id: string;
      amount: number;
      date_issued?: string;
      reason?: string;
    }) {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const {data, error} = await supabase
        .from("cash_advances")
        .insert([
          {
            ...advance,
            date_issued:
              advance.date_issued || new Date().toISOString().split("T")[0],
            status: "pending",
            issued_by: user.id,
          },
        ])
        .select(
          `
          *,
          employee:employee_id(id, employee_code, full_name, position),
          issuer:issued_by(id, first_name, last_name)
        `,
        )
        .single();

      if (error) throw error;
      return data;
    },

    async cancel(id: string) {
      const {data, error} = await supabase
        .from("cash_advances")
        .update({status: "cancelled", updated_at: new Date().toISOString()})
        .eq("id", id)
        .eq("status", "pending") // can only cancel pending advances
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async approve(id: string) {
      const {data, error} = await supabase
        .from("cash_advances")
        .update({status: "approved", updated_at: new Date().toISOString()})
        .eq("id", id)
        .eq("status", "pending")
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async decline(id: string, declineReason: string) {
      const {data, error} = await supabase
        .from("cash_advances")
        .update({
          status: "declined",
          decline_reason: declineReason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getPendingRequests() {
      const {data, error} = await supabase
        .from("cash_advances")
        .select(
          `
          *,
          employee:employee_id(
            id, employee_code, full_name, position, base_hourly_rate
          ),
          issuer:issued_by(id, first_name, last_name)
        `,
        )
        .eq("status", "pending")
        .order("created_at", {ascending: true});
      if (error) throw error;
      return data || [];
    },

    // ── Cashier: check eligibility ────────────────────────────────────────
    async checkEligibility(employeeId: string): Promise<{
      eligible: boolean;
      reason:
        | "eligible"
        | "limit_reached"
        | "restricted_next_period"
        | "approved_awaiting_deduction";
      remaining: number;
      totalUsed: number;
      detail?: {amount: number; date_issued: string; periodLabel?: string};
    }> {
      const MAX = 2000;
      const today = new Date().toISOString().split("T")[0];

      // ── Determine the current payroll period from the DB ─────────────────
      // Try to find the active period containing today's date
      const {data: currentPeriodRow} = await supabase
        .from("payroll_periods")
        .select("id, period_start, period_end")
        .lte("period_start", today)
        .gte("period_end", today)
        .order("period_start", {ascending: false})
        .limit(1)
        .maybeSingle();

      // Fallback: derive boundaries from calendar if no DB period found
      const getCalendarBounds = () => {
        const d = new Date();
        const y = d.getFullYear(),
          m = d.getMonth(),
          day = d.getDate();
        if (day <= 15) {
          return {
            currentStart: new Date(y, m, 1).toISOString().split("T")[0],
            currentEnd: new Date(y, m, 15).toISOString().split("T")[0],
          };
        }
        const last = new Date(y, m + 1, 0).getDate();
        return {
          currentStart: new Date(y, m, 16).toISOString().split("T")[0],
          currentEnd: new Date(y, m, last).toISOString().split("T")[0],
        };
      };

      const currentPeriodId = currentPeriodRow?.id ?? null;
      const {currentStart, currentEnd} = currentPeriodRow
        ? {
            currentStart: currentPeriodRow.period_start,
            currentEnd: currentPeriodRow.period_end,
          }
        : getCalendarBounds();

      // ── Rule 1: RESTRICTED PERIOD ─────────────────────────────────────────
      // Employee has a CA that was ISSUED in a previous period (payroll_period_id
      // is set but points to an older period). Deduction for that CA hasn't run yet.
      // → Employee must wait for the deduction period to pass.
      const restrictedQuery = supabase
        .from("cash_advances")
        .select("id, amount, date_issued, payroll_period_id")
        .eq("employee_id", employeeId)
        .eq("status", "added_to_current_payroll");

      // If we know the current period ID, exclude CAs from it (those are fine, still in same period)
      const {data: restrictedCAs} = currentPeriodId
        ? await restrictedQuery.neq("payroll_period_id", currentPeriodId)
        : await restrictedQuery.lt("date_issued", currentStart); // fallback: date-based

      if (restrictedCAs && restrictedCAs.length > 0) {
        const prevTotal = (restrictedCAs as any[]).reduce(
          (s: number, a: any) => s + Number(a.amount),
          0,
        );
        const rec = (restrictedCAs as any[])[0];
        return {
          eligible: false,
          reason: "restricted_next_period",
          remaining: 0,
          totalUsed: 0,
          detail: {amount: prevTotal, date_issued: rec.date_issued},
        };
      }

      // ── Rule 2: CURRENT PERIOD LIMIT ──────────────────────────────────────
      // Sum: pending + approved (not yet in payroll) within current period
      const {data: pendingApproved} = await supabase
        .from("cash_advances")
        .select("amount")
        .eq("employee_id", employeeId)
        .in("status", ["pending", "approved"]);

      // Plus: CAs already issued in the current period (still count toward limit)
      const issuedCurrentQuery = supabase
        .from("cash_advances")
        .select("amount")
        .eq("employee_id", employeeId)
        .eq("status", "added_to_current_payroll");

      const {data: issuedCurrent} = currentPeriodId
        ? await issuedCurrentQuery.eq("payroll_period_id", currentPeriodId)
        : await issuedCurrentQuery
            .gte("date_issued", currentStart)
            .lte("date_issued", currentEnd);

      const totalUsed = [
        ...(pendingApproved || []),
        ...(issuedCurrent || []),
      ].reduce((s: number, a: any) => s + Number(a.amount), 0);

      const remaining = Math.max(0, MAX - totalUsed);

      if (remaining <= 0) {
        return {
          eligible: false,
          reason: "limit_reached",
          remaining: 0,
          totalUsed,
        };
      }

      return {eligible: true, reason: "eligible", remaining, totalUsed};
    },

    // ── Cashier: submit a request (up to ₱2,000 max per period) ─────────
    async requestByCashier(data: {
      employee_id: string;
      amount: number;
      reason?: string;
    }) {
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const MAX_AMOUNT = 2000;
      const amount = Math.round(data.amount);

      if (amount <= 0 || amount > MAX_AMOUNT) {
        throw new Error(
          `Amount must be between ₱1 and ₱${MAX_AMOUNT.toLocaleString()}`,
        );
      }

      // ── Determine current period ─────────────────────────────────────────
      const today = new Date().toISOString().split("T")[0];
      const {data: currentPeriodRow} = await supabase
        .from("payroll_periods")
        .select("id, period_start, period_end")
        .lte("period_start", today)
        .gte("period_end", today)
        .order("period_start", {ascending: false})
        .limit(1)
        .maybeSingle();

      const currentPeriodId = currentPeriodRow?.id ?? null;

      // Calendar fallback
      const d = new Date();
      const y = d.getFullYear(),
        m = d.getMonth(),
        day = d.getDate();
      const currentStart =
        currentPeriodRow?.period_start ??
        (day <= 15
          ? new Date(y, m, 1).toISOString().split("T")[0]
          : new Date(y, m, 16).toISOString().split("T")[0]);

      // ── Guard 1: Restricted period ────────────────────────────────────────
      // Employee has a CA issued in a previous period that hasn't been deducted yet
      const restrictedQuery = supabase
        .from("cash_advances")
        .select("id")
        .eq("employee_id", data.employee_id)
        .eq("status", "added_to_current_payroll");

      const {data: restrictedCAs} = currentPeriodId
        ? await restrictedQuery.neq("payroll_period_id", currentPeriodId)
        : await restrictedQuery.lt("date_issued", currentStart);

      if ((restrictedCAs?.length ?? 0) > 0) {
        throw new Error(
          "Employee had a Cash Advance issued in the previous payroll period. " +
            "They must wait until that deduction is processed before requesting again.",
        );
      }

      // ── Guard 2: Current period total ─────────────────────────────────────
      const {data: pendingApproved} = await supabase
        .from("cash_advances")
        .select("amount")
        .eq("employee_id", data.employee_id)
        .in("status", ["pending", "approved"]);

      const issuedCurrentQuery = supabase
        .from("cash_advances")
        .select("amount")
        .eq("employee_id", data.employee_id)
        .eq("status", "added_to_current_payroll");

      const {data: issuedCurrent} = currentPeriodId
        ? await issuedCurrentQuery.eq("payroll_period_id", currentPeriodId)
        : await issuedCurrentQuery.gte("date_issued", currentStart);

      const periodTotal = [
        ...(pendingApproved || []),
        ...(issuedCurrent || []),
      ].reduce((s: number, a: any) => s + Number(a.amount), 0);

      if (periodTotal + amount > MAX_AMOUNT) {
        throw new Error(
          `This request would exceed the ₱${MAX_AMOUNT.toLocaleString()} period limit. ` +
            `Remaining: ₱${(MAX_AMOUNT - periodTotal).toLocaleString()}`,
        );
      }

      const {data: result, error} = await supabase
        .from("cash_advances")
        .insert([
          {
            employee_id: data.employee_id,
            amount,
            date_issued: new Date().toISOString().split("T")[0],
            reason: data.reason || null,
            status: "pending",
            issued_by: user.id,
            requested_by_cashier: user.id,
          },
        ])
        .select(
          `
          *,
          employee:employee_id(id, employee_code, full_name, position),
          issuer:issued_by(id, first_name, last_name)
        `,
        )
        .single();

      if (error) throw error;
      return result;
    },

    async getPendingCount(): Promise<number> {
      const {count, error} = await supabase
        .from("cash_advances")
        .select("id", {count: "exact", head: true})
        .eq("status", "pending");
      if (error) return 0;
      return count ?? 0;
    },

    async getPendingTotal(employeeId: string): Promise<number> {
      const {data, error} = await supabase
        .from("cash_advances")
        .select("amount")
        .eq("employee_id", employeeId)
        .eq("status", "pending");
      if (error) throw error;
      return (data || []).reduce((s, a) => s + Number(a.amount), 0);
    },
  },
};
