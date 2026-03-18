// frontend/src/hooks/useCartData.ts
// Replaces Redux productsSlice with live API cart management

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

export interface CartItem {
  id: string;          // cart_items.id
  productId: string;
  productName: string;
  description: string;
  category: string;
  sizeSpec: string;
  variant: string;
  price: number;       // final_price per unit
  quantity: number;
  specifications: string;
  fileUrl?: string;     // for customer design uploads (local state only)
}

function mapCartItem(ci: any): CartItem {
  const product = ci.product || {};
  return {
    id: ci.id,
    productId: product.id || ci.product_id || '',
    productName: product.name || 'Unknown Product',
    description: product.description || '',
    category: product.category || '',
    sizeSpec: product.size_spec || '',
    variant: product.variant || '',
    price: Number(product.final_price) || 0,
    quantity: ci.quantity || 1,
    specifications: ci.specifications || '',
  };
}

export function useCartData() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/cart');
      if (res.success && res.data) {
        setItems(res.data.map(mapCartItem));
      } else {
        setError(res.error || 'Failed to load cart');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  // ── Add to cart ────────────────────────────────────────────────────────
  const addToCart = async (productId: string, quantity: number = 1, specifications?: string) => {
    const res = await apiClient.post('/api/cart', { product_id: productId, quantity, specifications });
    if (res.success) { await fetchCart(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to add to cart' };
  };

  // ── Update quantity ────────────────────────────────────────────────────
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    const res = await apiClient.put(`/api/cart/${cartItemId}`, { quantity: Math.max(1, quantity) });
    if (res.success) { await fetchCart(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to update quantity' };
  };

  // ── Remove item ────────────────────────────────────────────────────────
  const removeItem = async (cartItemId: string) => {
    const res = await apiClient.delete(`/api/cart/${cartItemId}`);
    if (res.success) { await fetchCart(); return { success: true }; }
    return { success: false, error: res.error || 'Failed to remove item' };
  };

  // ── Clear cart ─────────────────────────────────────────────────────────
  const clearCart = async () => {
    const res = await apiClient.delete('/api/cart');
    if (res.success) { setItems([]); return { success: true }; }
    return { success: false, error: res.error || 'Failed to clear cart' };
  };

  // ── Checkout ───────────────────────────────────────────────────────────
  const checkout = async (specialInstructions?: string, dueDate?: string) => {
    const res = await apiClient.post('/api/checkout', { special_instructions: specialInstructions, due_date: dueDate });
    if (res.success) { setItems([]); return { success: true, order: res.data }; }
    return { success: false, error: res.error || 'Checkout failed' };
  };

  return { items, totalItems, totalPrice, loading, error, refresh: fetchCart, addToCart, updateQuantity, removeItem, clearCart, checkout };
}