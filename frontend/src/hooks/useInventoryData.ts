// frontend/src/hooks/useInventoryData.ts
// Bridge hook: maps useInventory() from useSupabase.ts to the interface
// that AdminInventory, CashierInventory, ProductionInventory expect.

import { useInventory } from './useSupabase';
import { db } from '../lib/database';
import type { Material, MaterialStatus } from '../Types';

/** Derive display status from raw inventory row */
function deriveStatus(item: any): MaterialStatus {
  if (!item.is_active) return 'Phased Out';
  const qty = Number(item.current_quantity);
  const rp = Number(item.reorder_point);
  if (qty <= 0) return 'Restocking';
  if (qty <= rp) return 'Low Stock';
  return 'Available';
}

/** Map a raw Supabase inventory_items row → Material UI shape */
function toMaterial(item: any): Material {
  const preferred = item.item_suppliers?.find((s: any) => s.is_preferred) ?? item.item_suppliers?.[0];
  return {
    id: item.id,
    itemType: item.name,
    itemVariant: item.description || '',
    usableStocks: Number(item.current_quantity),
    stockUnit: item.unit_of_measure,
    reorderPoint: Number(item.reorder_point),
    unitCost: Number(item.unit_cost),
    purchaseQty: Number(item.conversion_rate ?? 1),
    purchaseUnit: item.purchase_unit || item.unit_of_measure,
    supplier: preferred?.suppliers?.name || '—',
    status: deriveStatus(item),
    isActive: item.is_active,
    description: item.description,
    lastSupplierCost: preferred ? Number(preferred.supplier_unit_price) : undefined,
  };
}

export function useInventoryData() {
  const { items: raw, stats, loading, error, refresh } = useInventory();

  const materials: Material[] = raw.map(toMaterial);

  const materialStats = {
    total: stats.total,
    available: stats.available,
    lowStock: stats.lowStock,
    restocking: stats.restocking,
    phasedOut: stats.phasedOut,
  };

  return {
    materials,
    stats: materialStats,
    loading,
    error,
    refresh,
    // Expose mutation helpers so components don't import db directly
    createItem: db.createInventoryItem.bind(db),
    updateItem: db.updateInventoryItem.bind(db),
  };
}
