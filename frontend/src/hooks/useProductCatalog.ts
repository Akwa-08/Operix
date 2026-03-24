// frontend/src/hooks/useProductCatalog.ts
// Bridge hook: maps useProducts() from useSupabase.ts to the shape
// that HomePage.tsx expects (title, variant, size, price, etc.)

import { useProducts } from './useSupabase';

/** Product shape expected by ProductCard / HomePage */
export interface CatalogProduct {
  id: string;
  title: string;
  category: string;
  variant: string;
  size: string;
  price: number;
  description: string;
  isActive: boolean;
}

/** Map a raw Supabase products row → CatalogProduct */
function toCatalog(p: any): CatalogProduct {
  return {
    id: p.id,
    title: p.name,
    category: p.category || '',
    variant: p.variant || '',
    size: p.size_spec || '',
    price: Number(p.final_price),
    description: p.description || '',
    isActive: p.is_active,
  };
}

export function useProductCatalog(filters?: { search?: string; category?: string }) {
  const { products: raw, loading, error, refresh } = useProducts(filters);

  const products: CatalogProduct[] = raw.map(toCatalog);

  return { products, loading, error, refresh };
}
