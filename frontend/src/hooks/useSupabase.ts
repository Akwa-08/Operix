// frontend/src/hooks/useSupabase.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE hook file — ALL data access, mapping, and mutations.
// Components import ONLY from this file. No bridge layers.
//
// Pipeline: database.ts (raw queries) → useSupabase.ts (hooks) → Components
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { db } from '../lib/database';
import { adminApi } from '../lib/adminApi';
import type {
  Order, MaterialStatus, Material, UserRole,
  FrontendUser, FrontendSupplier, EmployeeRecord, CatalogProduct, CartItem,
  AdminProduct, BOMItem, Delivery, DeliveryStatus, EmployeeRole,
} from '../Types';

// ═══════════════════════════════════════════════════════════════════════════════
// Generic fetch-and-cache pattern
// ═══════════════════════════════════════════════════════════════════════════════
function useQuery<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await fetcher()); }
    catch (err: any) { setError(err.message || 'Unknown error'); }
    finally { setLoading(false); }
  }, deps);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

/** Wrap an async mutation in { success, error } */
async function safe(fn: () => Promise<any>): Promise<{ success: boolean; error: string | null }> {
  try { await fn(); return { success: true, error: null }; }
  catch (err: any) { return { success: false, error: err.message || 'Operation failed' }; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAPPERS (snake_case → camelCase) — all private, used by hooks below
// ═══════════════════════════════════════════════════════════════════════════════


function mapOrder(raw: any): Order {
  const c = raw.customer;
  const items = raw.order_items || [];
  return {
    id: raw.id, orderId: raw.order_number || '',
    customerName: c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Walk-in',
    customerEmail: c?.email || '', customerPhone: c?.contact_number || '',
    productType: items[0]?.product_name || (items.length > 1 ? 'Multiple' : '—'),
    quantity: items.reduce((s: number, i: any) => s + (i.quantity || 0), 0),
    totalAmount: Number(raw.total_amount) || 0,
    status: mapStatus(raw.status), paymentStatus: mapPayment(raw.payment_status),
    dateOrdered: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
    dueDate: raw.due_date ? new Date(raw.due_date).toLocaleDateString() : '',
    specialInstructions: raw.special_instructions || '', designFile: raw.design_file_url || items[0]?.file_url || '',
    assignedDesigner: raw.assigned_designer || '', assignedProduction: raw.assigned_production || '',
    designerName: raw.designer ? `${raw.designer.first_name || ''} ${raw.designer.last_name || ''}`.trim() : '',
    productionName: raw.production_staff ? `${raw.production_staff.first_name || ''} ${raw.production_staff.last_name || ''}`.trim() : '',
    comments: raw.comments || '', amountPaid: Number(raw.amount_paid) || 0, orderType: raw.order_type || 'walk-in',
  };
}

function mapUser(raw: any): FrontendUser {
  return {
    id: raw.id, firstName: raw.first_name || '', lastName: raw.last_name || '',
    email: raw.email || '', userName: raw.username || '',
    role: raw.role ? raw.role.charAt(0).toUpperCase() + raw.role.slice(1) : 'Customer',
    contactNumber: raw.contact_number || '', isActive: raw.is_active ?? true,
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
  };
}

function mapSupplier(raw: any): FrontendSupplier {
  return {
    id: raw.id, supplierName: raw.name || '', email: raw.email || '',
    contactNumber: raw.phone || '', address: raw.address || '',
    supplierStatus: raw.is_active ? 'Active' : 'Inactive',
    isFlagged: raw.is_flagged ?? false, flagNotes: raw.flag_notes || '',
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
  };
}

function mapEmployee(raw: any): EmployeeRecord {
  return {
    id: raw.id, employeeCode: raw.employee_code || '', fullName: raw.full_name || '',
    position: raw.position || '',
    role: raw.role ? (raw.role.charAt(0).toUpperCase() + raw.role.slice(1)) as EmployeeRole : undefined,
    baseHourlyRate: Number(raw.base_hourly_rate) || 0,
    holidayRateMultiplier: Number(raw.holiday_rate_multiplier) || 2.0,
    overtimeRateMultiplier: Number(raw.overtime_rate_multiplier) || 1.5,
    hireDate: raw.hire_date ? new Date(raw.hire_date).toLocaleDateString() : '',
    isActive: raw.is_active ?? true,
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    orderId: o.order_number || '',
    customerName: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : (o.guest_name || 'Guest'),
    customerEmail: o.customer?.email || o.guest_email || '',
    customerPhone: o.customer?.contact_number || o.guest_phone || '',
    productType: o.order_type || 'Custom',
    quantity: o.order_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0,
    totalAmount: Number(o.total_amount) || 0,
    amountPaid: Number(o.amount_paid) || 0,
    status: (o.status?.charAt(0).toUpperCase() + o.status?.slice(1).replace(/_/g, ' ')) as any,
    paymentStatus: (o.payment_status?.charAt(0).toUpperCase() + o.payment_status?.slice(1)) as any,
    dateOrdered: new Date(o.created_at).toLocaleDateString(),
    dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString() : '—',
    specialInstructions: o.special_instructions,
    assignedDesigner: o.assigned_designer,
    assignedProduction: o.assigned_production,
    designerName: o.designer ? `${o.designer.first_name || ''} ${o.designer.last_name || ''}`.trim() : undefined,
    // After FK migration: assigned_production now references employees(id), which has full_name.
    productionName: o.production_staff?.full_name || undefined,
    comments: o.comments,
    orderType: o.order_type,
  };
}

function deriveMatStatus(item: any): MaterialStatus {
  if (!item.is_active) return 'Phased Out';
  const qty = Number(item.current_quantity), rp = Number(item.reorder_point);
  if (qty <= 0) return 'Restocking';
  if (qty <= rp) return 'Low Stock';
  return 'Available';
}

function mapMaterial(item: any): Material {
  const pref = item.item_suppliers?.find((s: any) => s.is_preferred) ?? item.item_suppliers?.[0];
  return {
    id: item.id, itemType: item.name, itemVariant: item.description || '',
    usableStocks: Number(item.current_quantity), stockUnit: item.unit_of_measure,
    reorderPoint: Number(item.reorder_point), unitCost: Number(item.unit_cost),
    purchaseQty: Number(item.conversion_rate ?? 1),
    purchaseUnit: item.purchase_unit || item.unit_of_measure,
    supplier: pref?.suppliers?.name || '—', status: deriveMatStatus(item),
    isActive: item.is_active, description: item.description,
    lastSupplierCost: pref ? Number(pref.supplier_unit_price) : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS — named exactly as components expect
// ═══════════════════════════════════════════════════════════════════════════════

// ── Profile ──────────────────────────────────────────────────────────────────
export function useMyProfile() {
  const q = useQuery(() => db.getMyProfile(), []);
  return { profile: q.data, ...q };
}

// ── Users (raw, internal) ────────────────────────────────────────────────────
export function useUsers(filters?: { role?: string; status?: string }) {
  const q = useQuery(() => db.getUsers(filters), [filters?.role, filters?.status]);
  return { users: q.data || [], ...q };
}

// ── Employees (raw, internal) ────────────────────────────────────────────────
export function useEmployees() {
  const q = useQuery(() => db.getEmployees(), []);
  return { employees: q.data || [], ...q };
}

// ── Suppliers (raw, internal) ────────────────────────────────────────────────
export function useSuppliers() {
  const q = useQuery(() => db.getSuppliers(), []);
  return { suppliers: q.data || [], ...q };
}

// ── Products (raw, internal) ─────────────────────────────────────────────────
export function useProducts(filters?: { search?: string; category?: string }) {
  const q = useQuery(() => db.getProducts(filters), [filters?.search, filters?.category]);
  return { products: q.data || [], ...q };
}

// ── Orders (raw, internal) ───────────────────────────────────────────────────
export function useOrders(filters?: { status?: string }) {
  const q = useQuery(() => db.getOrders(filters), [filters?.status]);
  const orders: Order[] = (q.data || []).map(mapOrder);
  const now = new Date();
  const stats = {
    total: orders.length,
    inQueue: orders.filter((o: any) => o.status === 'In Queue').length,
    designing: orders.filter((o: any) => o.status === 'Designing').length,
    production: orders.filter((o: any) => o.status === 'Production').length,
    pickup: orders.filter((o: any) => o.status === 'Pickup').length,
    completed: orders.filter((o: any) => o.status === 'Completed').length,
    overdue: orders.filter((o: any) => o.dueDate && new Date(o.dueDate) < now && !['Completed', 'Cancelled', 'Pickup'].includes(o.status)).length,
    pendingPayment: orders.filter((o: any) => o.paymentStatus !== 'Paid').length,
    readyPickup: orders.filter((o: any) => o.status === 'Pickup').length,
  };
  return { orders, stats, ...q };
}

// ── Orders Data (Enhanced for Admin/Staff) ───────────────────────────────────
export function useOrdersData(filters?: { status?: string }) {
  const { orders, stats, loading, error, refresh } = useOrders(filters);
  const { data: allUsers } = useQuery(() => db.getUsers({ status: 'active' }), []);
  const { data: allEmployees } = useQuery(() => db.getEmployees(), []);
  
  // Designers are from User Accounts
  const designers = (allUsers || [])
    .filter((u: any) => u.role?.toLowerCase() === 'designer')
    .map((u: any) => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username
    }));

  // Production Staff are from Registered Employees
  const productionStaff = (allEmployees || [])
    .filter((e: any) => e.position?.toLowerCase() === 'production' || e.role?.toLowerCase() === 'production')
    .map((e: any) => ({
      id: e.id,
      name: e.full_name
    }));

  return { 
    orders, 
    stats, 
    designers, 
    productionStaff, 
    loading, 
    error, 
    refresh,
    createOrder: async (data: any) => {
      const r = await safe(() => db.createOrder(data).then(() => refresh()));
      return r;
    },
    updateStatus: async (id: string, status: string) => {
      const dbStatus = status.toLowerCase().replace(/ /g, '_');
      const r = await safe(() => db.updateOrder(id, { status: dbStatus }).then(() => refresh()));
      return r;
    },
    assignStaff: async (id: string, payload: any) => {
      const r = await safe(() => db.updateOrder(id, payload).then(() => refresh()));
      return r;
    },
    deleteOrder: async (id: string) => {
      const r = await safe(() => db.deleteOrder(id).then(() => refresh()));
      return r;
    },
    recordPayment: async (orderId: string, payment: any) => {
      const r = await safe(() => db.recordPayment(orderId, payment).then(() => refresh()));
      return r;
    },
    selfAssign: async (orderId: string) => {
      const r = await safe(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await db.updateOrder(orderId, { assigned_designer: user.id, status: 'designing' });
        await refresh();
      });
      return r;
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY — useInventoryData()
// Used by: AdminInventory, CashierInventory, ProductionInventory
// ═══════════════════════════════════════════════════════════════════════════════
export function useInventoryData() {
  const q = useQuery(() => db.getInventoryItems(), []);
  const raw = q.data || [];

  const materials: Material[] = raw.map(mapMaterial);
  const stats = {
    total: raw.length,
    available: raw.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length,
    lowStock: raw.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length,
    restocking: raw.filter((i: any) => Number(i.current_quantity) <= 0).length,
    phasedOut: raw.filter((i: any) => !i.is_active).length,
  };

  return { materials, stats, loading: q.loading, error: q.error, refresh: q.refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGS & ACTIVITY - useLogsData()
// Reads from 3 sources: audit_logs (Staff Actions), order_logs (Order History),
// inventory_changes (Inventory Changes). All timestamps normalized to Asia/Manila.
// ═══════════════════════════════════════════════════════════════════════════════
export function useLogsData() {
  const fetchLogs = async () => {
    const normalizeTs = (ts: string) => {
      if (!ts) return 0;
      const utc = /[Z+]/.test(ts) ? ts : ts.replace(' ', 'T') + 'Z';
      return new Date(utc).getTime();
    };
    const formatTs = (ts: string) =>
      new Intl.DateTimeFormat('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Manila',
      }).format(new Date(/[Z+]/.test(ts) ? ts : ts.replace(' ', 'T') + 'Z'));

    // 1. Audit logs (Staff Actions)
    const { data: auditData } = await supabase
      .from('audit_logs')
      .select('id, created_at, action, target_table, target_id, metadata, actor_role, actor:actor_id(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(500);

    // 2. Order logs (Order History)
    const { data: ordLogs } = await supabase
      .from('order_logs')
      .select('id, created_at, status, note, order_id, user:users!order_logs_updated_by_fkey(id, first_name, last_name, role)')
      .order('created_at', { ascending: false })
      .limit(500);

    // 3. Inventory changes (Inventory Changes)
    const { data: invChanges } = await supabase
      .from('inventory_changes')
      .select('id, created_at, change_type, quantity_change, quantity_before, quantity_after, reason, inventory_items:inventory_item_id(id, name, unit_of_measure), changer:changed_by(first_name, last_name, role)')
      .order('created_at', { ascending: false })
      .limit(500);

    const staffActions = (auditData || []).map((l: any) => ({
      id: 'audit_' + l.id,
      source: 'audit' as const,
      date: formatTs(l.created_at),
      timestamp: normalizeTs(l.created_at),
      module: l.target_table || 'system',
      action: l.action,
      details: l.metadata ? Object.entries(l.metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') : '',
      user: l.actor ? `${l.actor.first_name || ''} ${l.actor.last_name || ''}`.trim() || 'System' : 'System',
      role: l.actor_role || 'system',
    }));

    const orderHistory = (ordLogs || []).map((l: any) => ({
      id: 'ord_' + l.id,
      source: 'orders' as const,
      date: formatTs(l.created_at),
      timestamp: normalizeTs(l.created_at),
      module: 'orders',
      action: `Status: ${l.status || '—'}`,
      details: l.note || '',
      user: l.user ? `${l.user.first_name || ''} ${l.user.last_name || ''}`.trim() || 'System' : 'System',
      role: l.user?.role || 'system',
    }));

    const inventoryChanges = (invChanges || []).map((l: any) => ({
      id: 'inv_' + l.id,
      source: 'inventory' as const,
      date: formatTs(l.created_at),
      timestamp: normalizeTs(l.created_at),
      module: 'inventory',
      action: l.change_type || '—',
      details: `${l.inventory_items?.name || '—'}: ${l.quantity_before} → ${l.quantity_after} ${l.inventory_items?.unit_of_measure || ''}${l.reason ? '. ' + l.reason : ''}`,
      user: l.changer ? `${l.changer.first_name || ''} ${l.changer.last_name || ''}`.trim() || 'System' : 'System',
      role: l.changer?.role || 'system',
    }));

    const all = [...staffActions, ...orderHistory, ...inventoryChanges]
      .sort((a, b) => b.timestamp - a.timestamp);

    return { all, staffActions, orderHistory, inventoryChanges };
  };

  return useQuery(fetchLogs);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CATALOG — useProductCatalog()
// Used by: HomePage
// ═══════════════════════════════════════════════════════════════════════════════
export function useProductCatalog(filters?: { search?: string; category?: string }) {
  const { products: raw, loading, error, refresh } = useProducts(filters);
  const products: CatalogProduct[] = raw.map((p: any) => ({
    id: p.id, title: p.name, category: p.category || '', variant: p.variant || '',
    size: p.size_spec || '', price: Number(p.final_price), description: p.description || '',
    isActive: p.is_active,
  }));
  return { products, loading, error, refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CART — useCartData()
// Used by: Cart, HomePage
// ═══════════════════════════════════════════════════════════════════════════════
export function useCartData() {
  const { data: rawItems, loading, error, refresh } = useQuery(() => db.getCart(), []);
  const raw = rawItems || [];

  const items: CartItem[] = raw.map((r: any) => ({
    id: r.id, productId: r.product_id,
    productName: r.product?.name || 'Unknown', category: r.product?.category || '',
    variant: r.product?.variant || '', sizeSpec: r.product?.size_spec || '',
    price: Number(r.product?.final_price || 0), quantity: r.quantity,
    specifications: r.specifications, fileUrl: r.file_url || undefined,
  }));

  const totalItems = raw.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
  const totalPrice = raw.reduce((s: number, i: any) => s + (i.quantity || 0) * parseFloat(i.product?.final_price || '0'), 0);

  return {
    items, totalItems, totalPrice, loading, error, refresh,
    addToCart:       async (productId: string, qty?: number, forceNewRow?: boolean, specifications?: string, fileUrl?: string) => { const r = await safe(() => db.addToCart(productId, qty, forceNewRow, specifications, fileUrl).then(() => refresh())); return r; },
    updateQuantity:  async (id: string, qty: number) =>         { const r = await safe(() => db.updateCartItem(id, { quantity: Math.max(1, qty) }).then(() => refresh())); return r; },
    updateCartItem:  async (id: string, updates: { quantity?: number; specifications?: string; file_url?: string }) => { const r = await safe(() => db.updateCartItem(id, updates).then(() => refresh())); return r; },
    removeItem:      async (id: string) =>                      { const r = await safe(() => db.removeCartItem(id).then(() => refresh())); return r; },
    clearCart:       async () =>                                 { const r = await safe(() => db.clearCart().then(() => refresh())); return r; },
    checkout:        async (notes?: string, due?: string) =>    { try { const o = await db.checkout(notes, due); await refresh(); return { success: true, error: null, order: o }; } catch (e: any) { return { success: false, error: e.message, order: null }; } },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS — useOrdersData()
// Used by: AdminOrders, CashierOrders, DesignerOrders, ProductionOrders
// ═══════════════════════════════════════════════════════════════════════════════
export function useOrdersData() {
  const { orders: rawOrders, stats, staff, loading, error, refresh } = useOrders();
  const orders: Order[] = rawOrders.map(mapOrder);
  const staffList = staff;

  return {
    orders, stats, staffList, loading, error, refresh,

    createOrder: async (data: { customer_id?: string | null; guest_name?: string | null; guest_phone?: string | null; guest_email?: string | null; order_type: string; items: { product_name: string; quantity: number; unit_price: number; specifications?: string }[]; special_instructions?: string; due_date?: string; assigned_designer?: string | null; assigned_production?: string | null; comments?: string | null }) => {
      const r = await safe(() => db.createOrder({
          ...data,
          assigned_designer: data.assigned_designer || undefined,
          assigned_production: data.assigned_production || undefined,
          comments: data.comments || undefined,
          customer_id: data.customer_id || undefined,
          guest_name: data.guest_name || undefined,
          guest_phone: data.guest_phone || undefined,
          guest_email: data.guest_email || undefined,
      }).then(() => refresh()));
      return r;
    },
    updateStatus: async (orderId: string, status: string) => {
      const dbStatus = status.toLowerCase().replace(/ /g, '_');
      const r = await safe(() => db.updateOrder(orderId, { status: dbStatus }).then(() => refresh()));
      return r;
    },
    assignStaff: async (orderId: string, assignment: { assigned_designer?: string; assigned_production?: string }) => {
      const r = await safe(() => db.updateOrder(orderId, assignment).then(() => refresh()));
      return r;
    },
    deleteOrder: async (orderId: string) => {
      const r = await safe(() => db.deleteOrder(orderId).then(() => refresh()));
      return r;
    },
    recordPayment: async (orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) => {
      const r = await safe(() => db.recordPayment(orderId, payment).then(() => refresh()));
      return r;
    },
    selfAssign: async (orderId: string) => {
      const r = await safe(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const order = await db.createOrder({
          customer_id: user.id,
          order_type: 'online',
          special_instructions: item.specifications,
          items: [{
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            specifications: item.specifications,
            file_url: item.fileUrl,
          }],
        });
        return { success: true, error: null, order };
      } catch (e: any) {
        return { success: false, error: e.message, order: null };
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGEMENT — useManagementData()
// Used by: AdminManagement
// ═══════════════════════════════════════════════════════════════════════════════
export function useManagementData() {
  const { users: rawUsers, loading: uL, refresh: refreshUsers } = useUsers();
  const { employees: rawEmps, loading: eL, refresh: refreshEmps } = useEmployees();
  const { suppliers: rawSups, loading: sL, refresh: refreshSups } = useSuppliers();

  const users: FrontendUser[] = rawUsers.map(mapUser);
  const employees: EmployeeRecord[] = rawEmps.map(mapEmployee);
  const suppliers: FrontendSupplier[] = rawSups.map(mapSupplier);

  return {
    users, employees, suppliers, loading: uL || eL || sL,

    createUser: async (data: { firstName: string; lastName: string; email: string; username: string; password: string; role: string; phoneNumber?: string }) => {
      const r = await safe(() => adminApi.createUser({ email: data.email, password: data.password, role: data.role.toLowerCase(), first_name: data.firstName, last_name: data.lastName, username: data.username, contact_number: data.phoneNumber }).then(() => refreshUsers()));
      return r;
    },
    updateUser: async (id: string, data: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; role?: string }) => {
      const r = await safe(() => adminApi.updateUser(id, { first_name: data.firstName, last_name: data.lastName, email: data.email, contact_number: data.phoneNumber, role: data.role?.toLowerCase() }).then(() => refreshUsers()));
      return r;
    },
    deactivateUsers: async (ids: string[]) => {
      const r = await safe(() => adminApi.deactivateUsers(ids).then(() => refreshUsers()));
      return r;
    },

    createEmployee: async (data: { employeeCode?: string; fullName: string; position: string; role?: EmployeeRole; baseHourlyRate?: number; hireDate?: string }) => {
      const r = await safe(() => db.createEmployee({ employee_code: data.employeeCode, full_name: data.fullName, position: data.position, role: data.role, base_hourly_rate: data.baseHourlyRate, hire_date: data.hireDate }).then(() => refreshEmps()));
      return r;
    },
    updateEmployee: async (id: string, data: { fullName?: string; position?: string; role?: string; baseHourlyRate?: number; holidayMultiplier?: number; overtimeMultiplier?: number }) => {
      const updates: Record<string, any> = {};
      if (data.role !== undefined)             updates.role                  = data.role;
      if (data.fullName !== undefined)         updates.full_name             = data.fullName;
      if (data.position !== undefined)         updates.position              = data.position;
      if (data.baseHourlyRate !== undefined)   updates.base_hourly_rate      = data.baseHourlyRate;
      if (data.holidayMultiplier !== undefined) updates.holiday_rate_multiplier  = data.holidayMultiplier;
      if (data.overtimeMultiplier !== undefined) updates.overtime_rate_multiplier = data.overtimeMultiplier;
      const r = await safe(() => db.updateEmployee(id, updates).then(() => refreshEmps()));
      return r;
    },
    deactivateEmployee: async (id: string) => {
      const r = await safe(() => db.updateEmployee(id, { is_active: false }).then(() => refreshEmps()));
      return r;
    },

    createSupplier: async (data: { name: string; phone?: string; email?: string }) => {
      const r = await safe(() => db.createSupplier({ name: data.name, phone: data.phone, email: data.email }).then(() => refreshSups()));
      return r;
    },
    flagSupplier: async (id: string, flagged: boolean, notes?: string) => {
      const r = await safe(() => db.updateSupplier(id, { is_flagged: flagged, flag_notes: notes || '' }).then(() => refreshSups()));
      return r;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD (aggregated)
// ═══════════════════════════════════════════════════════════════════════════════
export function useDashboard() {
  const { orders, stats: orderStats, loading: oL, refresh } = useOrdersData();
  const { data: inventory, loading: iL } = useQuery(() => db.getInventoryItems(), []);
  const items = inventory || [];

  const invStats = {
    total: items.length,
    available: items.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length,
    lowStock: items.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length,
    restocking: items.filter((i: any) => Number(i.current_quantity) <= 0).length,
    phasedOut: items.filter((i: any) => !i.is_active).length,
  };

  const lowStockItems = items
    .filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point))
    .map((i: any) => ({ id: i.id, name: i.name, currentQty: Number(i.current_quantity), reorderPoint: Number(i.reorder_point), unit: i.unit_of_measure }));

  const recentOrders = orders.slice(0, 5).map((o: any) => {
    const c = o.customer;
    return {
      id: o.id, orderId: o.order_number,
      customerName: c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Walk-in',
      product: o.order_items?.[0]?.product_name || 'Multiple',
      amount: Number(o.total_amount) || 0,
      status: o.status, date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
    };
  });

  const totalRevenue = orders.reduce((s: number, o: any) => s + (Number(o.total_amount) || 0), 0);
  const totalCollected = orders.reduce((s: number, o: any) => s + (Number(o.amount_paid) || 0), 0);
  const extendedOrderStats = { ...orderStats, totalRevenue, totalCollected, unpaid: orderStats.pendingPayment };

  return { orderStats: extendedOrderStats, invStats, lowStockItems, recentOrders, loading: oL || iL };
}

export function useDashboardData() {
  const { orderStats, invStats, lowStockItems, recentOrders, loading } = useDashboard();
  return {
    data: { orderStats, inventoryStats: invStats, lowStockItems, recentOrders },
    loading,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS (admin) — useProductsData()
// Used by: AdminInventory Products tab
// ═══════════════════════════════════════════════════════════════════════════════
function mapAdminProduct(raw: any): AdminProduct {
  const bom: BOMItem[] = (raw.product_supply_mapping || []).map((m: any) => ({
    id: m.id,
    inventoryItemId: m.inventory_item_id,
    materialName: m.inventory_items?.name || '—',
    quantityRequired: Number(m.quantity_required),
    unitOfMeasure: m.inventory_items?.unit_of_measure || '',
    unitCost: Number(m.inventory_items?.unit_cost) || 0,
  }));
  return {
    id: raw.id, name: raw.name, category: raw.category || '',
    variant: raw.variant || '', sizeSpec: raw.size_spec || '',
    materialCost: Number(raw.material_cost) || 0,
    profitFee: Number(raw.profit_fee) || 0,
    finalPrice: Number(raw.final_price) || 0,
    isActive: raw.is_active ?? true, description: raw.description || '',
    bom,
  };
}

export function useProductsData() {
  const q = useQuery(() => db.getProductsWithBOM(), []);
  const { data: rawMaterials } = useQuery(() => db.getInventoryItems(), []);
  const raw = q.data || [];
  const products: AdminProduct[] = raw.map(mapAdminProduct);
  const materials = (rawMaterials || []).filter((m: any) => m.is_active);

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    inactive: products.filter(p => !p.isActive).length,
  };

  return {
    products, stats, materials, loading: q.loading, error: q.error, refresh: q.refresh,

    createProduct: async (product: { name: string; category?: string; variant?: string; size_spec?: string; material_cost: number; profit_fee: number; final_price: number; description?: string },
      bom: { inventory_item_id: string; quantity_required: number }[]) => {
      const r = await safe(() => db.createProductWithBOM(product, bom).then(() => q.refresh()));
      return r;
    },
    updateProduct: async (id: string, product: Record<string, any>, bom?: { inventory_item_id: string; quantity_required: number }[]) => {
      const r = await safe(() => db.updateProductWithBOM(id, product, bom).then(() => q.refresh()));
      return r;
    },
    deleteProduct: async (id: string) => {
      const r = await safe(() => db.deleteProduct(id).then(() => q.refresh()));
      return r;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERIES — useDeliveries()
// Used by: AdminInventory Deliveries tab
// ═══════════════════════════════════════════════════════════════════════════════
function mapDelivery(raw: any): Delivery {
  const req = raw.requester;
  return {
    id: raw.id,
    inventoryItemId: raw.inventory_item_id,
    materialName: raw.inventory_item?.name || '—',
    materialUnit: raw.inventory_item?.purchase_unit || raw.inventory_item?.unit_of_measure || '',
    supplierId: raw.supplier_id,
    supplierName: raw.supplier?.name || '—',
    requestedBy: raw.requested_by,
    requestedByName: req ? `${req.first_name || ''} ${req.last_name || ''}`.trim() : '—',
    requestedQuantity: Number(raw.requested_quantity),
    expectedArrivalDate: raw.expected_arrival_date || '',
    status: raw.status as DeliveryStatus,
    receivedQuantity: Number(raw.received_quantity) || 0,
    receiptReferenceNumber: raw.receipt_reference_number || '',
    receivedDate: raw.received_date ? new Date(raw.received_date).toLocaleDateString() : '',
    notes: raw.notes || '',
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
  };
}

export function useDeliveries() {
  const q = useQuery(() => db.getDeliveries(), []);
  const { data: rawMaterials } = useQuery(() => db.getInventoryItems(), []);
  const { data: rawSuppliers } = useQuery(() => db.getSuppliers(), []);
  const raw = q.data || [];
  const deliveries: Delivery[] = raw.map(mapDelivery);
  const materials = (rawMaterials || []).filter((m: any) => m.is_active);
  const suppliers = (rawSuppliers || []).filter((s: any) => s.is_active);

  const stats = {
    total: deliveries.length,
    requested: deliveries.filter(d => d.status === 'requested').length,
    ordered: deliveries.filter(d => d.status === 'ordered').length,
    enRoute: deliveries.filter(d => d.status === 'en_route').length,
    received: deliveries.filter(d => d.status === 'received').length,
    completed: deliveries.filter(d => d.status === 'completed').length,
  };

  return {
    deliveries, stats, materials, suppliers, loading: q.loading, error: q.error, refresh: q.refresh,

    createDelivery: async (data: { inventory_item_id: string; supplier_id?: string; requested_quantity: number; expected_arrival_date?: string; notes?: string }) => {
      const r = await safe(() => db.createDelivery(data).then(() => q.refresh()));
      return r;
    },
    updateDelivery: async (id: string, updates: Record<string, any>) => {
      const r = await safe(() => db.updateDelivery(id, updates).then(() => q.refresh()));
      return r;
    },
    confirmReceipt: async (id: string, receipt: { received_quantity: number; receipt_reference_number: string }) => {
      const r = await safe(() => db.confirmDeliveryReceipt(id, receipt).then(() => q.refresh()));
      return r;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASH ADVANCES — useCashAdvances() + usePendingCashAdvances()
// ═══════════════════════════════════════════════════════════════════════════════

export type CashAdvanceStatus = 'pending' | 'approved' | 'deducted' | 'declined' | 'cancelled';

export interface CashAdvance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeePosition: string;
  amount: number;
  dateIssued: string;
  reason: string;
  status: CashAdvanceStatus;
  payrollPeriodId: string | null;
  issuedByName: string;
  createdAt: string;
  declineReason?: string;
}

export interface PendingCashAdvance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeePosition: string;
  dailyRate: number;
  amount: number;
  /** 50% of 13-day semi-monthly pay */
  allowedLimit: number;
  /** Sum of other pending advances for this employee */
  pendingTotal: number;
  /** allowedLimit − pendingTotal */
  remainingAllowed: number;
  reason: string;
  dateIssued: string;
  issuedByName: string;
}

function mapCashAdvance(raw: any): CashAdvance {
  const emp    = raw.employee;
  const issuer = raw.issuer;
  return {
    id:               raw.id,
    employeeId:       raw.employee_id,
    employeeCode:     emp?.employee_code || '',
    employeeName:     emp?.full_name || '',
    employeePosition: emp?.position || '',
    amount:           Number(raw.amount) || 0,
    dateIssued:       raw.date_issued || '',
    reason:           raw.reason || '',
    status:           raw.status as CashAdvanceStatus,
    payrollPeriodId:  raw.payroll_period_id || null,
    issuedByName:     issuer
                        ? `${issuer.first_name || ''} ${issuer.last_name || ''}`.trim()
                        : '—',
    createdAt:        raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
    declineReason:    raw.decline_reason || '',
  };
}

function mapPendingCashAdvance(raw: any, allPending: any[]): PendingCashAdvance {
  const emp        = raw.employee;
  const dailyRate  = Number(emp?.base_hourly_rate) || 0; // stored as daily rate
  const allowedLimit = Math.round(dailyRate * 13 * 0.5); // 50% of semi-monthly pay
  const pendingTotal = allPending
    .filter(a => a.employee_id === raw.employee_id && a.id !== raw.id)
    .reduce((s: number, a: any) => s + Number(a.amount), 0);
  const issuer = raw.issuer;
  return {
    id:               raw.id,
    employeeId:       raw.employee_id,
    employeeCode:     emp?.employee_code || '',
    employeeName:     emp?.full_name || '',
    employeePosition: emp?.position || '',
    dailyRate,
    amount:           Number(raw.amount) || 0,
    allowedLimit,
    pendingTotal,
    remainingAllowed: Math.max(0, allowedLimit - pendingTotal),
    reason:           raw.reason || '',
    dateIssued:       raw.date_issued || '',
    issuedByName:     issuer
                        ? `${issuer.first_name || ''} ${issuer.last_name || ''}`.trim()
                        : '—',
  };
}

export function useCashAdvances(filters?: { employee_id?: string; status?: string }) {
  const q = useQuery(
    () => db.cashAdvances.getAll(filters),
    [filters?.employee_id, filters?.status]
  );

  const advances: CashAdvance[] = (q.data || []).map(mapCashAdvance);

  const stats = {
    total:     advances.length,
    pending:   advances.filter(a => a.status === 'pending').length,
    approved:  advances.filter(a => a.status === 'approved').length,
    deducted:  advances.filter(a => a.status === 'deducted').length,
    cancelled: advances.filter(a => a.status === 'cancelled').length,
    totalPending: advances
      .filter(a => a.status === 'pending')
      .reduce((s, a) => s + a.amount, 0),
  };

  return {
    advances, stats,
    loading: q.loading, error: q.error, refresh: q.refresh,

    createAdvance: async (data: {
      employee_id: string; amount: number; date_issued?: string; reason?: string;
    }) => {
      const r = await safe(() => db.cashAdvances.create(data).then(() => q.refresh()));
      return r;
    },

    cancelAdvance: async (id: string) => {
      const r = await safe(() => db.cashAdvances.cancel(id).then(() => q.refresh()));
      return r;
    },
  };
}

// ── usePendingCashAdvances — for the admin dashboard approval panel ──────────
export function usePendingCashAdvances() {
  const q = useQuery(() => db.cashAdvances.getPendingRequests(), []);
  const rawAll = (q.data || []) as any[];

  const pendingAdvances: PendingCashAdvance[] = rawAll.map(raw =>
    mapPendingCashAdvance(raw, rawAll)
  );

  return {
    pendingAdvances,
    loading: q.loading,
    error:   q.error,
    refresh: q.refresh,

    approveAdvance: async (id: string) => {
      const r = await safe(() => db.cashAdvances.approve(id).then(() => q.refresh()));
      return r;
    },

    declineAdvance: async (id: string, reason: string) => {
      const r = await safe(() => db.cashAdvances.decline(id, reason).then(() => q.refresh()));
      return r;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PayrollPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: 'draft' | 'processing' | 'complete';
  createdAt: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  position: string;
  dailyRate: number;
  workedHours: number;
  requiredHours: number;
  lateTimeslots: number;
  earlyLeaveTimeslots: number;
  regularOvertimeHours: number;
  holidayOvertimeHours: number;
  specialOvertimeHours: number;
  businessTripDays: number;
  absences: number;
  onLeaveDays: number;
  additionalPay: number;
  deductionAmount: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  position: string;
  dailyRate: number;
  daysPresent: number;
  basicPay: number;
  regularHolidayPay: number;
  specialHolidayPay: number;
  regularOvertime: number;
  holidayOvertime: number;
  specialOvertime: number;
  grossIncome: number;
  tardyDeductions: number;
  undertimeDeductions: number;
  sss: number;
  philhealth: number;
  hdmf: number;
  withholdingTax: number;
  cashAdvance: number;
  totalDeductions: number;
  netPay: number;
  taxableIncome: number;
  status: 'pending' | 'paid';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL MAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

function mapPeriod(raw: any): PayrollPeriod {
  return {
    id: raw.id,
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    payDate: raw.pay_date || '',
    status: raw.status,
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
  };
}

function mapAttendanceLog(raw: any): AttendanceLog {
  const emp = raw.employee;
  const dailyRate = Number(emp?.base_hourly_rate) || 0; // stored as daily rate
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeCode: emp?.employee_code || '',
    fullName: emp?.full_name || '',
    position: emp?.position || '',
    dailyRate: dailyRate,
    workedHours: Number(raw.worked_hours) || 0,
    requiredHours: Number(raw.required_hours) || 160,
    lateTimeslots: Number(raw.late_timeslots) || 0,
    earlyLeaveTimeslots: Number(raw.early_leave_timeslots) || 0,
    regularOvertimeHours: Number(raw.regular_overtime_hours) || 0,
    holidayOvertimeHours: Number(raw.holiday_overtime_hours) || 0,
    specialOvertimeHours: Number(raw.special_overtime_hours) || 0,
    businessTripDays: Number(raw.business_trip_days) || 0,
    absences: Number(raw.absences) || 0,
    onLeaveDays: Number(raw.on_leave_days) || 0,
    additionalPay: Number(raw.additional_pay) || 0,
    deductionAmount: Number(raw.deduction_amount) || 0,
  };
}

function mapPayrollRecord(raw: any): PayrollRecord {
  const emp = raw.employee;
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeName: emp?.full_name || '',
    employeeCode: emp?.employee_code || '',
    position: emp?.position || '',
    dailyRate: Number(raw.daily_rate) || 0,
    daysPresent: Number(raw.days_present) || 0,
    basicPay: Number(raw.basic_pay) || 0,
    regularHolidayPay: Number(raw.regular_holiday_pay) || 0,
    specialHolidayPay: Number(raw.special_holiday_pay) || 0,
    regularOvertime: Number(raw.regular_overtime) || 0,
    holidayOvertime: Number(raw.holiday_overtime) || 0,
    specialOvertime: Number(raw.special_overtime) || 0,
    grossIncome: Number(raw.gross_income) || 0,
    tardyDeductions: Number(raw.tardy_deductions) || 0,
    undertimeDeductions: Number(raw.undertime_deductions) || 0,
    sss: Number(raw.sss) || 0,
    philhealth: Number(raw.philhealth) || 0,
    hdmf: Number(raw.hdmf) || 0,
    withholdingTax: Number(raw.withholding_tax) || 0,
    cashAdvance: Number(raw.cash_advance) || 0,
    totalDeductions: Number(raw.total_deductions) || 0,
    netPay: Number(raw.net_pay) || 0,
    taxableIncome: Number(raw.taxable_income) || 0,
    status: raw.status || 'pending',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL — usePayrollData()
// Used by: AdminPayroll
// ═══════════════════════════════════════════════════════════════════════════════
export function usePayrollData() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const periodsQ = useQuery(() => db.payroll.getPeriods(), []);
  const periods: PayrollPeriod[] = (periodsQ.data || []).map(mapPeriod);

  // Auto-select most recent period
  const activePeriodId = selectedPeriodId || periods[0]?.id || null;
  const currentPeriod  = periods.find(p => p.id === activePeriodId) || null;

  const attendanceQ = useQuery(
    () => activePeriodId
      ? db.payroll.getAttendanceLogs(activePeriodId)
      : Promise.resolve([]),
    [activePeriodId]
  );

  const payrollQ = useQuery(
    () => activePeriodId
      ? db.payroll.getPayrollRecords(activePeriodId)
      : Promise.resolve([]),
    [activePeriodId]
  );

  const attendanceLogs: AttendanceLog[]  = (attendanceQ.data || []).map(mapAttendanceLog);
  const payrollRecords: PayrollRecord[]  = (payrollQ.data  || []).map(mapPayrollRecord);

  const dashboardStats = {
    totalEmployees:    attendanceLogs.length,
    grossPayroll:      payrollRecords.reduce((s, r) => s + r.grossIncome, 0),
    netPayroll:        payrollRecords.reduce((s, r) => s + r.netPay, 0),
    totalDeductions:   payrollRecords.reduce((s, r) => s + r.totalDeductions, 0),
    totalWorkHours:    attendanceLogs.reduce((s, l) => s + l.workedHours, 0),
    totalOvertimeHours: attendanceLogs.reduce((s, l) =>
      s + l.regularOvertimeHours + l.holidayOvertimeHours + l.specialOvertimeHours, 0),
    totalAbsences:     attendanceLogs.reduce((s, l) => s + l.absences, 0),
  };

  const loading = periodsQ.loading || attendanceQ.loading || payrollQ.loading;
  const error   = periodsQ.error   || attendanceQ.error   || payrollQ.error;

  const refresh = useCallback(() => {
    periodsQ.refresh();
    attendanceQ.refresh();
    payrollQ.refresh();
  }, [activePeriodId]);

  return {
    // Data
    periods, currentPeriod, activePeriodId, attendanceLogs, payrollRecords,
    dashboardStats, loading, error, computing,

    // Period selector
    setSelectedPeriodId,

    // Refresh
    refresh,

    // Mutations
    createPeriod: async (data: { period_start: string; period_end: string; pay_date?: string }) => {
      const r = await safe(() => db.payroll.createPeriod(data).then(() => periodsQ.refresh()));
      return r;
    },

    updateAttendanceLog: async (log: {
      employee_id: string; payroll_period_id: string;
      worked_hours?: number; required_hours?: number;
      late_timeslots?: number; early_leave_timeslots?: number;
      regular_overtime_hours?: number; holiday_overtime_hours?: number;
      special_overtime_hours?: number; business_trip_days?: number;
      absences?: number; on_leave_days?: number;
      additional_pay?: number; deduction_amount?: number;
    }) => {
      const r = await safe(() =>
        db.payroll.upsertAttendanceLog(log).then(() => attendanceQ.refresh())
      );
      return r;
    },

    computePayroll: async (periodId: string) => {
      setComputing(true);
      const r = await safe(() =>
        db.payroll.computePayroll(periodId).then(() => payrollQ.refresh())
      );
      setComputing(false);
      return r;
    },

    updatePayrollRecord: async (id: string, updates: Record<string, any>) => {
      const r = await safe(() =>
        db.payroll.updatePayrollRecord(id, updates).then(() => payrollQ.refresh())
      );
      return r;
    },

    markPeriodComplete: async (periodId: string) => {
      const r = await safe(() =>
        db.payroll.updatePeriod(periodId, { status: 'complete' }).then(() => periodsQ.refresh())
      );
      return r;
    },

    markAllPaid: async (periodId: string) => {
      const r = await safe(async () => {
        const records = await db.payroll.getPayrollRecords(periodId);
        for (const rec of records) {
          await db.payroll.updatePayrollRecord(rec.id, { status: 'paid' });
        }
        payrollQ.refresh();
      });
      return r;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS — useLogsData()
// Used by: AdminAuditLogs
// ═══════════════════════════════════════════════════════════════════════════════
export function useLogsData() {
  const q = useQuery(async () => {
    const { data, error } = await supabase
      .from('order_logs')
      .select(`*, updated_by_user:updated_by(id, first_name, last_name, role)`)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  }, []);

  const logs = (q.data || []).map((raw: any) => ({
    id:        raw.id,
    orderId:   raw.order_id,
    updatedBy: raw.updated_by_user
                 ? `${raw.updated_by_user.first_name || ''} ${raw.updated_by_user.last_name || ''}`.trim()
                 : '—',
    role:      raw.updated_by_user?.role || '—',
    status:    raw.status || '',
    note:      raw.note || '',
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleString() : '',
  }));

  return { logs, loading: q.loading, error: q.error, refresh: q.refresh };
}