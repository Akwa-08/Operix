// frontend/src/hooks/useSupabase.ts
// ALL data hooks in one file — each is a thin wrapper around db.*
// No apiClient, no Express, no middleware chain.

import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/database';

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
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
export function useUsers(filters?: { role?: string; status?: string }) {
  const q = useQuery(() => db.getUsers(filters), [filters?.role, filters?.status]);
  return { users: q.data || [], ...q };
}

export function useMyProfile() {
  const q = useQuery(() => db.getMyProfile(), []);
  return { profile: q.data, ...q };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES
// ═══════════════════════════════════════════════════════════════════════════════
export function useEmployees() {
  const q = useQuery(() => db.getEmployees(), []);
  return { employees: q.data || [], ...q };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════════
export function useSuppliers() {
  const q = useQuery(() => db.getSuppliers(), []);
  return { suppliers: q.data || [], ...q };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
export function useInventory() {
  const q = useQuery(() => db.getInventoryItems(), []);
  const items = q.data || [];

  const stats = {
    total: items.length,
    available: items.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length,
    lowStock: items.filter((i: any) => Number(i.current_quantity) > 0 && Number(i.current_quantity) <= Number(i.reorder_point)).length,
    restocking: items.filter((i: any) => Number(i.current_quantity) <= 0).length,
    phasedOut: items.filter((i: any) => !i.is_active).length,
  };

  return { items, stats, ...q };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════
export function useProducts(filters?: { search?: string; category?: string }) {
  const q = useQuery(() => db.getProducts(filters), [filters?.search, filters?.category]);
  return { products: q.data || [], ...q };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════
export function useOrders(filters?: { status?: string }) {
  const { data: rawOrders, loading, error, refresh } = useQuery(() => db.getOrders(filters), [filters?.status]);
  const { data: staffList } = useQuery(() => db.getStaffList(), []);

  const orders = rawOrders || [];
  const staff = (staffList || []).map((s: any) => ({
    id: s.id, firstName: s.first_name || '', lastName: s.last_name || '', role: s.role,
  }));

  const now = new Date();
  const stats = {
    total: orders.length,
    inQueue: orders.filter((o: any) => o.status === 'in_queue').length,
    designing: orders.filter((o: any) => o.status === 'designing').length,
    production: orders.filter((o: any) => o.status === 'production').length,
    pickup: orders.filter((o: any) => o.status === 'pickup').length,
    completed: orders.filter((o: any) => o.status === 'completed').length,
    overdue: orders.filter((o: any) => o.due_date && new Date(o.due_date) < now && !['completed', 'cancelled', 'pickup'].includes(o.status)).length,
    pendingPayment: orders.filter((o: any) => o.payment_status !== 'paid').length,
  };

  return { orders, stats, staff, loading, error, refresh };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════════════════════
export function useCart() {
  const { data: rawItems, loading, error, refresh } = useQuery(() => db.getCart(), []);
  const items = rawItems || [];

  return {
    items,
    totalItems: items.reduce((s: number, i: any) => s + (i.quantity || 0), 0),
    totalPrice: items.reduce((s: number, i: any) => s + (i.quantity || 0) * parseFloat(i.product?.final_price || '0'), 0),
    loading, error, refresh,
    addToCart: async (productId: string, qty?: number) => { await db.addToCart(productId, qty); refresh(); },
    updateQuantity: async (id: string, qty: number) => { await db.updateCartItem(id, { quantity: Math.max(1, qty) }); refresh(); },
    removeItem: async (id: string) => { await db.removeCartItem(id); refresh(); },
    clearCart: async () => { await db.clearCart(); refresh(); },
    checkout: async (notes?: string, due?: string) => { const o = await db.checkout(notes, due); refresh(); return o; },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD (aggregated)
// ═══════════════════════════════════════════════════════════════════════════════
export function useDashboard() {
  const { orders, stats: orderStats, loading: oL } = useOrders();
  const { items: inventory, stats: invStats, loading: iL } = useInventory();

  const lowStockItems = inventory
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

  return {
    orderStats, invStats, lowStockItems, recentOrders,
    loading: oL || iL,
  };
}