// frontend/src/hooks/useSupabase.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE hook file — ALL data access, mapping, and mutations.
// Components import ONLY from this file. No bridge layers.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { db } from '../lib/database';
import { adminApi } from '../lib/adminApi';
import type {
  Order, OrderStatus, PaymentStatus, MaterialStatus, Material,
  UserRole, FrontendUser, FrontendSupplier, EmployeeRecord, CatalogProduct, CartItem,
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

async function safe(fn: () => Promise<any>): Promise<{ success: boolean; error: string | null }> {
  try { await fn(); return { success: true, error: null }; }
  catch (err: any) { return { success: false, error: err.message || 'Operation failed' }; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAPPERS
// ═══════════════════════════════════════════════════════════════════════════════
function mapStatus(s: string): OrderStatus {
  const m: Record<string, OrderStatus> = { in_queue: 'In Queue', designing: 'Designing', payment: 'Payment', production: 'Production', pickup: 'Pickup', completed: 'Completed', overdue: 'Overdue' };
  return m[s] || (s as OrderStatus);
}
function mapPayment(s: string): PaymentStatus {
  const m: Record<string, PaymentStatus> = { paid: 'Paid', unpaid: 'Unpaid', partial: 'Partial' };
  return m[s] || (s as PaymentStatus);
}

function mapOrder(raw: any): Order {
  const c = raw.customer; const items = raw.order_items || [];
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
    specialInstructions: raw.special_instructions || items[0]?.specifications || '',
    designFile: raw.design_file_url || items[0]?.file_url || '',
    assignedDesigner: raw.assigned_designer || '', assignedProduction: raw.assigned_production || '',
    designerName: raw.designer ? `${raw.designer.first_name || ''} ${raw.designer.last_name || ''}`.trim() : '',
    productionName: raw.production_staff ? raw.production_staff.full_name || '' : '',
    comments: raw.comments || '', amountPaid: Number(raw.amount_paid) || 0, orderType: raw.order_type || 'walk-in',
    finalDesignUrl: raw.final_design_url || '',
  };
}

function mapUser(raw: any): FrontendUser {
  return {
    id: raw.id, firstName: raw.first_name || '', lastName: raw.last_name || '',
    email: raw.email || '',
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
    role: (raw.role ? raw.role.toLowerCase() : 'production') as UserRole,
    baseHourlyRate: Number(raw.base_hourly_rate) || 0,
    holidayRateMultiplier: Number(raw.holiday_rate_multiplier) || 2.0,
    overtimeRateMultiplier: Number(raw.overtime_rate_multiplier) || 1.5,
    hireDate: raw.hire_date ? new Date(raw.hire_date).toLocaleDateString() : '',
    isActive: raw.is_active ?? true,
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
    purchaseQty: Number(item.conversion_rate ?? 1), purchaseUnit: item.purchase_unit || item.unit_of_measure,
    supplier: pref?.suppliers?.name || '—', status: deriveMatStatus(item),
    isActive: item.is_active, description: item.description,
    lastSupplierCost: pref ? Number(pref.supplier_unit_price) : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════
export function useMyProfile() { const q = useQuery(() => db.getMyProfile(), []); return { profile: q.data, ...q }; }
export function useUsers(filters?: { role?: string; status?: string }) { const q = useQuery(() => db.getUsers(filters), [filters?.role, filters?.status]); return { users: q.data || [], ...q }; }
export function useEmployees() { const q = useQuery(() => db.getEmployees(), []); return { employees: q.data || [], ...q }; }
export function useSuppliers() { const q = useQuery(() => db.getSuppliers(), []); return { suppliers: q.data || [], ...q }; }
export function useProducts(filters?: { search?: string; category?: string }) { const q = useQuery(() => db.getProducts(filters), [filters?.search, filters?.category]); return { products: q.data || [], ...q }; }

export function useOrders(filters?: { status?: string; assigned_designer?: string; assigned_production?: string }) {
  const { data: rawOrders, loading, error, refresh } = useQuery(() => db.getOrders(filters), [filters?.status, filters?.assigned_designer, filters?.assigned_production]);
  const { data: staffList } = useQuery(() => db.getStaffList(), []);
  const orders = rawOrders || [];
  const staff = (staffList || []).map((s: any) => ({ id: s.id, firstName: s.first_name || '', lastName: s.last_name || '', role: s.role }));
  const now = new Date();
  const stats = {
    total: orders.length, inQueue: orders.filter((o: any) => o.status === 'in_queue').length,
    designing: orders.filter((o: any) => o.status === 'designing').length,
    production: orders.filter((o: any) => o.status === 'production').length,
    pickup: orders.filter((o: any) => o.status === 'pickup').length,
    completed: orders.filter((o: any) => o.status === 'completed').length,
    overdue: orders.filter((o: any) => o.due_date && new Date(o.due_date) < now && !['completed', 'cancelled', 'pickup'].includes(o.status)).length,
    pendingPayment: orders.filter((o: any) => o.payment_status !== 'paid').length,
    readyPickup: orders.filter((o: any) => o.status === 'pickup').length,
  };
  return { orders, stats, staff, loading, error, refresh };
}

export function useInventoryData() {
  const q = useQuery(() => db.getInventoryItems(), []);
  const raw = q.data || [];
  const materials: Material[] = raw.map(mapMaterial);
  const stats = { total: raw.length, available: raw.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length, lowStock: raw.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length, restocking: raw.filter((i: any) => Number(i.current_quantity) <= 0).length, phasedOut: raw.filter((i: any) => !i.is_active).length };
  return { materials, stats, loading: q.loading, error: q.error, refresh: q.refresh };
}

export function useProductCatalog(filters?: { search?: string; category?: string }) {
  const { products: raw, loading, error, refresh } = useProducts(filters);
  const products: CatalogProduct[] = raw.map((p: any) => ({ id: p.id, title: p.name, category: p.category || '', variant: p.variant || '', size: p.size_spec || '', price: Number(p.final_price), description: p.description || '', isActive: p.is_active }));
  return { products, loading, error, refresh };
}

export function useCartData() {
  const { data: rawItems, loading, error, refresh } = useQuery(() => db.getCart(), []);
  const raw = rawItems || [];
  const items: CartItem[] = raw.map((r: any) => ({ id: r.id, productId: r.product_id, productName: r.product?.name || 'Unknown', category: r.product?.category || '', variant: r.product?.variant || '', sizeSpec: r.product?.size_spec || '', price: Number(r.product?.final_price || 0), quantity: r.quantity, specifications: r.specifications, fileUrl: r.file_url }));
  const totalItems = raw.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
  const totalPrice = raw.reduce((s: number, i: any) => s + (i.quantity || 0) * parseFloat(i.product?.final_price || '0'), 0);
  return {
    items, totalItems, totalPrice, loading, error, refresh,
    addToCart: async (productId: string, qty?: number, forceNewRow?: boolean, specs?: string, fileUrl?: string) => safe(() => db.addToCart(productId, qty, forceNewRow, specs, fileUrl).then(() => refresh())),
    updateQuantity: async (id: string, qty: number) => safe(() => db.updateCartItem(id, { quantity: Math.max(1, qty) }).then(() => refresh())),
    updateCartItem: async (id: string, updates: { quantity?: number; specifications?: string; fileUrl?: string }) => safe(() => db.updateCartItem(id, updates).then(() => refresh())),
    removeItem: async (id: string) => safe(() => db.removeCartItem(id).then(() => refresh())),
    clearCart: async () => safe(() => db.clearCart().then(() => refresh())),
    checkout: async (notes?: string, due?: string) => { try { const o = await db.checkout(notes, due); await refresh(); return { success: true, error: null, order: o }; } catch (e: any) { return { success: false, error: e.message, order: null }; } },
    directOrder: async (data: { productId: string; productName: string; quantity: number; unitPrice: number; specifications?: string; fileUrl?: string }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await db.createOrder({ customer_id: user.id, order_type: 'online', special_instructions: data.specifications, items: [{ product_id: data.productId, product_name: data.productName, quantity: data.quantity, unit_price: data.unitPrice, specifications: data.specifications, file_url: data.fileUrl }] });
        return { success: true, error: null };
      } catch (e: any) { return { success: false, error: e.message || 'Failed to place order' }; }
    },
  };
}

export function useOrdersData(filters?: { status?: string; assigned_designer?: string; assigned_production?: string }) {
  const { orders: rawOrders, stats, staff, loading, error, refresh } = useOrders(filters);
  const orders: Order[] = rawOrders.map(mapOrder);
  const designers = staff.filter((s: any) => s.role === 'designer').map((s: any) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim() }));
  const productionStaff = staff.filter((s: any) => s.role === 'production').map((s: any) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim() }));
  return {
    orders, stats, staffList: staff, designers, productionStaff, loading, error, refresh,
    createOrder: async (data: any) => safe(() => db.createOrder({ ...data, assigned_designer: data.assigned_designer || undefined, assigned_production: data.assigned_production || undefined, comments: data.comments || undefined, customer_id: data.customer_id || undefined, guest_name: data.guest_name || undefined, guest_phone: data.guest_phone || undefined, guest_email: data.guest_email || undefined }).then(() => refresh())),
    updateStatus: async (orderId: string, status: string) => {
      const dbStatus = status.toLowerCase().replace(/ /g, '_');
      return safe(async () => {
        await db.updateOrder(orderId, { status: dbStatus });
        if (dbStatus === 'production') { try { await db.deductInventoryForOrder(orderId); } catch (invErr) { console.error("Inventory deduction failed:", invErr); } }
        await refresh();
      });
    },
    assignStaff: async (orderId: string, assignment: { assigned_designer?: string; assigned_production?: string }) => safe(() => db.updateOrder(orderId, assignment).then(() => refresh())),
    deleteOrder: async (orderId: string) => safe(() => db.deleteOrder(orderId).then(() => refresh())),
    recordPayment: async (orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) => safe(() => db.recordPayment(orderId, payment).then(() => refresh())),
    selfAssign: async (orderId: string) => safe(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const updatedOrder = await db.updateOrder(orderId, { assigned_designer: user.id, status: 'designing' });
      if (updatedOrder?.customer_id) {
        try {
          const designerProfile = await db.getMyProfile();
          const designerName = designerProfile ? `${designerProfile.first_name || ''} ${designerProfile.last_name || ''}`.trim() : 'Your designer';
          await db.chat.sendMessage(updatedOrder.customer_id, `Hi! Your order **${updatedOrder.order_number}** has been accepted by ${designerName} and is now being designed. We'll keep you posted! 🎨`, orderId);
        } catch (msgErr) { console.warn('Auto-message failed:', msgErr); }
      }
      await refresh();
    }),
    updateCustomerDesign: async (orderId: string, url: string) => safe(() => db.updateCustomerDesign(orderId, url).then(() => refresh())),
    updateFinalDesign: async (orderId: string, url: string) => safe(() => db.updateOrder(orderId, { final_design_url: url }).then(() => refresh())),
  };
}

