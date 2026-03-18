// frontend/src/hooks/useProductCatalog.ts
// Replaces hardcoded productsData in customer HomePage

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

export interface CatalogProduct {
  id: string;
  title: string;      // matches ProductCard's expected field
  name: string;
  variant: string;
  size: string;
  price: number;
  description: string;
  category: string;
}

function mapProduct(p: any): CatalogProduct {
  return {
    id: p.id,
    title: p.name || '',
    name: p.name || '',
    variant: p.variant || p.category || '',
    size: p.size_spec || '',
    price: Number(p.final_price) || 0,
    description: p.description || '',
    category: p.category || '',
  };
}

export function useProductCatalog(searchQuery?: string, category?: string) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (category && category !== 'All') params.set('category', category);

      const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`;
      const res = await apiClient.get(url);

      if (res.success && res.data) {
        const mapped = res.data.map(mapProduct);
        setProducts(mapped);

        // Extract unique categories
        const cats = [...new Set(res.data.map((p: any) => p.category).filter(Boolean))] as string[];
        setCategories(cats);
      } else {
        setError(res.error || 'Failed to load products');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return { products, categories, loading, error, refresh: fetchProducts };
}