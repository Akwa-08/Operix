// backend/src/modules/inventory/services/inventoryItemService.js
// Business logic for inventory item (raw materials) management

const { supabase } = require('../../../config/supabase');

class InventoryItemService {
  /**
   * Create a new inventory item
   */
  async createInventoryItem(itemData) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        name: itemData.name,
        description: itemData.description,
        unit_of_measure: itemData.unit_of_measure,
        current_quantity: itemData.current_quantity || 0,
        reorder_point: itemData.reorder_point,
        unit_cost: itemData.unit_cost || 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all inventory items with optional filters
   */
  async getAllInventoryItems(filters = {}) {
    let query = supabase
      .from('inventory_items')
      .select('*');

    // Filter by search term
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Filter by low stock
    if (filters.lowStock === 'true' || filters.lowStock === true) {
      // This requires a custom query since we're comparing columns
      const { data, error } = await supabase
        .rpc('get_low_stock_items');
      
      if (error) {
        // Fallback: fetch all and filter in memory
        const { data: allData, error: allError } = await supabase
          .from('inventory_items')
          .select('*');
        
        if (allError) throw allError;
        
        return allData.filter(item => 
          parseFloat(item.current_quantity) <= parseFloat(item.reorder_point)
        );
      }
      
      return data;
    }

    // Sorting
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder === 'desc' ? { ascending: false } : { ascending: true };
    query = query.order(sortBy, sortOrder);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(id) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        item_suppliers (
          id,
          supplier_unit_price,
          lead_time_days,
          is_preferred,
          suppliers (
            id,
            name,
            contact_person,
            phone
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Inventory item not found');
      notFoundError.name = 'NotFoundError';
      throw notFoundError;
    }

    return data;
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id, updateData) {
    // Check if item exists
    await this.getInventoryItemById(id);

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Adjust inventory quantity manually
   */
  async adjustInventoryQuantity(id, adjustment, reason, changedBy) {
    // Get current item state
    const item = await this.getInventoryItemById(id);
    
    const quantityBefore = parseFloat(item.current_quantity);
    const quantityChange = parseFloat(adjustment);
    const quantityAfter = quantityBefore + quantityChange;

    // Validate: can't go negative
    if (quantityAfter < 0) {
      const error = new Error('Insufficient quantity. Cannot reduce below zero.');
      error.statusCode = 400;
      throw error;
    }

    // Start transaction-like operations
    // 1. Update inventory quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_quantity: quantityAfter })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Log the change
    const { data: changeLog, error: logError } = await supabase
      .from('inventory_changes')
      .insert([{
        inventory_item_id: id,
        change_type: 'Manual Adjustment',
        quantity_change: quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reason: reason,
        changed_by: changedBy
      }])
      .select()
      .single();

    if (logError) throw logError;

    return {
      item: updatedItem,
      changeLog: changeLog
    };
  }

  /**
   * Get low stock items (items at or below reorder point)
   */
  async getLowStockItems() {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*');

    if (error) throw error;

    // Filter where current_quantity <= reorder_point
    return data.filter(item => 
      parseFloat(item.current_quantity) <= parseFloat(item.reorder_point)
    );
  }

  /**
   * Get inventory change history for an item
   */
  async getInventoryHistory(itemId, filters = {}) {
    let query = supabase
      .from('inventory_changes')
      .select('*')
      .eq('inventory_item_id', itemId);

    // Filter by change type
    if (filters.changeType) {
      query = query.eq('change_type', filters.changeType);
    }

    // Date range filter
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Sort by most recent first
    query = query.order('created_at', { ascending: false });

    // Pagination
    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }
    if (filters.offset) {
      query = query.range(
        parseInt(filters.offset),
        parseInt(filters.offset) + (parseInt(filters.limit) || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Link supplier to inventory item
   */
  async linkSupplierToItem(itemId, supplierId, supplierUnitPrice, leadTimeDays, isPreferred) {
    // Verify item exists
    await this.getInventoryItemById(itemId);

    // If marking as preferred, unmark others
    if (isPreferred) {
      await supabase
        .from('item_suppliers')
        .update({ is_preferred: false })
        .eq('inventory_item_id', itemId);
    }

    const { data, error } = await supabase
      .from('item_suppliers')
      .insert([{
        inventory_item_id: itemId,
        supplier_id: supplierId,
        supplier_unit_price: supplierUnitPrice,
        lead_time_days: leadTimeDays || 0,
        is_preferred: isPreferred || false
      }])
      .select(`
        *,
        suppliers (
          name,
          contact_person
        )
      `)
      .single();

    if (error) {
      // Handle duplicate link
      if (error.code === '23505') {
        const updateError = new Error('This supplier is already linked to this item');
        updateError.statusCode = 409;
        throw updateError;
      }
      throw error;
    }

    return data;
  }

  /**
   * Remove supplier from inventory item
   */
  async unlinkSupplierFromItem(itemId, supplierId) {
    const { error } = await supabase
      .from('item_suppliers')
      .delete()
      .eq('inventory_item_id', itemId)
      .eq('supplier_id', supplierId);

    if (error) throw error;
    return { message: 'Supplier unlinked successfully' };
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(id) {
    // Check if item is used in any products
    const { data: productMappings, error: checkError } = await supabase
      .from('product_supply_mapping')
      .select('id')
      .eq('inventory_item_id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (productMappings && productMappings.length > 0) {
      const error = new Error('Cannot delete inventory item that is used in products');
      error.statusCode = 400;
      throw error;
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Inventory item deleted successfully' };
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats() {
    // Total items
    const { count: totalItems, error: countError } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Low stock count
    const lowStock = await this.getLowStockItems();

    // Total inventory value
    const { data: allItems, error: valueError } = await supabase
      .from('inventory_items')
      .select('current_quantity, unit_cost');

    if (valueError) throw valueError;

    const totalValue = allItems.reduce((sum, item) => 
      sum + (parseFloat(item.current_quantity) * parseFloat(item.unit_cost)), 
      0
    );

    return {
      total_items: totalItems || 0,
      low_stock_count: lowStock.length,
      total_inventory_value: totalValue.toFixed(2)
    };
  }
}

module.exports = new InventoryItemService();