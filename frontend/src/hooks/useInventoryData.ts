// frontend/src/hooks/useInventoryData.ts
// Replaces mock data in AdminInventory, CashierInventory, ProductionInventory
// Usage: const { materials, stats, loading, refresh } = useInventoryData();

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { mapInventoryItem, type FrontendMaterial } from '../services/dataMappers';

export function useInventoryData() {
  const [materials, setMaterials] = useState<FrontendMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/inventory/inventory-items');
      if (res.success && res.data) {
        setMaterials(res.data.map(mapInventoryItem));
      } else {
        setError(res.error || 'Failed to load inventory');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const stats = {
    total: materials.length,
    available: materials.filter(m => m.status === 'Available').length,
    lowStock: materials.filter(m => m.status === 'Low Stock').length,
    restocking: materials.filter(m => m.status === 'Restocking').length,
    phasedOut: materials.filter(m => m.status === 'Phased Out').length,
  };

  return { materials, stats, loading, error, refresh: fetchMaterials };
}