export function useManagementData() {
  const { users: rawUsers, loading: uL, refresh: refreshUsers } = useUsers();
  const { employees: rawEmps, loading: eL, refresh: refreshEmps } = useEmployees();
  const { suppliers: rawSups, loading: sL, refresh: refreshSups } = useSuppliers();
  const users: FrontendUser[] = rawUsers.map(mapUser);
  const employees: EmployeeRecord[] = rawEmps.map(mapEmployee);
  const suppliers: FrontendSupplier[] = rawSups.map(mapSupplier);
  return {
    users, employees, suppliers, loading: uL || eL || sL,
    createUser: async (data: { firstName: string; lastName: string; email: string; password: string; role: string; phoneNumber?: string }) => safe(() => adminApi.createUser({ email: data.email, password: data.password, role: data.role.toLowerCase(), first_name: data.firstName, last_name: data.lastName, contact_number: data.phoneNumber }).then(() => refreshUsers())),
    updateUser: async (id: string, data: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; role?: string }) => safe(() => adminApi.updateUser(id, { first_name: data.firstName, last_name: data.lastName, email: data.email, contact_number: data.phoneNumber, role: data.role?.toLowerCase() }).then(() => refreshUsers())),
    deactivateUsers: async (ids: string[]) => safe(() => adminApi.deactivateUsers(ids).then(() => refreshUsers())),
    createEmployee: async (data: { employeeCode?: string; fullName: string; position: string; role?: EmployeeRole; baseHourlyRate?: number; hireDate?: string }) => safe(() => db.createEmployee({ employee_code: data.employeeCode, full_name: data.fullName, position: data.position, role: data.role, base_hourly_rate: data.baseHourlyRate, hire_date: data.hireDate }).then(() => refreshEmps())),
    updateEmployee: async (id: string, data: { fullName?: string; position?: string; role?: string; baseHourlyRate?: number; holidayMultiplier?: number; overtimeMultiplier?: number }) => {
      const updates: Record<string, any> = {};
      if (data.role !== undefined)              updates.role                      = data.role;
      if (data.fullName !== undefined)          updates.full_name                 = data.fullName;
      if (data.position !== undefined)          updates.position                  = data.position;
      if (data.baseHourlyRate !== undefined)    updates.base_hourly_rate          = data.baseHourlyRate;
      if (data.holidayMultiplier !== undefined) updates.holiday_rate_multiplier   = data.holidayMultiplier;
      if (data.overtimeMultiplier !== undefined) updates.overtime_rate_multiplier = data.overtimeMultiplier;
      return safe(() => db.updateEmployee(id, updates).then(() => refreshEmps()));
    },
    deactivateEmployee: async (id: string) => safe(() => db.updateEmployee(id, { is_active: false }).then(() => refreshEmps())),
    createSupplier: async (data: { name: string; phone?: string; email?: string }) => safe(() => db.createSupplier({ name: data.name, phone: data.phone, email: data.email }).then(() => refreshSups())),
    flagSupplier: async (id: string, flagged: boolean, notes?: string) => safe(() => db.updateSupplier(id, { is_flagged: flagged, flag_notes: notes || '' }).then(() => refreshSups())),
    toggleSupplierActive: async (id: string, active: boolean) => safe(() => db.updateSupplier(id, { is_active: active }).then(() => refreshSups())),
  };
}

