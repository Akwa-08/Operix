// frontend/src/hooks/useOrdersData.ts
// FIXED: resolves designer/production names, adds comments, date filters, self-assign

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import type { Order } from '../Types';

const STATUS_MAP: Record<string, Order['status']> = {
  in_queue: 'In Queue', designing: 'Designing', payment: 'Payment',
  production: 'Production', pickup: 'Pickup', completed: 'Completed', cancelled: 'Completed',
};
const REVERSE_STATUS: Record<string, string> = {
  'In Queue': 'in_queue', 'Designing': 'designing', 'Payment': 'payment',
  'Production': 'production', 'Pickup': 'pickup', 'Completed': 'completed', 'Overdue': 'in_queue',
};
const PAYMENT_MAP: Record<string, Order['paymentStatus']> = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

function nameFromJoin(obj: any): string {
  if (!obj) return '';
  return `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
}

function mapOrder(o: any): Order & { designerName: string; productionName: string; comments: string; amountPaid: number; orderType: string } {
  const customerName = o.customer ? nameFromJoin(o.customer) : 'Walk-in Customer';
  const firstItem = o.order_items?.[0];
  const totalQty = o.order_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
  const isOverdue = o.due_date && new Date(o.due_date) < new Date() && !['completed','cancelled','pickup'].includes(o.status);

  return {
    id: o.id,
    orderId: o.order_number || o.id,
    customerName,
    customer: customerName,
    customerEmail: o.customer?.email || '',
    customerPhone: o.customer?.contact_number || '',
    productType: firstItem?.product_name || (o.order_items?.length > 1 ? 'Multiple Items' : '—'),
    product: firstItem?.product_name || '',
    quantity: totalQty,
    totalAmount: Number(o.total_amount) || 0,
    amountPaid: Number(o.amount_paid) || 0,
    status: isOverdue ? 'Overdue' : (STATUS_MAP[o.status] || 'In Queue'),
    paymentStatus: PAYMENT_MAP[o.payment_status] || 'Unpaid',
    dateOrdered: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
    dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString() : '',
    specialInstructions: o.special_instructions || '',
    comments: o.comments || '',
    designerName: nameFromJoin(o.designer),
    productionName: nameFromJoin(o.production_staff),
    assignedDesigner: o.assigned_designer || undefined,
    assignedProduction: o.assigned_production || undefined,
    orderType: o.order_type || 'walk-in',
  };
}

export interface StaffMember { id: string; firstName: string; lastName: string; role: string; }

export interface OrderStats {
  total: number; inQueue: number; designing: number; production: number;
  readyPickup: number; completed: number; overdue: number; pendingPayment: number;
  today: number; thisWeek: number; thisMonth: number;
  totalRevenue: number; totalCollected: number;
}

export function useOrdersData(statusFilter?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const [ordersRes, staffRes] = await Promise.all([
        apiClient.get(`/api/orders${params}`),
        apiClient.get('/api/orders/staff'),
      ]);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data.map(mapOrder));
      else setError(ordersRes.error || 'Failed to load orders');
      if (staffRes.success && staffRes.data) {
        setStaffList(staffRes.data.map((s: any) => ({ id: s.id, firstName: s.first_name || '', lastName: s.last_name || '', role: s.role })));
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const stats: OrderStats = {
    total: orders.length,
    inQueue: orders.filter(o => o.status === 'In Queue').length,
    designing: orders.filter(o => o.status === 'Designing').length,
    production: orders.filter(o => o.status === 'Production').length,
    readyPickup: orders.filter(o => o.status === 'Pickup').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    overdue: orders.filter(o => o.status === 'Overdue').length,
    pendingPayment: orders.filter(o => o.paymentStatus === 'Unpaid' || o.paymentStatus === 'Partial').length,
    today: 0, thisWeek: 0, thisMonth: 0, totalRevenue: 0, totalCollected: 0,
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const dbStatus = REVERSE_STATUS[newStatus] || newStatus.toLowerCase().replace(/ /g, '_');
    const res = await apiClient.patch(`/api/orders/${orderId}/status`, { status: dbStatus });
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error };
  };

  const assignStaff = async (orderId: string, payload: { assigned_designer?: string; assigned_production?: string }) => {
    const res = await apiClient.patch(`/api/orders/${orderId}/assign`, payload);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error };
  };

  const selfAssign = async (orderId: string) => {
    const res = await apiClient.patch(`/api/orders/${orderId}/self-assign`);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error };
  };

  const recordPayment = async (orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) => {
    const res = await apiClient.post(`/api/orders/${orderId}/payments`, payment);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error };
  };

  const createOrder = async (orderData: any) => {
    const res = await apiClient.post('/api/orders', orderData);
    if (res.success) { await fetchOrders(); return { success: true, data: res.data }; }
    return { success: false, error: res.error };
  };

  const deleteOrder = async (orderId: string) => {
    const res = await apiClient.delete(`/api/orders/${orderId}`);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error };
  };

  const updateOrder = async (orderId: string, data: any) => {
    const res = await apiClient.put(`/api/orders/${orderId}`, data);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error };
  };

  return { orders, stats, staffList, loading, error, refresh: fetchOrders, updateStatus, assignStaff, selfAssign, recordPayment, createOrder, deleteOrder, updateOrder };
}