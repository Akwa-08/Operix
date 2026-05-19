// frontend/src/hooks/useSupabase.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE hook file — ALL data access, mapping, and mutations.
// Components import ONLY from this file. No bridge layers.
//
// Pipeline: database.ts (raw queries) → useSupabase.ts (hooks) → Components
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useQuery as useTanStackQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { supabase } from '../config/supabaseClient';
import { db } from '../lib/database';
import { adminApi } from '../lib/adminApi';
import type {
  Order, OrderStatus, PaymentStatus, MaterialStatus, Material,
  UserRole, FrontendUser, FrontendSupplier, EmployeeRecord, CatalogProduct, CartItem,
  AdminProduct, BOMItem, Delivery, DeliveryStatus, EmployeeRole,
} from '../Types';
import { fmtDate, parseDbDate } from '../util/formatters';

function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  realtimeTables: string[] = [],
  initialData: T | null = null,
) {
  const queryClient = useQueryClient();
  // IMPROVED: If the first element of deps is a string (e.g., 'orders'), we use deps directly.
  // This allows for explicit invalidation via queryClient.invalidateQueries({ queryKey: ['orders'] }).
  const queryKey: QueryKey = (deps.length > 0 && typeof deps[0] === 'string')
    ? deps
    : ['operix-query', ...deps, fetcher.toString().slice(0, 50)];

  const { data, isLoading, error, refetch } = useTanStackQuery({
    queryKey,
    queryFn: fetcher,
    initialData: initialData ?? undefined,
  });

  useEffect(() => {
    if (!realtimeTables || realtimeTables.length === 0) return;
    // Use the first part of the key for the channel name if it's a string, otherwise fallback
    const baseKey = typeof queryKey[0] === 'string' ? queryKey[0] : 'query';
    const channelName = `realtime_${baseKey}_${realtimeTables.join('_')}_${JSON.stringify(deps).slice(0, 20)}`;
    let channel = supabase.channel(channelName);
    realtimeTables.forEach(table => {
      channel = channel.on('postgres_changes' as any, { event: '*', schema: 'public', table }, () => {
        queryClient.invalidateQueries({ queryKey });
      });
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [realtimeTables?.join('_'), JSON.stringify(deps)]);

  return {
    data: data as T | null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refresh: () => refetch()
  };
}

async function safe(fn: () => Promise<any>): Promise<{ success: boolean; error: string | null }> {
  try { await fn(); return { success: true, error: null }; }
  catch (err: any) { return { success: false, error: err.message || 'Operation failed' }; }
}

function mapStatus(s: string): OrderStatus {
  const m: Record<string, OrderStatus> = { in_queue: 'In Queue', designing: 'Designing', payment: 'Payment', production: 'Production', pickup: 'Pickup', completed: 'Completed', overdue: 'Overdue', cancelled: 'Cancelled', cancel_requested: 'Cancel Requested' };
  return m[s] || (s as OrderStatus);
}
function mapPayment(s: string): PaymentStatus {
  const m: Record<string, PaymentStatus> = { paid: 'Paid', unpaid: 'Unpaid', partial: 'Partially paid' };
  return m[s] || (s as PaymentStatus);
}

function mapOrder(raw: any): Order {
  const c = raw.customer;
  const items = raw.order_items || [];
  return {
    id: raw.id, orderId: raw.order_number || '',
    customerId: raw.customer_id || '',
    customerName: c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Walk-in',
    customerEmail: c?.email || '', customerPhone: c?.contact_number || '',
    productType: items[0]?.product_name || (items.length > 1 ? 'Multiple' : '—'),
    quantity: items.reduce((s: number, i: any) => s + (i.quantity || 0), 0),
    totalAmount: Number(raw.total_amount) || 0,
    status: mapStatus(raw.status), paymentStatus: mapPayment(raw.payment_status),
    dateOrdered: fmtDate(raw.created_at),
    dueDate: fmtDate(raw.due_date),
    specialInstructions: raw.special_instructions || items[0]?.specifications || '', designFile: raw.design_file_url || items[0]?.file_url || '',
    assignedDesigner: raw.assigned_designer || '', assignedProduction: raw.assigned_production || '',
    designerName: raw.designer ? `${raw.designer.first_name || ''} ${raw.designer.last_name || ''}`.trim() : '',
    productionName: raw.production_staff ? raw.production_staff.full_name || '' : '',
    comments: raw.comments || '', amountPaid: Number(raw.amount_paid) || 0, orderType: raw.order_type || 'walk-in',
    finalDesignUrl: raw.final_design_url || '',
    lastDeclineReason: raw.last_decline_reason || '',
    hasUnreadDecline: !!raw.has_unread_decline,
    isSuki: !!c?.is_suki,
    payments: Array.isArray(raw.payments) ? raw.payments.map((p: any) => ({
      id: p.id, amount: Number(p.amount) || 0, payment_method: p.payment_method,
      reference_number: p.reference_number, created_at: p.created_at,
      status: (p.status || "pending") as "approved" | "declined" | "pending",
      decline_reason: p.decline_reason
    })) : [],
    cancelReason: raw.cancel_reason || '',
    rejectedByDesigners: raw.rejected_by_designers || [],
  };
}

function mapUser(raw: any): FrontendUser {
  return {
    id: raw.id, firstName: raw.first_name || '', lastName: raw.last_name || '',
    email: raw.email || '',
    role: raw.role ? raw.role.charAt(0).toUpperCase() + raw.role.slice(1) : 'Customer',
    contactNumber: raw.contact_number || '', isActive: raw.is_active ?? true,
    isSuki: !!raw.is_suki,
    createdAt: fmtDate(raw.created_at),
    lastSeenAt: raw.last_seen_at,
  };
}

function mapSupplier(raw: any): FrontendSupplier {
  return {
    id: raw.id, supplierName: raw.name || '', email: raw.email || '',
    contactNumber: raw.phone || '', address: raw.address || '',
    supplierStatus: raw.is_active ? 'Active' : 'Inactive',
    isFlagged: raw.is_flagged ?? false, flagCategory: raw.flag_category || 'None', flagNotes: raw.flag_notes || '',
    createdAt: parseDbDate(raw.created_at)?.toLocaleDateString() || '',
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
    hireDate: parseDbDate(raw.hire_date)?.toLocaleDateString() || '',
    isActive: raw.is_active ?? true,
    sssContribution: Number(raw.sss_contribution) || 0,
    philhealthContribution: Number(raw.philhealth_contribution) || 0,
    hdmfContribution: Number(raw.hdmf_contribution) || 0,
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
  const pref =
    item.item_suppliers?.find((s: any) => s.is_preferred) ??
    item.item_suppliers?.[0];
  const mappedSuppliers =
    item.item_suppliers
      ?.map((s: any) => ({
        id: s.suppliers?.id,
        name: s.suppliers?.name,
        flagCategory: s.suppliers?.flag_category,
      }))
      .filter((s: any) => s.id) || [];

  return {
    id: item.id,
    itemType: item.name,
    itemVariant: item.description || "",
    usableStocks: Number(item.current_quantity),
    stockUnit: item.unit_of_measure,
    reorderPoint: Number(item.reorder_point),
    unitCost: Number(item.unit_cost),
    purchaseQty: Number(item.conversion_rate ?? 1),
    purchaseUnit: item.purchase_unit || item.unit_of_measure,
    supplier: pref?.suppliers?.name || "—",
    status: deriveMatStatus(item),
    isActive: item.is_active,
    description: item.description,
    lastSupplierCost: pref ? Number(pref.supplier_unit_price) : undefined,
    mappedSuppliers,
  };
}

export function useMyProfile() {
  const q = useQuery(async () => { return await db.getMyProfile(); }, ['my-profile'], ['users']);

  useEffect(() => {
    // Heartbeat every 2 minutes if tab is active
    const heartbeat = () => {
      if (document.visibilityState === 'visible') {
        db.updateLastSeen();
      }
    };

    const interval = setInterval(heartbeat, 120000);
    heartbeat(); // Initial

    return () => clearInterval(interval);
  }, []);
  return { profile: q.data, ...q };
}

export const clearProfileCache = () => { };

export function useUsers(filters?: { role?: string; status?: string }) {
  const q = useQuery(() => db.getUsers(filters), [filters?.role, filters?.status], ['users']);
  return { users: q.data || [], ...q };
}

export function useEmployees() {
  const q = useQuery(() => db.getEmployees(), [], ['employees']);
  return { employees: q.data || [], ...q };
}

export function useSuppliers() {
  const q = useQuery(() => db.getSuppliers(), [], ['suppliers']);
  return { suppliers: q.data || [], ...q };
}

export function useProducts(filters?: { search?: string; category?: string }) {
  const q = useQuery(() => db.getProducts(filters), [filters?.search, filters?.category], ['products']);
  return { products: q.data || [], ...q };
}

export function useOrders(filters?: { status?: string; assigned_designer?: string; assigned_production?: string }) {
  const { data: rawOrders, loading, error, refresh } = useQuery(
    () => db.getOrders(filters),
    ['orders', filters?.status, filters?.assigned_designer, filters?.assigned_production],
    ['orders', 'order_items', 'payments']
  );
  const { data: staffList } = useQuery(() => db.getStaffList(), [], ['employees', 'users']);

  const orders = rawOrders || [];
  const staff = (staffList || []).map((s: any) => ({
    id: s.id, firstName: s.first_name || '', lastName: s.last_name || '', role: s.role,
    lastSeenAt: s.last_seen_at,
  }));

  const now = new Date();
  const stats = {
    total: orders.length,
    inQueue: orders.filter((o: any) => o.status === 'in_queue').length,
    designing: orders.filter((o: any) => o.status === 'designing').length,
    payment: orders.filter((o: any) => o.status === 'payment').length,
    production: orders.filter((o: any) => o.status === 'production').length,
    pickup: orders.filter((o: any) => o.status === 'pickup').length,
    completed: orders.filter((o: any) => o.status === 'completed' && o.payment_status === 'paid').length,
    overdue: orders.filter((o: any) => o.due_date && new Date(o.due_date) < now && !['completed', 'cancelled', 'pickup'].includes(o.status)).length,
    pendingPayment: orders.filter((o: any) => o.payment_status !== 'paid' && o.status !== 'cancelled').length,
    completedUnpaid: orders.filter((o: any) => o.payment_status !== 'paid' && o.status === 'completed').length,
    readyPickup: orders.filter((o: any) => o.status === 'pickup').length,
    unassigned: orders.filter((o: any) => o.status === 'in_queue' && !o.assigned_designer).length,
  };

  return { orders, stats, staff, loading, error, refresh };
}

export function useInventoryData() {
  const q = useQuery(() => db.getInventoryItems(), [], ['inventory_items', 'item_suppliers', 'suppliers']);
  const raw = q.data || [];
  const materials: Material[] = raw.map(mapMaterial);
  const stats = {
    total: raw.length,
    available: raw.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length,
    lowStock: raw.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length,
    restocking: raw.filter((i: any) => Number(i.current_quantity) <= 0).length,
    phasedOut: raw.filter((i: any) => !i.is_active).length,
  };
  return {
    materials, stats, loading: q.loading, error: q.error, refresh: q.refresh,
    updateMaterial: async (id: string, updates: any) => {
      const r = await safe(() => db.updateInventoryItem(id, updates).then(() => q.refresh()));
      return r;
    },
    updateMaterialSuppliers: async (materialId: string, supplierIds: string[]) => {
      const r = await safe(() =>
        db.updateMaterialSuppliers(materialId, supplierIds).then(() => q.refresh()),
      );
      return r;
    },
  };
}

export function useProductCatalog(filters?: { search?: string; category?: string }) {
  const { data: raw, loading, error, refresh } = useQuery(
    () => db.getCatalogProducts(filters),
    [filters?.search, filters?.category],
    ['products', 'product_supply_mapping', 'inventory_items'],
  );
  const products: CatalogProduct[] = (raw || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    category: p.category || "",
    variant: p.variant || "",
    size: p.size_spec || "",
    price: Number(p.final_price),
    description: p.description || "",
    isActive: p.is_active ?? true,
    maxCapacity: Number(p.max_capacity ?? 0),
  }));
  return { products, loading, error, refresh };
}

export function useCartData() {
  const queryClient = useQueryClient();
  const { data: rawItems, loading, error, refresh } = useQuery(() => db.getCart(), ['cart'], ['cart_items', 'products']);
  const raw = rawItems || [];
  const items: CartItem[] = raw.map((r: any) => ({
    id: r.id, productId: r.product_id,
    productName: r.product?.name || 'Unknown', category: r.product?.category || '',
    variant: r.product?.variant || '', sizeSpec: r.product?.size_spec || '',
    price: Number(r.product?.final_price || 0), quantity: r.quantity,
    specifications: r.specifications, fileUrl: r.file_url,
  }));
  const totalItems = raw.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
  const totalPrice = raw.reduce((s: number, i: any) => s + (i.quantity || 0) * parseFloat(i.product?.final_price || '0'), 0);
  return {
    items, totalItems, totalPrice, loading, error, refresh,
    addToCart: async (productId: string, qty?: number, forceNewRow?: boolean, specs?: string, fileUrl?: string) => { const r = await safe(() => db.addToCart(productId, qty, forceNewRow, specs, fileUrl).then(() => refresh())); return r; },
    updateQuantity: async (id: string, qty: number) => { const r = await safe(() => db.updateCartItem(id, { quantity: Math.max(1, qty) }).then(() => refresh())); return r; },
    updateCartItem: async (id: string, updates: { quantity?: number; specifications?: string; fileUrl?: string }) => { const r = await safe(() => db.updateCartItem(id, updates).then(() => refresh())); return r; },
    removeItem: async (id: string) => { const r = await safe(() => db.removeCartItem(id).then(() => refresh())); return r; },
    clearCart: async () => { const r = await safe(() => db.clearCart().then(() => refresh())); return r; },
    checkout: async (notes?: string, due?: string, ids?: string[]) => {
      try {
        const o = await db.checkout(notes, due, ids);
        // Explicitly invalidate orders so they reflect "live" on navigation
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        await refresh();
        return { success: true, error: null, order: o };
      } catch (e: any) {
        return { success: false, error: e.message, order: null };
      }
    },
    directOrder: async (data: { productId: string; productName: string; quantity: number; unitPrice: number; specifications?: string; fileUrl?: string }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await db.createOrder({ customer_id: user.id, order_type: 'online', special_instructions: data.specifications, items: [{ product_id: data.productId, product_name: data.productName, quantity: data.quantity, unit_price: data.unitPrice, specifications: data.specifications, file_url: data.fileUrl }] });
        // Explicitly invalidate orders
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        return { success: true, error: null };
      } catch (e: any) { return { success: false, error: e.message || 'Failed to place order' }; }
    },
  };
}

export function useOrdersData(filters?: { status?: string; assigned_designer?: string; assigned_production?: string }) {
  const queryClient = useQueryClient();
  const { orders: rawOrders, stats, staff, loading: ordersLoading, error, refresh: ordersRefresh } = useOrders(filters);
  const { employees, loading: empLoading, refresh: empRefresh } = useEmployees();

  const loading = ordersLoading || empLoading;
  const refresh = async () => { await Promise.all([ordersRefresh(), empRefresh()]); };

  const orders: Order[] = rawOrders.map(mapOrder);
  const staffList = staff;
  const designers = staff.filter((s: any) => s.role === 'designer').map((s: any) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`.trim(),
    lastSeenAt: s.lastSeenAt
  }));

  const productionStaff = employees
    .filter((e: any) => e.role?.toLowerCase() === 'production' || e.position?.toLowerCase().includes('production'))
    .map((e: any) => ({ id: e.id, name: e.full_name }));

  // Auto-dispatch algorithm
  useEffect(() => {
    if (loading || !orders.length || !designers.length) return;

    const unassigned = orders.filter(o => o.status === "In Queue" && !o.assignedDesigner);
    if (unassigned.length === 0) return;

    const dispatchNext = async () => {
      const now = new Date();
      for (const order of unassigned) {
        const loads = designers.map(d => {
          const loadCount = orders.filter(o => o.assignedDesigner === d.id && (o.status === "In Queue" || o.status === "Designing")).length;
          const hasRejected = order.rejectedByDesigners?.includes(d.id);

          // Consider "online" if seen in the last 15 minutes
          const lastSeenAt = d.lastSeenAt;
          let isOnline = false;
          if (lastSeenAt) {
            const lastSeenDate = new Date(lastSeenAt);
            const diffMs = now.getTime() - lastSeenDate.getTime();
            isOnline = diffMs < 900000; // 15 mins
          }

          return { id: d.id, load: loadCount, hasRejected, isOnline };
        });

        // Filter for candidates who are ONLINE and haven't rejected
        const candidates = loads
          .filter(c => c.isOnline && !c.hasRejected)
          .sort((a, b) => a.load - b.load);

        if (candidates.length > 0) {
          await db.assignDesignerForAcceptance(order.id, candidates[0].id);
        } else {
          // If no online candidates who haven't rejected this order are available, notify the admin
          try {
            const { data: existingNotif } = await supabase
              .from('notifications')
              .select('id')
              .eq('related_id', order.id)
              .eq('title', 'No Online Designers Available')
              .limit(1);

            if (!existingNotif || existingNotif.length === 0) {
              await db.notifyRoles(
                ['admin'],
                'No Online Designers Available',
                `Order ${order.orderId} has been tagged as Unassigned because there are no more online designers available to accept it.`,
                'orders',
                order.id
              );
            }
          } catch (notifErr) {
            console.error("Failed to check or send unassigned admin notification:", notifErr);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      refresh();
    };

    dispatchNext();
  }, [orders, designers, loading, queryClient, refresh]);

  // Suki auto-bypass for payment status
  useEffect(() => {
    if (loading || !orders.length) return;

    const sukiInPayment = orders.filter(o => o.status === "Payment" && o.isSuki);
    if (sukiInPayment.length === 0) return;

    const bypassPayment = async () => {
      for (const order of sukiInPayment) {
        console.log(`Automatically bypassing payment for Suki order: ${order.orderId}`);
        try {
          await db.updateOrder(order.id, { status: "production" });
          if (order.customerId) {
            try {
              await db.chat.sendMessage(
                order.customerId,
                "Your order has automatically bypassed the payment confirmation phase because you are tagged as a SUKI customer, and it is now in the Production phase.",
                order.id
              );
            } catch (msgErr) {
              console.warn("Auto-bypass chat notification failed:", msgErr);
            }
          }
        } catch (err) {
          console.error(`Failed to auto-bypass payment for order ${order.orderId}:`, err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      refresh();
    };

    bypassPayment();
  }, [orders, loading, queryClient, refresh]);

  return {
    orders, stats, staffList, designers, productionStaff, loading, error, refresh,
    createOrder: async (data: { customer_id?: string | null; guest_name?: string | null; guest_phone?: string | null; guest_email?: string | null; order_type: string; items: { product_id?: string; product_name: string; quantity: number; unit_price: number; specifications?: string; file_url?: string }[]; special_instructions?: string; due_date?: string; assigned_designer?: string | null; assigned_production?: string | null; comments?: string | null }) => {
      const r = await safe(() => db.createOrder({ ...data, assigned_designer: data.assigned_designer || undefined, assigned_production: data.assigned_production || undefined, comments: data.comments || undefined, customer_id: data.customer_id || undefined, guest_name: data.guest_name || undefined, guest_phone: data.guest_phone || undefined, guest_email: data.guest_email || undefined }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    updateStatus: async (orderId: string, status: string, excessUsage?: Record<string, number>) => {
      const dbStatus = status.toLowerCase().replace(/ /g, '_');
      const r = await safe(async () => {
        await db.updateOrder(orderId, { status: dbStatus });
        if (dbStatus === 'pickup') {
          try { await db.deductInventoryForOrder(orderId, excessUsage); } catch (invErr) { console.error("Inventory deduction failed:", invErr); }
        }
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        await refresh();
      });
      return r;
    },
    getOrderBOM: async (orderId: string) => { return await db.getOrderBOM(orderId); },
    assignStaff: async (orderId: string, assignment: { assigned_designer?: string; assigned_production?: string }) => {
      const r = await safe(async () => {
        const hasDesigner = !!assignment.assigned_designer;
        const hasProduction = !!assignment.assigned_production;
        if (hasDesigner && !hasProduction) {
          await db.assignDesignerForAcceptance(orderId, assignment.assigned_designer!);
        } else {
          await db.updateOrder(orderId, assignment);
        }
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        await refresh();
      });
      return r;
    },
    deleteOrder: async (orderId: string) => {
      const r = await safe(() => db.deleteOrder(orderId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    recordPayment: async (orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) => {
      const r = await safe(() => db.recordPayment(orderId, payment).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    approvePayment: async (paymentId: string, orderId: string) => {
      const r = await safe(() => db.approvePayment(paymentId, orderId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    declinePayment: async (paymentId: string, orderId: string, reason: string) => {
      const r = await safe(() => db.declinePayment(paymentId, orderId, reason).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    markDeclineAsRead: async (orderId: string) => {
      const r = await safe(() => db.markDeclineAsRead(orderId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    selfAssign: async (orderId: string) => {
      const r = await safe(async () => {
        await db.designerSelfPickOrder(orderId);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        await refresh();
      });
      return r;
    },
    updateCustomerDesign: async (orderId: string, url: string) => {
      const r = await safe(() => db.updateCustomerDesign(orderId, url).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    updateFinalDesign: async (orderId: string, url: string) => {
      const r = await safe(() => db.submitFinalDesign(orderId, url).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    acceptAssignedDesignOrder: async (orderId: string) => {
      const r = await safe(() => db.designerAcceptAssignedOrder(orderId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    rejectAssignedDesignOrder: async (orderId: string) => {
      const r = await safe(() => db.designerRejectAssignedOrder(orderId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    approveOrderDesign: async (orderId: string) => {
      const r = await safe(() => db.approveOrderDesign(orderId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    updateDesignerOrderDetails: async (orderId: string, updates: { totalAmount?: number; dueDate?: string }) => {
      const payload: { total_amount?: number; due_date?: string } = {};
      if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      const r = await safe(() => db.updateDesignerOrderDetails(orderId, payload).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    requestCancellation: async (orderId: string, reason: string) => {
      const r = await safe(() => db.requestCancellation(orderId, reason).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
    handleCancellationRequest: async (orderId: string, approve: boolean, designerNote?: string) => {
      const r = await safe(() => db.handleCancellationRequest(orderId, approve, designerNote).then(() => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        refresh();
      }));
      return r;
    },
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
    createUser: async (data: { firstName: string; lastName: string; email: string; password: string; role: string; phoneNumber?: string }) => { const r = await safe(() => adminApi.createUser({ email: data.email, password: data.password, role: data.role.toLowerCase(), first_name: data.firstName, last_name: data.lastName, contact_number: data.phoneNumber }).then(() => refreshUsers())); return r; },
    updateUser: async (id: string, data: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; role?: string }) => { const r = await safe(() => adminApi.updateUser(id, { first_name: data.firstName, last_name: data.lastName, email: data.email, contact_number: data.phoneNumber, role: data.role?.toLowerCase() }).then(() => refreshUsers())); return r; },
    deactivateUsers: async (ids: string[]) => { const r = await safe(() => adminApi.deactivateUsers(ids).then(() => refreshUsers())); return r; },
    createEmployee: async (data: { employeeCode?: string; fullName: string; position: string; role?: EmployeeRole; baseHourlyRate?: number; hireDate?: string }) => { const r = await safe(() => db.createEmployee({ employee_code: data.employeeCode, full_name: data.fullName, position: data.position, role: data.role, base_hourly_rate: data.baseHourlyRate, hire_date: data.hireDate }).then(() => refreshEmps())); return r; },
    updateEmployee: async (id: string, data: { fullName?: string; position?: string; role?: string; baseHourlyRate?: number; holidayMultiplier?: number; overtimeMultiplier?: number }) => {
      const updates: Record<string, any> = {};
      if (data.role !== undefined) updates.role = data.role;
      if (data.fullName !== undefined) updates.full_name = data.fullName;
      if (data.position !== undefined) updates.position = data.position;
      if (data.baseHourlyRate !== undefined) updates.base_hourly_rate = data.baseHourlyRate;
      if (data.holidayMultiplier !== undefined) updates.holiday_rate_multiplier = data.holidayMultiplier;
      if (data.overtimeMultiplier !== undefined) updates.overtime_rate_multiplier = data.overtimeMultiplier;
      const r = await safe(() => db.updateEmployee(id, updates).then(() => refreshEmps()));
      return r;
    },
    deactivateEmployee: async (id: string) => { const r = await safe(() => db.updateEmployee(id, { is_active: false }).then(() => refreshEmps())); return r; },
    createSupplier: async (data: { name: string; phone?: string; email?: string; address?: string }) => {
      const r = await safe(() => db.createSupplier({ name: data.name, phone: data.phone, email: data.email, address: data.address }).then(() => refreshSups()));
      return r;
    },
    updateSupplier: async (id: string, updates: Record<string, any>) => { const r = await safe(() => db.updateSupplier(id, updates).then(() => refreshSups())); return r; },
    flagSupplier: async (id: string, flagged: boolean, category: string, notes?: string) => { const r = await safe(() => db.updateSupplier(id, { is_flagged: flagged, flag_category: category, flag_notes: notes || '' }).then(() => refreshSups())); return r; },
    toggleSupplierActive: async (id: string, active: boolean) => { const r = await safe(() => db.updateSupplier(id, { is_active: active }).then(() => refreshSups())); return r; },
    getSupplierMaterials: async (supplierId: string) => {
      return await db.getSupplierMaterials(supplierId);
    },
    updateSupplierMaterials: async (supplierId: string, inventoryItemIds: string[]) => {
      const r = await safe(() =>
        db.updateSupplierMaterials(supplierId, inventoryItemIds).then(() => refreshSups()),
      );
      return r;
    },
    toggleSuki: async (id: string, isSuki: boolean) => { const r = await safe(() => adminApi.toggleSuki(id, isSuki).then(() => refreshUsers())); return r; },
  };
}

export function useDashboard() {
  const { orders, stats: orderStats, loading: oL, refresh: refreshOrders } = useOrders();
  const { data: inventory, loading: iL, refresh: refreshInv } = useQuery(() => db.getInventoryItems(), [], ['inventory_items', 'item_suppliers', 'suppliers']);
  const items = inventory || [];
  const invStats = {
    total: items.length,
    available: items.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length,
    lowStock: items.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length,
    restocking: items.filter((i: any) => Number(i.current_quantity) <= 0).length,
    phasedOut: items.filter((i: any) => !i.is_active).length,
  };
  const lowStockItems = items.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).map((i: any) => ({ id: i.id, name: i.name, currentQty: Number(i.current_quantity), reorderPoint: Number(i.reorder_point), unit: i.unit_of_measure }));
  const recentOrders = orders.slice(0, 5).map((o: any) => { const c = o.customer; return { id: o.id, orderId: o.order_number, customerName: c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Walk-in', product: o.order_items?.[0]?.product_name || 'Multiple', amount: Number(o.total_amount) || 0, status: o.status, date: fmtDate(o.created_at) }; });
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
  const bom: BOMItem[] = (raw.product_supply_mapping || []).map((m: any) => ({ id: m.id, inventoryItemId: m.inventory_item_id, materialName: m.inventory_items?.name || '—', quantityRequired: Number(m.quantity_required), unitOfMeasure: m.inventory_items?.unit_of_measure || '', unitCost: Number(m.inventory_items?.unit_cost) || 0, conversionRate: Number(m.inventory_items?.conversion_rate) || 1 }));
  return { id: raw.id, name: raw.name, category: raw.category || '', variant: raw.variant || '', sizeSpec: raw.size_spec || '', materialCost: Number(raw.material_cost) || 0, profitFee: Number(raw.profit_fee) || 0, finalPrice: Number(raw.final_price) || 0, isActive: raw.is_active ?? true, description: raw.description || '', bom };
}

export function useProductsData(filters?: { search?: string; category?: string }) {
  const q = useQuery(() => db.getProductsWithBOM(filters), [filters?.search, filters?.category], ['products', 'product_supply_mapping', 'inventory_items']);
  const { data: rawMaterials } = useQuery(() => db.getInventoryItems(), [], ['inventory_items', 'item_suppliers', 'suppliers']);
  const raw = q.data || [];
  const products: AdminProduct[] = raw.map(mapAdminProduct);
  const materials: Material[] = (rawMaterials || []).filter((m: any) => m.is_active).map(mapMaterial);
  const stats = { total: products.length, active: products.filter(p => p.isActive).length, inactive: products.filter(p => !p.isActive).length };
  return {
    products, stats, materials, loading: q.loading, error: q.error, refresh: q.refresh,
    createProduct: async (product: { name: string; category?: string; variant?: string; size_spec?: string; material_cost: number; profit_fee: number; final_price: number; description?: string }, bom: { inventory_item_id: string; quantity_required: number }[]) => { const r = await safe(() => db.createProductWithBOM(product, bom).then(() => q.refresh())); return r; },
    updateProduct: async (id: string, product: Record<string, any>, bom?: { inventory_item_id: string; quantity_required: number }[]) => { const r = await safe(() => db.updateProductWithBOM(id, product, bom).then(() => q.refresh())); return r; },
    deleteProduct: async (id: string) => { const r = await safe(() => db.deleteProduct(id).then(() => q.refresh())); return r; },
  };
}

function mapDelivery(raw: any): Delivery {
  const req = raw.requester;
  return { id: raw.id, inventoryItemId: raw.inventory_item_id, materialName: raw.inventory_item?.name || '—', materialUnit: raw.inventory_item?.purchase_unit || raw.inventory_item?.unit_of_measure || '', supplierId: raw.supplier_id, supplierName: raw.supplier?.name || '—', requestedBy: raw.requested_by, requestedByName: req ? `${req.first_name || ''} ${req.last_name || ''}`.trim() : '—', requestedQuantity: Number(raw.requested_quantity), expectedArrivalDate: raw.expected_arrival_date || '', status: raw.status as DeliveryStatus, receivedQuantity: Number(raw.received_quantity) || 0, receiptReferenceNumber: raw.receipt_reference_number || '', receivedDate: fmtDate(raw.received_date), notes: raw.notes || '', createdAt: fmtDate(raw.created_at) };
}

export function useDeliveries() {
  const q = useQuery(() => db.getDeliveries(), [], ['deliveries', 'inventory_items', 'suppliers']);
  const { data: rawMaterials } = useQuery(() => db.getInventoryItems(), [], ['inventory_items']);
  const { data: rawSuppliers } = useQuery(() => db.getSuppliers(), [], ['suppliers']);
  const { data: staffList } = useQuery(() => db.getStaffList(), [], ['users']);
  const { data: rawEmployees } = useQuery(() => db.getEmployees(), [], ['employees']);

  const raw = q.data || [];
  const deliveries: Delivery[] = raw.map(mapDelivery);
  const materials = (rawMaterials || []).filter((m: any) => m.is_active);
  const suppliers = (rawSuppliers || []).filter((s: any) => s.is_active);

  const staff = (staffList || []).map((s: any) => ({
    id: s.id, firstName: s.first_name || '', lastName: s.last_name || '', role: s.role,
  }));

  const employees = (rawEmployees || []).map((e: any) => ({
    id: e.id,
    fullName: e.full_name,
    role: e.role,
    position: e.position
  }));

  const stats = {
    total: deliveries.length,
    requested: deliveries.filter(d => d.status === 'requested').length,
    ordered: deliveries.filter(d => d.status === 'ordered').length,
    enRoute: deliveries.filter(d => d.status === 'en_route').length,
    received: deliveries.filter(d => d.status === 'received').length,
    completed: deliveries.filter(d => d.status === 'completed').length,
    returned: deliveries.filter(d => d.status === 'returned').length,
    cancelled: deliveries.filter(d => d.status === 'cancelled').length
  };

  return {
    deliveries, stats, materials, suppliers, staff, employees, loading: q.loading, error: q.error, refresh: q.refresh,
    createDelivery: async (data: { inventory_item_id: string; supplier_id?: string; requested_quantity: number; expected_arrival_date?: string; notes?: string; requested_by?: string }) => { const r = await safe(() => db.createDelivery(data).then(() => q.refresh())); return r; },
    updateDelivery: async (id: string, updates: Record<string, any>) => { const r = await safe(() => db.updateDelivery(id, updates).then(() => q.refresh())); return r; },
    confirmReceipt: async (id: string, receipt: { received_quantity: number; receipt_reference_number: string }) => { const r = await safe(() => db.confirmDeliveryReceipt(id, receipt).then(() => q.refresh())); return r; },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASH ADVANCES
// ═══════════════════════════════════════════════════════════════════════════════

export type CashAdvanceStatus =
  | 'pending' | 'approved' | 'deducted' | 'declined' | 'cancelled';

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
  const q = useQuery(() => db.cashAdvances.getAll(filters), [filters?.employee_id, filters?.status], ['cash_advances', 'employees']);
  const advances: CashAdvance[] = (q.data || []).map(mapCashAdvance);
  const stats = { total: advances.length, pending: advances.filter(a => a.status === 'pending').length, approved: advances.filter(a => a.status === 'approved').length, deducted: advances.filter(a => a.status === 'deducted').length, cancelled: advances.filter(a => a.status === 'cancelled').length, totalPending: advances.filter(a => a.status === 'pending').reduce((s, a) => s + a.amount, 0) };
  return {
    advances, stats, loading: q.loading, error: q.error, refresh: q.refresh,
    createAdvance: async (data: { employee_id: string; amount: number; date_issued?: string; reason?: string }) => { const r = await safe(() => db.cashAdvances.create(data).then(() => q.refresh())); return r; },
    cancelAdvance: async (id: string) => { const r = await safe(() => db.cashAdvances.cancel(id).then(() => q.refresh())); return r; },
  };
}

export function usePendingCashAdvances() {
  const q = useQuery(() => db.cashAdvances.getPendingRequests(), [], ['cash_advances', 'employees']);
  const rawAll = (q.data || []) as any[];
  const pendingAdvances: PendingCashAdvance[] = rawAll.map(raw => mapPendingCashAdvance(raw, rawAll));
  return {
    pendingAdvances, loading: q.loading, error: q.error, refresh: q.refresh,
    approveAdvance: async (id: string) => { const r = await safe(() => db.cashAdvances.approve(id).then(() => q.refresh())); return r; },
    declineAdvance: async (id: string, reason: string) => { const r = await safe(() => db.cashAdvances.decline(id, reason).then(() => q.refresh())); return r; },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PayrollPeriod {
  id: string; periodStart: string; periodEnd: string; payDate: string;
  status: 'draft' | 'processing' | 'complete'; createdAt: string;
}

export interface AttendanceLog {
  id: string; employeeId: string; employeeCode: string; fullName: string;
  position: string; dailyRate: number; workedHours: number; requiredHours: number;
  lateTimeslots: number; earlyLeaveTimeslots: number; regularOvertimeHours: number;
  holidayOvertimeHours: number; specialOvertimeHours: number; businessTripDays: number;
  absences: number; onLeaveDays: number; additionalPay: number; deductionAmount: number;
  daysPresent: number;
  hasIncompletePunch: boolean;
  incompletePunchDates: string[];
}

export interface PayrollRecord {
  id: string; employeeId: string; employeeName: string; employeeCode: string;
  position: string; dailyRate: number; daysPresent: number; basicPay: number;
  regularHolidayPay: number; specialHolidayPay: number; regularOvertime: number;
  holidayOvertime: number; specialOvertime: number; grossIncome: number;
  tardyDeductions: number; undertimeDeductions: number; sss: number; philhealth: number;
  hdmf: number; withholdingTax: number; cashAdvance: number; cashAdvanceIssued: number;
  carryOverFromPrevious: number;
  totalDeductions: number; netPay: number; taxableIncome: number; status: 'pending' | 'paid';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL MAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

function mapPeriod(raw: any): PayrollPeriod {
  return {
    id: raw.id, periodStart: raw.period_start, periodEnd: raw.period_end,
    payDate: raw.pay_date || '', status: raw.status,
    createdAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString() : '',
  };
}

function mapAttendanceLog(raw: any): AttendanceLog {
  const emp = raw.employee;
  const dailyRate = Number(emp?.base_hourly_rate) || 0;
  return {
    id: raw.id, employeeId: raw.employee_id, employeeCode: emp?.employee_code || '',
    fullName: emp?.full_name || '', position: emp?.position || '', dailyRate,
    workedHours: Number(raw.worked_hours) || 0, requiredHours: Number(raw.required_hours) || 160,
    lateTimeslots: Number(raw.late_timeslots) || 0, earlyLeaveTimeslots: Number(raw.early_leave_timeslots) || 0,
    regularOvertimeHours: Number(raw.regular_overtime_hours) || 0,
    holidayOvertimeHours: Number(raw.holiday_overtime_hours) || 0,
    specialOvertimeHours: Number(raw.special_overtime_hours) || 0,
    businessTripDays: Number(raw.business_trip_days) || 0, absences: Number(raw.absences) || 0,
    onLeaveDays: Number(raw.on_leave_days) || 0, additionalPay: Number(raw.additional_pay) || 0,
    deductionAmount: Number(raw.deduction_amount) || 0, daysPresent: Number(raw.days_present) || 0,
    hasIncompletePunch: raw.has_incomplete_punch ?? false,
    incompletePunchDates: raw.incomplete_punch_dates ?? [],
  };
}

function mapPayrollRecord(raw: any): PayrollRecord {
  const emp = raw.employee;
  const dailyRate = Number(raw.daily_rate) || Number(emp?.base_hourly_rate) || 0;
  const daysPresent = Number(raw.days_present) || 0;
  const basicPay = Number(raw.basic_pay) || (dailyRate * daysPresent);
  
  const regularOT = Number(raw.regular_overtime) || 0;
  const holidayOT = Number(raw.holiday_overtime) || 0;
  const specialOT = Number(raw.special_overtime) || 0;
  const tardyDeductions = Number(raw.tardy_deductions) || 0;
  const undertimeDeductions = Number(raw.undertime_deductions) || 0;
  
  const grossIncome = Number(raw.gross_income) || (basicPay + regularOT + holidayOT + specialOT - tardyDeductions - undertimeDeductions);
  const totalDeductions = Number(raw.total_deductions) || 0;
  const netPay = Number(raw.net_pay) || (grossIncome - totalDeductions);

  return {
    id: raw.id, employeeId: raw.employee_id, employeeName: emp?.full_name || '',
    employeeCode: emp?.employee_code || '', position: emp?.position || '',
    dailyRate, daysPresent,
    basicPay, regularHolidayPay: Number(raw.regular_holiday_pay) || 0,
    specialHolidayPay: Number(raw.special_holiday_pay) || 0, regularOvertime: regularOT,
    holidayOvertime: holidayOT, specialOvertime: specialOT,
    grossIncome, tardyDeductions,
    undertimeDeductions, sss: Number(raw.sss) || 0,
    philhealth: Number(raw.philhealth) || 0, hdmf: Number(raw.hdmf) || 0,
    withholdingTax: Number(raw.withholding_tax) || 0, cashAdvance: Number(raw.cash_advance) || 0,
    cashAdvanceIssued: Number(raw.cash_advance_issued) || 0,
    carryOverFromPrevious: Number(raw.carry_over_from_previous) || 0,
    totalDeductions,
    netPay, taxableIncome: Number(raw.taxable_income) || 0,
    status: raw.status || 'pending',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL HOOK — with localStorage period persistence
// ═══════════════════════════════════════════════════════════════════════════════
export function usePayrollData() {
  // ✅ FIX: lazy init reads localStorage — zero new hooks added, same order as before
  const [selectedPeriodId, setSelectedPeriodIdRaw] = useState<string | null>(
    () => localStorage.getItem('operix_last_period')
  );
  const [computing, setComputing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const periodsQ = useQuery(() => db.payroll.getPeriods(), [], ['payroll_periods']);
  const periods: PayrollPeriod[] = (periodsQ.data || []).map(mapPeriod);

  // If saved period was deleted, fall back to most recent — no useEffect needed
  const savedIsValid = selectedPeriodId ? !!periods.find(p => p.id === selectedPeriodId) : false;
  const activePeriodId = (savedIsValid ? selectedPeriodId : null) || periods[0]?.id || null;
  const currentPeriod = periods.find(p => p.id === activePeriodId) || null;

  // Plain function (not useCallback) — adds zero new hooks
  const setSelectedPeriodId = (id: string | null) => {
    if (id) localStorage.setItem('operix_last_period', id);
    else localStorage.removeItem('operix_last_period');
    setSelectedPeriodIdRaw(id);
  };

  const attendanceQ = useQuery(
    () => activePeriodId ? db.payroll.getAttendanceLogs(activePeriodId) : Promise.resolve([]),
    ['attendance', activePeriodId],
    ['attendance_logs', 'employees']
  );
  const payrollQ = useQuery(
    () => activePeriodId ? db.payroll.getPayrollRecords(activePeriodId) : Promise.resolve([]),
    ['payroll', activePeriodId],
    ['payroll_records', 'employees']
  );

  const attendanceLogs: AttendanceLog[] = (attendanceQ.data || []).map(mapAttendanceLog);
  const payrollRecords: PayrollRecord[] = (payrollQ.data || []).map(mapPayrollRecord);

  const dashboardStats = {
    totalEmployees: attendanceLogs.length,
    grossPayroll: payrollRecords.reduce((s, r) => s + r.grossIncome, 0),
    netPayroll: payrollRecords.reduce((s, r) => s + r.netPay, 0),
    totalDeductions: payrollRecords.reduce((s, r) => s + r.totalDeductions, 0),
    totalWorkHours: Math.round(attendanceLogs.reduce((s, l) => s + l.workedHours, 0) * 100) / 100,
    totalOvertimeHours: Math.round(attendanceLogs.reduce((s, l) => s + l.regularOvertimeHours + l.holidayOvertimeHours + l.specialOvertimeHours, 0) * 100) / 100,
    totalAbsences: attendanceLogs.reduce((s, l) => s + l.absences, 0),
  };

  const loading = periodsQ.loading || attendanceQ.loading || payrollQ.loading;
  const error = periodsQ.error || attendanceQ.error || payrollQ.error;

  const refresh = useCallback(() => {
    periodsQ.refresh(); attendanceQ.refresh(); payrollQ.refresh();
  }, [activePeriodId]);

  return {
    periods, currentPeriod, activePeriodId, attendanceLogs, payrollRecords,
    dashboardStats, loading, error, computing, resetting,
    setSelectedPeriodId, refresh,

    createPeriod: async (data: { period_start: string; period_end: string; pay_date?: string }) => {
      const r = await safe(() => db.payroll.createPeriod(data).then(() => periodsQ.refresh()));
      return r;
    },

    updateAttendanceLog: async (log: {
      employee_id: string; payroll_period_id: string; worked_hours?: number;
      required_hours?: number; late_timeslots?: number; early_leave_timeslots?: number;
      regular_overtime_hours?: number; holiday_overtime_hours?: number;
      special_overtime_hours?: number; business_trip_days?: number;
      absences?: number; on_leave_days?: number; additional_pay?: number; deduction_amount?: number;
    }) => {
      const r = await safe(() => db.payroll.upsertAttendanceLog(log).then(() => attendanceQ.refresh()));
      return r;
    },

    computePayroll: async (periodId: string) => {
      setComputing(true);
      const r = await safe(async () => {
        // Restore old behavior: flag incomplete punches on first compute
        const { count } = await supabase
          .from('payroll_records')
          .select('id', { count: 'exact', head: true })
          .eq('payroll_period_id', periodId);
        if (!count || count === 0) {
          await supabase.rpc('fix_incomplete_punches_for_period', { p_period_id: periodId });
          await attendanceQ.refresh();
        }
        await db.payroll.computePayroll(periodId);
        await attendanceQ.refresh(); // Keep UI in sync on all computes
        await payrollQ.refresh();
      });
      setComputing(false);
      return r;
    },

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

    deletePeriod: async (periodId: string) => {
      const r = await safe(async () => {
        await db.payroll.deletePeriod(periodId);
        // ✅ FIX: Clear localStorage when deleting the active period
        if (selectedPeriodId === periodId) {
          setSelectedPeriodId(null);
        }
        periodsQ.refresh();
        attendanceQ.refresh();
        payrollQ.refresh();
      });
      return r;
    },

    updatePayrollRecord: async (id: string, updates: Record<string, any>) => {
      const r = await safe(() => db.payroll.updatePayrollRecord(id, updates).then(() => payrollQ.refresh()));
      return r;
    },

    markPeriodComplete: async (periodId: string) => {
      const r = await safe(() => db.payroll.updatePeriod(periodId, { status: 'complete' }).then(() => periodsQ.refresh()));
      return r;
    },

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
// ── Human-readable formatting helpers for logs ──────────────────────────────

/** Format a timestamp into a business-friendly date string */
function fmtLogDate(ts: string | null | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return '—'; }
}

/** Format a user + role into "John Doe (Admin)" style */
function fmtLogUser(user: any, fallback = 'System'): string {
  if (!user) return fallback;
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (!name) return fallback;
  const role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
  return role ? `${name} (${role})` : name;
}

/** Convert snake_case field names to Title Case labels */
function humanizeField(field: string): string {
  const map: Record<string, string> = {
    first_name: 'First Name', last_name: 'Last Name', contact_number: 'Phone',
    is_active: 'Active Status', is_suki: 'Suki Status', full_name: 'Full Name',
    base_hourly_rate: 'Hourly Rate', hire_date: 'Hire Date',
    unit_of_measure: 'Unit', current_quantity: 'Stock Quantity',
    reorder_point: 'Reorder Point', unit_cost: 'Unit Cost',
    purchase_unit: 'Purchase Unit', conversion_rate: 'Conversion Rate',
    material_cost: 'Material Cost', profit_fee: 'Profit Fee',
    final_price: 'Final Price', size_spec: 'Size/Spec',
    total_amount: 'Total Amount', amount_paid: 'Amount Paid',
    payment_status: 'Payment Status', order_type: 'Order Type',
    special_instructions: 'Instructions', due_date: 'Due Date',
    assigned_designer: 'Designer', assigned_production: 'Production Staff',
    is_flagged: 'Flagged', flag_category: 'Flag Category', flag_notes: 'Flag Notes',
    philhealth_contribution: 'PhilHealth', hdmf_contribution: 'HDMF/Pag-IBIG',
    holiday_rate_multiplier: 'Holiday Rate', overtime_rate_multiplier: 'OT Rate',
  };
  return map[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Map raw order status to readable label */
function humanizeStatus(status: string): string {
  const map: Record<string, string> = {
    in_queue: 'In Queue', designing: 'Designing', payment: 'Awaiting Payment',
    production: 'In Production', pickup: 'Ready for Pickup', completed: 'Completed',
    cancelled: 'Cancelled', cancel_requested: 'Cancellation Requested',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Format a peso amount for log display */
function fmtLogPeso(v: number | undefined | null): string {
  const val = Number(v) || 0;
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function useLogsData() {
  const q = useQuery(async () => {
    const [ordersRes, invRes, auditRes] = await Promise.all([
      supabase.from('order_logs').select(`*, updated_by_user:updated_by(id, first_name, last_name, role)`).order('created_at', { ascending: false }).limit(200),
      supabase.from('inventory_changes').select(`*, changed_by_user:changed_by(id, first_name, last_name, role), item:inventory_item_id(name)`).order('created_at', { ascending: false }).limit(200),
      supabase.from('audit_logs').select(`*, actor_user:actor_id(id, first_name, last_name, role)`).order('created_at', { ascending: false }).limit(200)
    ]);
    return { orders: ordersRes.data || [], inventory: invRes.data || [], audit: auditRes.data || [] };
  }, [], ['order_logs', 'inventory_changes', 'audit_logs']);

  const logs = useMemo(() => {
    if (!q.data) return [];
    const combined: any[] = [];

    // ── Order Logs ────────────────────────────────────────────────────────
    q.data.orders.forEach((raw: any) => {
      const statusLabel = raw.status ? humanizeStatus(raw.status) : '';
      const action = statusLabel ? `Order moved to "${statusLabel}"` : 'Order Updated';
      const note = raw.note ? ` — ${raw.note}` : '';
      const details = `Order #${raw.order_id?.slice(0, 8) || 'Unknown'}${note}`;

      combined.push({
        id: raw.id,
        module: 'orders',
        action,
        details,
        user: fmtLogUser(raw.updated_by_user, 'Customer / System'),
        role: raw.updated_by_user?.role || 'customer',
        createdAt: fmtLogDate(raw.created_at),
        timestamp: raw.created_at ? new Date(raw.created_at).getTime() : 0,
      });
    });

    // ── Inventory Changes ─────────────────────────────────────────────────
    q.data.inventory.forEach((raw: any) => {
      const itemName = raw.item?.name || 'Unknown item';
      const qtyChange = Number(raw.quantity_change) || 0;
      const direction = qtyChange >= 0 ? 'increased' : 'reduced';
      const absQty = Math.abs(qtyChange);
      const reason = raw.reason
        ? raw.reason.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Manual adjustment';
      const changeType = raw.change_type
        ? raw.change_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Stock Changed';

      combined.push({
        id: raw.id,
        module: 'inventory',
        action: changeType,
        details: `${itemName}: stock ${direction} by ${absQty}. Reason: ${reason}`,
        user: fmtLogUser(raw.changed_by_user),
        role: raw.changed_by_user?.role || 'system',
        createdAt: fmtLogDate(raw.created_at),
        timestamp: raw.created_at ? new Date(raw.created_at).getTime() : 0,
      });
    });

    // ── Audit Logs ────────────────────────────────────────────────────────
    q.data.audit.forEach((raw: any) => {
      let details = '';
      const m = raw.metadata || {};

      switch (raw.action) {
        case 'Update Inventory': {
          const name = m.after?.name || m.before?.name || 'Item';
          const fields = (m.changed_fields || []).map(humanizeField);
          details = `Updated "${name}": ${fields.length > 0 ? fields.join(', ') : 'details'} changed.`;
          break;
        }
        case 'Create Order': {
          details = `New order #${m.order_number || '—'} created for ${fmtLogPeso(m.total_amount)}.`;
          break;
        }
        case 'Record Payment': {
          const method = (m.method || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          details = `Payment of ${fmtLogPeso(m.amount)} recorded via ${method}${m.ref ? ` (Ref: ${m.ref})` : ''}.`;
          break;
        }
        case 'Approve Payment':
          details = `Payment approved${m.order_number ? ` for order #${m.order_number}` : ''}.`;
          break;
        case 'Decline Payment':
          details = `Payment declined. Reason: ${m.reason || 'Not specified'}.`;
          break;
        case 'Request Cash Advance':
          details = `Cash advance of ${fmtLogPeso(m.amount)} requested for ${m.employee_name || 'employee'}.`;
          break;
        case 'Approve Cash Advance':
          details = `Cash advance of ${fmtLogPeso(m.amount)} approved for ${m.employee_name || 'employee'}.`;
          break;
        case 'Decline Cash Advance':
          details = `Cash advance declined for ${m.employee_name || 'employee'}. Reason: ${m.reason || 'Not specified'}.`;
          break;
        case 'Create Employee':
          details = `New employee added: ${m.name || '—'} as ${m.position || '—'}.`;
          break;
        case 'Update Employee': {
          const updatedFields = Object.keys(m.updates || {}).map(humanizeField);
          details = `Employee info updated: ${updatedFields.length > 0 ? updatedFields.join(', ') : 'details changed'}.`;
          break;
        }
        case 'Create Supplier':
          details = `New supplier registered: ${m.name || '—'}.`;
          break;
        case 'Update Supplier': {
          const supplierFields = Object.keys(m.updates || {}).map(humanizeField);
          details = `Supplier info updated: ${supplierFields.length > 0 ? supplierFields.join(', ') : 'details changed'}.`;
          break;
        }
        case 'Create Inventory Item':
          details = `New material added to inventory: ${m.name || '—'}.`;
          break;
        case 'Create Product':
          details = `New product created: ${m.name || '—'}${m.category ? ` (${m.category})` : ''}.`;
          break;
        case 'Update Product': {
          const productFields = Object.keys(m.updates || {}).map(humanizeField);
          details = `Product updated: ${productFields.length > 0 ? productFields.join(', ') : 'details changed'}.`;
          break;
        }
        case 'Delete Product':
          details = `Product "${m.name || '—'}" was deactivated.`;
          break;
        case 'Assign Designer':
          details = `Designer assigned to order #${m.order_number || '—'}.`;
          break;
        case 'Assign Production':
          details = `Production staff assigned to order #${m.order_number || '—'}.`;
          break;
        case 'Create Delivery':
          details = `Restock requested: ${m.material || '—'} (${m.quantity || 0} units) from ${m.supplier || '—'}.`;
          break;
        case 'Confirm Delivery':
          details = `Delivery received: ${m.material || '—'} (${m.received_quantity || 0} units). Ref: ${m.receipt_ref || 'N/A'}.`;
          break;
        default: {
          // Fallback: try to produce something readable from metadata
          if (typeof raw.metadata === 'object' && raw.metadata !== null) {
            const keys = Object.keys(raw.metadata).filter(k => !['id', 'actor_id'].includes(k));
            if (keys.length <= 4) {
              details = keys.map(k => `${humanizeField(k)}: ${String(raw.metadata[k])}`).join(', ');
            } else {
              details = `${keys.length} fields updated.`;
            }
          } else {
            details = String(raw.metadata || 'No additional details.');
          }
        }
      }

      // Humanize the action label itself
      const actionLabel = raw.action
        ? raw.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'System Action';

      // Humanize the module/target table
      const moduleMap: Record<string, string> = {
        orders: 'Orders', order_items: 'Orders', payments: 'Payments',
        inventory_items: 'Inventory', products: 'Products',
        product_supply_mapping: 'Products', deliveries: 'Deliveries',
        employees: 'Employees', users: 'Users', suppliers: 'Suppliers',
        cash_advances: 'Cash Advances', payroll_periods: 'Payroll',
        payroll_records: 'Payroll', attendance_logs: 'Attendance',
      };
      const module = moduleMap[raw.target_table] || raw.target_table || 'system';

      combined.push({
        id: raw.id,
        module,
        action: actionLabel,
        details,
        user: fmtLogUser(raw.actor_user),
        role: raw.actor_role || raw.actor_user?.role || 'system',
        createdAt: fmtLogDate(raw.created_at),
        timestamp: raw.created_at ? new Date(raw.created_at).getTime() : 0,
      });
    });

    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [q.data]);

  return { logs, loading: q.loading, error: q.error, refresh: q.refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASHIER CASH ADVANCES
// ═══════════════════════════════════════════════════════════════════════════════
export interface CashAdvanceEligibility {
  eligible: boolean;
  reason: 'eligible' | 'limit_reached';
  remaining: number; totalUsed: number;
}

export function useCashierCashAdvances() {
  const q = useQuery(() => db.cashAdvances.getPendingCount(), []);
  return {
    pendingCount: q.data ?? 0, loading: q.loading, refresh: q.refresh,
    checkEligibility: async (employeeId: string, customDate?: string): Promise<CashAdvanceEligibility> => {
      try { return await db.cashAdvances.checkEligibility(employeeId, customDate); }
      catch { return { eligible: false, reason: 'limit_reached', remaining: 0, totalUsed: 0 }; }
    },
    submitRequest: async (data: { employee_id: string; amount: number; date_issued?: string; reason?: string }) => {
      const r = await safe(() => db.cashAdvances.requestByCashier(data).then(() => q.refresh()));
      return r;
    },
  };
}