// frontend/src/hooks/useOrdersData.ts

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import type { Order } from '../Types';

// ── Status mappers (DB snake_case → Frontend Title Case) ─────────────────
const STATUS_MAP: Record<string, Order['status']> = {
  in_queue: 'In Queue',
  designing: 'Designing',
  payment: 'Payment',
  production: 'Production',
  pickup: 'Pickup',
  completed: 'Completed',
  cancelled: 'Completed', // no "Cancelled" in frontend type, fallback
};

const REVERSE_STATUS: Record<string, string> = {
  'In Queue': 'in_queue',
  'Designing': 'designing',
  'Payment': 'payment',
  'Production': 'production',
  'Pickup': 'pickup',
  'Completed': 'completed',
  'Overdue': 'in_queue', // overdue is a computed state, not DB status
};

const PAYMENT_MAP: Record<string, Order['paymentStatus']> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
};

function mapOrder(o: any): Order {
  const customer = o.customer;
  const customerName = customer
    ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : 'Walk-in Customer';
  const firstItem = o.order_items?.[0];
  const totalQty = o.order_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;

  // Check if overdue
  const isOverdue = o.due_date
    && new Date(o.due_date) < new Date()
    && !['completed', 'cancelled', 'pickup'].includes(o.status);

  return {
    id: o.id,
    orderId: o.order_number || o.id,
    customerName,
    customer: customerName,
    customerEmail: customer?.email || '',
    customerPhone: customer?.contact_number || '',
    productType: firstItem?.product_name || (o.order_items?.length > 1 ? 'Multiple Items' : '—'),
    product: firstItem?.product_name || '',
    quantity: totalQty,
    totalAmount: Number(o.total_amount) || 0,
    status: isOverdue ? 'Overdue' : (STATUS_MAP[o.status] || 'In Queue'),
    paymentStatus: PAYMENT_MAP[o.payment_status] || 'Unpaid',
    dateOrdered: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
    dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString() : '',
    specialInstructions: o.special_instructions || '',
    designFile: undefined,
    assignedDesigner: o.assigned_designer || undefined,
    assignedProduction: o.assigned_production || undefined,
  };
}

export interface OrderStats {
  total: number;
  inQueue: number;
  designing: number;
  production: number;
  readyPickup: number;
  completed: number;
  overdue: number;
  pendingPayment: number;
}

export function useOrdersData(statusFilter?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await apiClient.get(`/api/orders${params}`);
      if (res.success && res.data) {
        setOrders(res.data.map(mapOrder));
      } else {
        setError(res.error || 'Failed to load orders');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Compute stats from loaded orders
  const stats: OrderStats = {
    total: orders.length,
    inQueue: orders.filter(o => o.status === 'In Queue').length,
    designing: orders.filter(o => o.status === 'Designing').length,
    production: orders.filter(o => o.status === 'Production').length,
    readyPickup: orders.filter(o => o.status === 'Pickup').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    overdue: orders.filter(o => o.status === 'Overdue').length,
    pendingPayment: orders.filter(o => o.paymentStatus === 'Unpaid' || o.paymentStatus === 'Partial').length,
  };

  // ── Actions ────────────────────────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: string): Promise<{ success: boolean; error?: string }> => {
    const dbStatus = REVERSE_STATUS[newStatus] || newStatus.toLowerCase().replace(/ /g, '_');
    const res = await apiClient.patch(`/api/orders/${orderId}/status`, { status: dbStatus });
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to update status' };
  };

  const assignStaff = async (orderId: string, payload: { assigned_designer?: string; assigned_production?: string }) => {
    const res = await apiClient.patch(`/api/orders/${orderId}/assign`, payload);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to assign staff' };
  };

  const recordPayment = async (orderId: string, payment: { amount: number; payment_method: string; reference_number?: string; notes?: string }) => {
    const res = await apiClient.post(`/api/orders/${orderId}/payments`, payment);
    if (res.success) { await fetchOrders(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to record payment' };
  };

  const createOrder = async (orderData: { customer_id?: string; order_type: string; items: any[]; special_instructions?: string; due_date?: string }) => {
    const res = await apiClient.post('/api/orders', orderData);
    if (res.success) { await fetchOrders(); return { success: true, data: res.data }; }
    return { success: false, error: res.error || 'Failed to create order' };
  };

  return { orders, stats, loading, error, refresh: fetchOrders, updateStatus, assignStaff, recordPayment, createOrder };
}