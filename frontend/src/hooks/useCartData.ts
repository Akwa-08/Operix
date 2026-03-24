// frontend/src/hooks/useCartData.ts
// Bridge hook: wraps useCart() from useSupabase.ts and exposes
// the interface that Cart.tsx and HomePage.tsx expect.

import { useCart } from './useSupabase';

/** Cart item shape expected by Cart.tsx */
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  variant: string;
  sizeSpec: string;
  price: number;
  quantity: number;
  specifications?: string;
  fileUrl?: string;
}

/** Map a raw Supabase cart_items row → CartItem */
function toCartItem(row: any): CartItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product?.name || 'Unknown',
    category: row.product?.category || '',
    variant: row.product?.variant || '',
    sizeSpec: row.product?.size_spec || '',
    price: Number(row.product?.final_price || 0),
    quantity: row.quantity,
    specifications: row.specifications,
    fileUrl: undefined, // Supabase Storage integration pending
  };
}

export function useCartData() {
  const {
    items: raw,
    totalItems,
    totalPrice,
    loading,
    error,
    refresh,
    addToCart: rawAdd,
    updateQuantity: rawUpdate,
    removeItem: rawRemove,
    clearCart: rawClear,
    checkout: rawCheckout,
  } = useCart();

  const items: CartItem[] = raw.map(toCartItem);

  return {
    items,
    totalItems,
    totalPrice,
    loading,
    error,
    refresh,

    /** Add product to cart. Returns { success, error } */
    addToCart: async (productId: string, qty?: number) => {
      try {
        await rawAdd(productId, qty);
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to add to cart' };
      }
    },

    /** Update quantity of a cart item */
    updateQuantity: async (cartItemId: string, qty: number) => {
      try {
        await rawUpdate(cartItemId, qty);
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    /** Remove a cart item */
    removeItem: async (cartItemId: string) => {
      try {
        await rawRemove(cartItemId);
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    /** Clear all cart items */
    clearCart: async () => {
      try {
        await rawClear();
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },

    /** Checkout the cart → create order */
    checkout: async (notes?: string, due?: string) => {
      try {
        const order = await rawCheckout(notes, due);
        return { success: true, error: null, order };
      } catch (err: any) {
        return { success: false, error: err.message || 'Checkout failed', order: null };
      }
    },
  };
}
