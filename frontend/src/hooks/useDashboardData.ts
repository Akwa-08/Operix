// frontend/src/hooks/useDashboardData.ts
// Phase 5: Live dashboard data — replaces mock data in AdminDashboard

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

export interface DashboardData {
  orderStats: {
    total: number; inQueue: number; designing: number; production: number;
    pickup: number; completed: number; overdue: number;
    totalRevenue: number; totalCollected: number;
    today: number; thisWeek: number; thisMonth: number;
    unpaid: number; partial: number; paid: number;
  };
  inventoryStats: {
    total: number; available: number; lowStock: number; restocking: number;
  };
  lowStockItems: { id: string; name: string; currentQty: number; reorderPoint: number; unit: string; }[];
  recentOrders: { id: string; orderId: string; customerName: string; product: string; amount: number; status: string; date: string; }[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ordersRes, inventoryRes, ordersListRes] = await Promise.all([
        apiClient.get('/api/orders/stats'),
        apiClient.get('/api/inventory/inventory-items'),
        apiClient.get('/api/orders'),
      ]);

      // Order stats
      const os = ordersRes.success ? ordersRes.data : {};
      const orderStats = {
        total: os.total || 0, inQueue: os.in_queue || 0, designing: os.designing || 0,
        production: os.production || 0, pickup: os.pickup || 0, completed: os.completed || 0,
        overdue: os.overdue || 0, totalRevenue: os.totalRevenue || 0, totalCollected: os.totalCollected || 0,
        today: os.today || 0, thisWeek: os.thisWeek || 0, thisMonth: os.thisMonth || 0,
        unpaid: os.unpaid || 0, partial: os.partial || 0, paid: os.paid || 0,
      };

      // Inventory stats
      const items = inventoryRes.success ? (inventoryRes.data || []) : [];
      const lowStockItems = items
        .filter((i: any) => Number(i.current_quantity) <= Number(i.reorder_point) && Number(i.current_quantity) > 0)
        .map((i: any) => ({ id: i.id, name: i.name, currentQty: Number(i.current_quantity), reorderPoint: Number(i.reorder_point), unit: i.unit_of_measure }));
      const inventoryStats = {
        total: items.length,
        available: items.filter((i: any) => Number(i.current_quantity) > Number(i.reorder_point)).length,
        lowStock: lowStockItems.length,
        restocking: items.filter((i: any) => Number(i.current_quantity) <= 0).length,
      };

      // Recent orders (last 5)
      const ordersList = ordersListRes.success ? (ordersListRes.data || []) : [];
      const recentOrders = ordersList.slice(0, 5).map((o: any) => {
        const cust = o.customer;
        const name = cust ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() : 'Walk-in';
        const firstItem = o.order_items?.[0];
        return {
          id: o.id, orderId: o.order_number, customerName: name,
          product: firstItem?.product_name || 'Multiple Items',
          amount: Number(o.total_amount) || 0, status: o.status,
          date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
        };
      });

      setData({ orderStats, inventoryStats, lowStockItems, recentOrders });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return { data, loading, error, refresh: fetchAll };
}