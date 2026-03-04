// backend/src/modules/inventory/services/productService.js
// Business logic for product management

const { supabase } = require('../../../config/supabase');

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        category: productData.category,
        variant: productData.variant,
        size_spec: productData.size_spec,
        material_cost: productData.material_cost || 0,
        profit_fee: productData.profit_fee || 0,
        final_price: productData.final_price,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all products with optional filters
   */
  async getAllProducts(filters = {}) {
    let query = supabase
      .from('products')
      .select('*');

    // Filter by active status
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // Filter by category
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,variant.ilike.%${filters.search}%`);
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
   * Get product by ID with material requirements
   */
  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_supply_mapping (
          id,
          quantity_required,
          inventory_items (
            id,
            name,
            unit_of_measure,
            current_quantity,
            unit_cost
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Product not found');
      notFoundError.name = 'NotFoundError';
      throw notFoundError;
    }

    return data;
  }

  /**
   * Update product
   */
  async updateProduct(id, updateData) {
    // Check if product exists
    await this.getProductById(id);

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Link material to product (Bill of Materials)
   */
  async addMaterialToProduct(productId, materialId, quantityRequired) {
    // Verify product and material exist
    await this.getProductById(productId);

    const { data, error } = await supabase
      .from('product_supply_mapping')
      .insert([{
        product_id: productId,
        inventory_item_id: materialId,
        quantity_required: quantityRequired
      }])
      .select(`
        *,
        inventory_items (
          name,
          unit_of_measure
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        const dupError = new Error('This material is already linked to this product');
        dupError.statusCode = 409;
        throw dupError;
      }
      throw error;
    }

    return data;
  }

  /**
   * Update material quantity required for a product
   */
  async updateProductMaterial(mappingId, quantityRequired) {
    const { data, error } = await supabase
      .from('product_supply_mapping')
      .update({ quantity_required: quantityRequired })
      .eq('id', mappingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove material from product
   */
  async removeMaterialFromProduct(productId, materialId) {
    const { error } = await supabase
      .from('product_supply_mapping')
      .delete()
      .eq('product_id', productId)
      .eq('inventory_item_id', materialId);

    if (error) throw error;
    return { message: 'Material removed from product successfully' };
  }

  /**
   * Calculate product material cost based on linked materials
   */
  async calculateProductMaterialCost(productId) {
    const product = await this.getProductById(productId);
    
    let totalMaterialCost = 0;
    
    if (product.product_supply_mapping) {
      for (const mapping of product.product_supply_mapping) {
        const quantity = parseFloat(mapping.quantity_required);
        const unitCost = parseFloat(mapping.inventory_items.unit_cost);
        totalMaterialCost += quantity * unitCost;
      }
    }

    return totalMaterialCost;
  }

  /**
   * Update product pricing (recalculate from materials)
   */
  async updateProductPricing(productId, profitFee) {
    // Calculate material cost
    const materialCost = await this.calculateProductMaterialCost(productId);
    
    // Calculate final price
    const finalPrice = materialCost + parseFloat(profitFee);

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update({
        material_cost: materialCost,
        profit_fee: profitFee,
        final_price: finalPrice
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if product can be produced (sufficient materials)
   */
  async checkProductionFeasibility(productId, quantityToProduce = 1) {
    const product = await this.getProductById(productId);
    
    const insufficientMaterials = [];
    
    if (product.product_supply_mapping) {
      for (const mapping of product.product_supply_mapping) {
        const requiredQty = parseFloat(mapping.quantity_required) * quantityToProduce;
        const availableQty = parseFloat(mapping.inventory_items.current_quantity);
        
        if (availableQty < requiredQty) {
          insufficientMaterials.push({
            material: mapping.inventory_items.name,
            required: requiredQty,
            available: availableQty,
            shortage: requiredQty - availableQty,
            unit: mapping.inventory_items.unit_of_measure
          });
        }
      }
    }

    return {
      can_produce: insufficientMaterials.length === 0,
      insufficient_materials: insufficientMaterials
    };
  }

  /**
   * Deduct materials for production (called when order enters production)
   */
  async deductMaterialsForProduction(productId, quantityProduced, changedBy) {
    // Check feasibility first
    const feasibility = await this.checkProductionFeasibility(productId, quantityProduced);
    
    if (!feasibility.can_produce) {
      const error = new Error('Insufficient materials for production');
      error.statusCode = 400;
      error.details = feasibility.insufficient_materials;
      throw error;
    }

    // Get product materials
    const product = await this.getProductById(productId);
    
    const deductionResults = [];

    // Deduct each material
    for (const mapping of product.product_supply_mapping) {
      const materialId = mapping.inventory_items.id;
      const quantityToDeduct = parseFloat(mapping.quantity_required) * quantityProduced;
      const currentQty = parseFloat(mapping.inventory_items.current_quantity);
      const newQty = currentQty - quantityToDeduct;

      // Update inventory
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_quantity: newQty })
        .eq('id', materialId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log the change
      const { data: changeLog, error: logError } = await supabase
        .from('inventory_changes')
        .insert([{
          inventory_item_id: materialId,
          change_type: 'Production Use',
          quantity_change: -quantityToDeduct,
          quantity_before: currentQty,
          quantity_after: newQty,
          reason: `Production of ${quantityProduced}x ${product.name}`,
          changed_by: changedBy
        }])
        .select()
        .single();

      if (logError) throw logError;

      deductionResults.push({
        material: mapping.inventory_items.name,
        deducted: quantityToDeduct,
        remaining: newQty
      });
    }

    return {
      product: product.name,
      quantity_produced: quantityProduced,
      materials_deducted: deductionResults
    };
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(id, isActive) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    // Check if product has any orders (would need orders table)
    // For now, just delete
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Product deleted successfully' };
  }

  /**
   * Get product categories (unique list)
   */
  async getProductCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map(p => p.category))];
    return categories;
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    // Total products
    const { count: totalProducts, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Active products
    const { count: activeProducts, error: activeError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) throw activeError;

    // Categories
    const categories = await this.getProductCategories();

    return {
      total_products: totalProducts || 0,
      active_products: activeProducts || 0,
      total_categories: categories.length
    };
  }
}

module.exports = new ProductService();