export function useDashboard() {
  const { orders, stats: orderStats, loading: oL, refresh: refreshOrders } = useOrders();
  const { data: inventory, loading: iL, refresh: refreshInv } = useQuery(() => db.getInventoryItems(), []);
  const items = inventory || [];
  const invStats = { total: items.length, available: items.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length, lowStock: items.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length, restocking: items.filter((i: any) => Number(i.current_quantity) <= 0).length, phasedOut: items.filter((i: any) => !i.is_active).length };
  const lowStockItems = items.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).map((i: any) => ({ id: i.id, name: i.name, currentQty: Number(i.current_quantity), reorderPoint: Number(i.reorder_point), unit: i.unit_of_measure }));
  const recentOrders = orders.slice(0, 5).map((o: any) => { const c = o.customer; return { id: o.id, orderId: o.order_number, customerName: c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Walk-in', product: o.order_items?.[0]?.product_name || 'Multiple', amount: Number(o.total_amount) || 0, status: o.status, date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '' }; });
  const totalRevenue = orders.reduce((s: number, o: any) => s + (Number(o.total_amount) || 0), 0);
  const totalCollected = orders.reduce((s: number, o: any) => s + (Number(o.amount_paid) || 0), 0);
  const extendedOrderStats = { ...orderStats, totalRevenue, totalCollected, unpaid: orderStats.pendingPayment };
  const refresh = useCallback(async () => { await Promise.all([refreshOrders(), refreshInv()]); }, [refreshOrders, refreshInv]);
  return { orders, orderStats: extendedOrderStats, invStats, lowStockItems, recentOrders, loading: oL || iL, refresh };
}

export function useDashboardData() {
  const { orders, orderStats, invStats, lowStockItems, recentOrders, loading, refresh } = useDashboard();
  return { data: { rawOrders: orders, orderStats, inventoryStats: invStats, lowStockItems, recentOrders }, loading, refresh };
}

function mapAdminProduct(raw: any): AdminProduct {
  const bom: BOMItem[] = (raw.product_supply_mapping || []).map((m: any) => ({ id: m.id, inventoryItemId: m.inventory_item_id, materialName: m.inventory_items?.name || '—', quantityRequired: Number(m.quantity_required), unitOfMeasure: m.inventory_items?.unit_of_measure || '', unitCost: Number(m.inventory_items?.unit_cost) || 0 }));
  return { id: raw.id, name: raw.name, category: raw.category || '', variant: raw.variant || '', sizeSpec: raw.size_spec || '', materialCost: Number(raw.material_cost) || 0, profitFee: Number(raw.profit_fee) || 0, finalPrice: Number(raw.final_price) || 0, isActive: raw.is_active ?? true, description: raw.description || '', bom };
}

export function useProductsData() {
  const q = useQuery(() => db.getProductsWithBOM(), []);
  const { data: rawMaterials } = useQuery(() => db.getInventoryItems(), []);
  const raw = q.data || [];
  const products: AdminProduct[] = raw.map(mapAdminProduct);
  const materials = (rawMaterials || []).filter((m: any) => m.is_active);
  const stats = { total: products.length, active: products.filter(p => p.isActive).length, inactive: products.filter(p => !p.isActive).length };
  return {
    products, stats, materials, loading: q.loading, error: q.error, refresh: q.refresh,
    createProduct: async (product: any, bom: { inventory_item_id: string; quantity_required: number }[]) => safe(() => db.createProductWithBOM(product, bom).then(() => q.refresh())),
    updateProduct: async (id: string, product: Record<string, any>, bom?: { inventory_item_id: string; quantity_required: number }[]) => safe(() => db.updateProductWithBOM(id, product, bom).then(() => q.refresh())),
    deleteProduct: async (id: string) => safe(() => db.deleteProduct(id).then(() => q.refresh())),
  };
}

function mapDelivery(raw: any): Delivery {
  const req = raw.requester;
  return { id: raw.id, inventoryItemId: raw.inventory_item_id, materialName: raw.inventory_item?.name || '—', materialUnit: raw.inventory_item?.purchase_unit || raw.inventory_item?.unit_of_measure || '', supplierId: raw.supplier_id, supplierName: raw.supplier?.name || '—', requestedBy: raw.requested_by, requestedByName: req ? `${req.first_name || ''} ${req.last_name || ''}`.trim() : '—', requestedQuantity: Number(raw.requested_quantity), expectedArrivalDate: raw.expected_arrival_date || '', status: raw.status as DeliveryStatus, receivedQuantity: Number(raw.received_quantity) || 0, receiptReferenceNumber: raw.receipt_reference_number || '', receivedDate: raw.received_date ? new Date(raw.received_date).toLocaleDateString() : '', notes: raw.notes || '', createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '' };
}

export function useDeliveries() {
  const q = useQuery(() => db.getDeliveries(), []);
  const { data: rawMaterials } = useQuery(() => db.getInventoryItems(), []);
  const { data: rawSuppliers } = useQuery(() => db.getSuppliers(), []);
  const raw = q.data || [];
  const deliveries: Delivery[] = raw.map(mapDelivery);
  const materials = (rawMaterials || []).filter((m: any) => m.is_active);
  const suppliers = (rawSuppliers || []).filter((s: any) => s.is_active);
  const stats = { total: deliveries.length, requested: deliveries.filter(d => d.status === 'requested').length, ordered: deliveries.filter(d => d.status === 'ordered').length, enRoute: deliveries.filter(d => d.status === 'en_route').length, received: deliveries.filter(d => d.status === 'received').length, completed: deliveries.filter(d => d.status === 'completed').length };
  return {
    deliveries, stats, materials, suppliers, loading: q.loading, error: q.error, refresh: q.refresh,
    createDelivery: async (data: { inventory_item_id: string; supplier_id?: string; requested_quantity: number; expected_arrival_date?: string; notes?: string }) => safe(() => db.createDelivery(data).then(() => q.refresh())),
    updateDelivery: async (id: string, updates: Record<string, any>) => safe(() => db.updateDelivery(id, updates).then(() => q.refresh())),
    confirmReceipt: async (id: string, receipt: { received_quantity: number; receipt_reference_number: string }) => safe(() => db.confirmDeliveryReceipt(id, receipt).then(() => q.refresh())),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASH ADVANCES
// ═══════════════════════════════════════════════════════════════════════════════
export type CashAdvanceStatus =
  | 'pending'
  | 'approved'
  | 'added_to_current_payroll'  // Issued this period — employee received ₱
  | 'scheduled_for_deduction'   // Queued for next-period deduction
  | 'deducted'                  // Fully deducted — cycle complete
  | 'declined'
  | 'cancelled';

export interface CashAdvance {
  id: string; employeeId: string; employeeCode: string; employeeName: string; employeePosition: string;
  amount: number; dateIssued: string; reason: string; status: CashAdvanceStatus;
  payrollPeriodId: string | null; issuedByName: string; createdAt: string; declineReason?: string;
}

export interface PendingCashAdvance {
  id: string; employeeId: string; employeeCode: string; employeeName: string; employeePosition: string;
  dailyRate: number; amount: number; allowedLimit: number; pendingTotal: number; remainingAllowed: number;
  reason: string; dateIssued: string; issuedByName: string;
}

function mapCashAdvance(raw: any): CashAdvance {
  const emp = raw.employee; const issuer = raw.issuer;
  return { id: raw.id, employeeId: raw.employee_id, employeeCode: emp?.employee_code || '', employeeName: emp?.full_name || '', employeePosition: emp?.position || '', amount: Number(raw.amount) || 0, dateIssued: raw.date_issued || '', reason: raw.reason || '', status: raw.status as CashAdvanceStatus, payrollPeriodId: raw.payroll_period_id || null, issuedByName: issuer ? `${issuer.first_name || ''} ${issuer.last_name || ''}`.trim() : '—', createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '', declineReason: raw.decline_reason || '' };
}

function mapPendingCashAdvance(raw: any, allPending: any[]): PendingCashAdvance {
  const emp = raw.employee; const dailyRate = Number(emp?.base_hourly_rate) || 0;
  const allowedLimit = 2000;
  const pendingTotal = allPending.filter(a => a.employee_id === raw.employee_id && a.id !== raw.id).reduce((s: number, a: any) => s + Number(a.amount), 0);
  const issuer = raw.issuer;
  return { id: raw.id, employeeId: raw.employee_id, employeeCode: emp?.employee_code || '', employeeName: emp?.full_name || '', employeePosition: emp?.position || '', dailyRate, amount: Number(raw.amount) || 0, allowedLimit, pendingTotal, remainingAllowed: Math.max(0, allowedLimit - pendingTotal), reason: raw.reason || '', dateIssued: raw.date_issued || '', issuedByName: issuer ? `${issuer.first_name || ''} ${issuer.last_name || ''}`.trim() : '—' };
}

export function useCashAdvances(filters?: { employee_id?: string; status?: string }) {
  const q = useQuery(() => db.cashAdvances.getAll(filters), [filters?.employee_id, filters?.status]);
  const advances: CashAdvance[] = (q.data || []).map(mapCashAdvance);
  const stats = { total: advances.length, pending: advances.filter(a => a.status === 'pending').length, approved: advances.filter(a => a.status === 'approved').length, deducted: advances.filter(a => a.status === 'deducted').length, cancelled: advances.filter(a => a.status === 'cancelled').length, totalPending: advances.filter(a => a.status === 'pending').reduce((s, a) => s + a.amount, 0) };
  return {
    advances, stats, loading: q.loading, error: q.error, refresh: q.refresh,
    createAdvance: async (data: { employee_id: string; amount: number; date_issued?: string; reason?: string }) => safe(() => db.cashAdvances.create(data).then(() => q.refresh())),
    cancelAdvance: async (id: string) => safe(() => db.cashAdvances.cancel(id).then(() => q.refresh())),
  };
}

export function usePendingCashAdvances() {
  const q = useQuery(() => db.cashAdvances.getPendingRequests(), []);
  const rawAll = (q.data || []) as any[];
  const pendingAdvances: PendingCashAdvance[] = rawAll.map(raw => mapPendingCashAdvance(raw, rawAll));
  return {
    pendingAdvances, loading: q.loading, error: q.error, refresh: q.refresh,
    approveAdvance: async (id: string) => safe(() => db.cashAdvances.approve(id).then(() => q.refresh())),
    declineAdvance: async (id: string, reason: string) => safe(() => db.cashAdvances.decline(id, reason).then(() => q.refresh())),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL TYPES
// ═══════════════════════════════════════════════════════════════════════════════
export interface PayrollPeriod { id: string; periodStart: string; periodEnd: string; payDate: string; status: 'draft' | 'processing' | 'complete'; createdAt: string; }
export interface AttendanceLog { id: string; employeeId: string; employeeCode: string; fullName: string; position: string; dailyRate: number; workedHours: number; requiredHours: number; lateTimeslots: number; earlyLeaveTimeslots: number; regularOvertimeHours: number; holidayOvertimeHours: number; specialOvertimeHours: number; businessTripDays: number; absences: number; onLeaveDays: number; additionalPay: number; deductionAmount: number; }
export interface PayrollRecord { id: string; employeeId: string; employeeName: string; employeeCode: string; position: string; dailyRate: number; daysPresent: number; basicPay: number; regularHolidayPay: number; specialHolidayPay: number; regularOvertime: number; holidayOvertime: number; specialOvertime: number; grossIncome: number; tardyDeductions: number; undertimeDeductions: number; sss: number; philhealth: number; hdmf: number; withholdingTax: number; cashAdvance: number; cashAdvanceIssued: number; totalDeductions: number; netPay: number; taxableIncome: number; status: 'pending' | 'paid'; }

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL MAPPERS
// ═══════════════════════════════════════════════════════════════════════════════
function mapPeriod(raw: any): PayrollPeriod { return { id: raw.id, periodStart: raw.period_start, periodEnd: raw.period_end, payDate: raw.pay_date || '', status: raw.status, createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '' }; }

function mapAttendanceLog(raw: any): AttendanceLog {
  const emp = raw.employee; const dailyRate = Number(emp?.base_hourly_rate) || 0;
  return { id: raw.id, employeeId: raw.employee_id, employeeCode: emp?.employee_code || '', fullName: emp?.full_name || '', position: emp?.position || '', dailyRate, workedHours: Number(raw.worked_hours) || 0, requiredHours: Number(raw.required_hours) || 160, lateTimeslots: Number(raw.late_timeslots) || 0, earlyLeaveTimeslots: Number(raw.early_leave_timeslots) || 0, regularOvertimeHours: Number(raw.regular_overtime_hours) || 0, holidayOvertimeHours: Number(raw.holiday_overtime_hours) || 0, specialOvertimeHours: Number(raw.special_overtime_hours) || 0, businessTripDays: Number(raw.business_trip_days) || 0, absences: Number(raw.absences) || 0, onLeaveDays: Number(raw.on_leave_days) || 0, additionalPay: Number(raw.additional_pay) || 0, deductionAmount: Number(raw.deduction_amount) || 0 };
}

function mapPayrollRecord(raw: any): PayrollRecord {
  const emp = raw.employee;
  return { id: raw.id, employeeId: raw.employee_id, employeeName: emp?.full_name || '', employeeCode: emp?.employee_code || '', position: emp?.position || '', dailyRate: Number(raw.daily_rate) || 0, daysPresent: Number(raw.days_present) || 0, basicPay: Number(raw.basic_pay) || 0, regularHolidayPay: Number(raw.regular_holiday_pay) || 0, specialHolidayPay: Number(raw.special_holiday_pay) || 0, regularOvertime: Number(raw.regular_overtime) || 0, holidayOvertime: Number(raw.holiday_overtime) || 0, specialOvertime: Number(raw.special_overtime) || 0, grossIncome: Number(raw.gross_income) || 0, tardyDeductions: Number(raw.tardy_deductions) || 0, undertimeDeductions: Number(raw.undertime_deductions) || 0, sss: Number(raw.sss) || 0, philhealth: Number(raw.philhealth) || 0, hdmf: Number(raw.hdmf) || 0, withholdingTax: Number(raw.withholding_tax) || 0, cashAdvance: Number(raw.cash_advance) || 0, cashAdvanceIssued: Number(raw.cash_advance_issued) || 0, totalDeductions: Number(raw.total_deductions) || 0, netPay: Number(raw.net_pay) || 0, taxableIncome: Number(raw.taxable_income) || 0, status: raw.status || 'pending' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL HOOK
// ═══════════════════════════════════════════════════════════════════════════════
export function usePayrollData() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [computing,  setComputing]  = useState(false);
  const [resetting,  setResetting]  = useState(false);   // ← new

  const periodsQ    = useQuery(() => db.payroll.getPeriods(), []);
  const periods: PayrollPeriod[] = (periodsQ.data || []).map(mapPeriod);
  const activePeriodId = selectedPeriodId || periods[0]?.id || null;
  const currentPeriod  = periods.find(p => p.id === activePeriodId) || null;

  const attendanceQ = useQuery(() => activePeriodId ? db.payroll.getAttendanceLogs(activePeriodId) : Promise.resolve([]), [activePeriodId]);
  const payrollQ    = useQuery(() => activePeriodId ? db.payroll.getPayrollRecords(activePeriodId)  : Promise.resolve([]), [activePeriodId]);

  const attendanceLogs: AttendanceLog[] = (attendanceQ.data || []).map(mapAttendanceLog);
  const payrollRecords: PayrollRecord[] = (payrollQ.data  || []).map(mapPayrollRecord);

  const dashboardStats = {
    totalEmployees:     attendanceLogs.length,
    grossPayroll:       payrollRecords.reduce((s, r) => s + r.grossIncome, 0),
    netPayroll:         payrollRecords.reduce((s, r) => s + r.netPay, 0),
    totalDeductions:    payrollRecords.reduce((s, r) => s + r.totalDeductions, 0),
    totalWorkHours:     Math.round(attendanceLogs.reduce((s, l) => s + l.workedHours, 0) * 100) / 100,
    totalOvertimeHours: Math.round(attendanceLogs.reduce((s, l) => s + l.regularOvertimeHours + l.holidayOvertimeHours + l.specialOvertimeHours, 0) * 100) / 100,
    totalAbsences:      attendanceLogs.reduce((s, l) => s + l.absences, 0),
  };

  const loading = periodsQ.loading || attendanceQ.loading || payrollQ.loading;
  const error   = periodsQ.error   || attendanceQ.error   || payrollQ.error;

  const refresh = useCallback(() => {
    periodsQ.refresh(); attendanceQ.refresh(); payrollQ.refresh();
  }, [activePeriodId]);

  return {
    periods, currentPeriod, activePeriodId, attendanceLogs, payrollRecords,
    dashboardStats, loading, error, computing, resetting,
    setSelectedPeriodId, refresh,

    updateAttendanceLog: async (log: any) => safe(() => db.payroll.upsertAttendanceLog(log).then(() => attendanceQ.refresh())),

    computePayroll: async (periodId: string) => {
      setComputing(true);
      const r = await safe(() => db.payroll.computePayroll(periodId).then(() => payrollQ.refresh()));
      setComputing(false);
      return r;
    },

    // ── Reset wrong-period computation ────────────────────────────────────
    resetPayroll: async (periodId: string) => {
      setResetting(true);
      const r = await safe(async () => {
        await db.payroll.resetPayroll(periodId);
        payrollQ.refresh();
        attendanceQ.refresh();
      });
      setResetting(false);
      return r;
    },

    updatePayrollRecord: async (id: string, updates: Record<string, any>) => safe(() => db.payroll.updatePayrollRecord(id, updates).then(() => payrollQ.refresh())),
    markPeriodComplete:  async (periodId: string) => safe(() => db.payroll.updatePeriod(periodId, { status: 'complete' }).then(() => periodsQ.refresh())),
    markAllPaid: async (periodId: string) => {
      const r = await safe(async () => {
        const records = await db.payroll.getPayrollRecords(periodId);
        for (const rec of records) { await db.payroll.updatePayrollRecord(rec.id, { status: 'paid' }); }
        payrollQ.refresh();
      });
      return r;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════
export function useLogsData() {
  const q = useQuery(async () => {
    const { data, error } = await supabase.from('order_logs').select(`*, updated_by_user:updated_by(id, first_name, last_name, role)`).order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data || [];
  }, []);
  const logs = (q.data || []).map((raw: any) => ({ id: raw.id, orderId: raw.order_id, updatedBy: raw.updated_by_user ? `${raw.updated_by_user.first_name || ''} ${raw.updated_by_user.last_name || ''}`.trim() : '—', role: raw.updated_by_user?.role || '—', status: raw.status || '', note: raw.note || '', createdAt: raw.created_at ? new Date(raw.created_at).toLocaleString() : '' }));
  return { logs, loading: q.loading, error: q.error, refresh: q.refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASHIER CASH ADVANCES
// ═══════════════════════════════════════════════════════════════════════════════
export interface CashAdvanceEligibility {
  eligible: boolean;
  reason: 'eligible' | 'limit_reached' | 'restricted_next_period' | 'approved_awaiting_deduction';
  remaining: number; totalUsed: number;
  detail?: { amount: number; date_issued: string; periodLabel?: string };
}

export function useCashierCashAdvances() {
  const q = useQuery(() => db.cashAdvances.getPendingCount(), []);
  return {
    pendingCount: q.data ?? 0, loading: q.loading, refresh: q.refresh,
    checkEligibility: async (employeeId: string): Promise<CashAdvanceEligibility> => {
      try { return await db.cashAdvances.checkEligibility(employeeId); }
      catch { return { eligible: false, reason: 'limit_reached', remaining: 0, totalUsed: 0 }; }
    },
    submitRequest: async (data: { employee_id: string; amount: number; reason?: string }) => safe(() => db.cashAdvances.requestByCashier(data).then(() => q.refresh())),
  };
}