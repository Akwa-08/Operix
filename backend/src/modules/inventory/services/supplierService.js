// backend/src/modules/inventory/services/supplierService.js
// Business logic for supplier management

const { supabase } = require('../../../config/supabase');

class SupplierService {
  /**
   * Create a new supplier
   */
  async createSupplier(supplierData) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: supplierData.name,
        contact_person: supplierData.contact_person,
        phone: supplierData.phone,
        email: supplierData.email,
        address: supplierData.address,
        is_active: true,
        is_flagged: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all suppliers with optional filters
   */
  async getAllSuppliers(filters = {}) {
    let query = supabase
      .from('suppliers')
      .select('*');

    // Apply filters
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.is_flagged !== undefined) {
      query = query.eq('is_flagged', filters.is_flagged);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`);
    }

    // Sorting
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Supplier not found');
      notFoundError.name = 'NotFoundError';
      throw notFoundError;
    }

    return data;
  }

  /**
   * Update supplier
   */
  async updateSupplier(id, updateData) {
    // First check if supplier exists
    await this.getSupplierById(id);

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Flag/unflag a supplier
   */
  async flagSupplier(id, isFlagged, flagReason = null) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        is_flagged: isFlagged,
        flag_reason: flagReason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Activate/deactivate supplier
   */
  async toggleSupplierStatus(id, isActive) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete supplier (soft delete by deactivating)
   */
  async deleteSupplier(id) {
    // Check if supplier has any deliveries
    const { data: deliveries, error: checkError } = await supabase
      .from('supply_deliveries')
      .select('id')
      .eq('supplier_id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (deliveries && deliveries.length > 0) {
      const error = new Error('Cannot delete supplier with existing delivery records. Deactivate instead.');
      error.statusCode = 400;
      throw error;
    }

    // Actually delete if no dependencies
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Supplier deleted successfully' };
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStats(id) {
    // Get total deliveries
    const { count: totalDeliveries, error: deliveryError } = await supabase
      .from('supply_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id);

    if (deliveryError) throw deliveryError;

    // Get completed deliveries
    const { count: completedDeliveries, error: completedError } = await supabase
      .from('supply_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)
      .eq('status', 'Completed');

    if (completedError) throw completedError;

    // Get total spend
    const { data: spendData, error: spendError } = await supabase
      .from('supply_deliveries')
      .select('total_cost')
      .eq('supplier_id', id)
      .eq('status', 'Completed');

    if (spendError) throw spendError;

    const totalSpend = spendData.reduce((sum, record) => sum + parseFloat(record.total_cost || 0), 0);

    // Get items supplied
    const { data: itemsData, error: itemsError } = await supabase
      .from('item_suppliers')
      .select(`
        inventory_item_id,
        inventory_items (
          name
        )
      `)
      .eq('supplier_id', id);

    if (itemsError) throw itemsError;

    return {
      total_deliveries: totalDeliveries || 0,
      completed_deliveries: completedDeliveries || 0,
      total_spend: totalSpend,
      items_supplied: itemsData || []
    };
  }
}

module.exports = new SupplierService();