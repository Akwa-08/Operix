const productService = require('../services/productService');
const { successResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class ProductController {
  // Create product
  createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);
    return successResponse(res, product, 'Product created successfully', 201);
  });

  // Get all products
  getAllProducts = asyncHandler(async (req, res) => {
    const products = await productService.getAllProducts(req.query);
    return successResponse(res, products, 'Products retrieved successfully');
  });

  // Get product by ID
  getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    return successResponse(res, product, 'Product retrieved successfully');
  });

  // Update product
  updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    return successResponse(res, product, 'Product updated successfully');
  });

  // Add material to product
  addMaterialToProduct = asyncHandler(async (req, res) => {
    const { material_id, quantity_required } = req.body;
    
    const mapping = await productService.addMaterialToProduct(
      req.params.id,
      material_id,
      quantity_required
    );
    
    return successResponse(res, mapping, 'Material added to product successfully', 201);
  });

  // Update product material
  updateProductMaterial = asyncHandler(async (req, res) => {
    const { quantity_required } = req.body;
    
    const mapping = await productService.updateProductMaterial(
      req.params.mappingId,
      quantity_required
    );
    
    return successResponse(res, mapping, 'Product material updated successfully');
  });

  // Remove material from product
  removeMaterialFromProduct = asyncHandler(async (req, res) => {
    const result = await productService.removeMaterialFromProduct(
      req.params.id,
      req.params.materialId
    );
    return successResponse(res, result, 'Material removed from product successfully');
  });

  // Calculate material cost
  calculateMaterialCost = asyncHandler(async (req, res) => {
    const cost = await productService.calculateProductMaterialCost(req.params.id);
    return successResponse(res, { material_cost: cost }, 'Material cost calculated');
  });

  // Update product pricing
  updateProductPricing = asyncHandler(async (req, res) => {
    const { profit_fee } = req.body;
    const product = await productService.updateProductPricing(req.params.id, profit_fee);
    return successResponse(res, product, 'Product pricing updated successfully');
  });

  // Check production feasibility
  checkProductionFeasibility = asyncHandler(async (req, res) => {
    const quantity = parseInt(req.query.quantity) || 1;
    const feasibility = await productService.checkProductionFeasibility(req.params.id, quantity);
    return successResponse(res, feasibility, 'Production feasibility checked');
  });

  // Deduct materials for production
  deductMaterials = asyncHandler(async (req, res) => {
    const { quantity_produced } = req.body;
    const changedBy = req.user?.id || 'system';
    
    const result = await productService.deductMaterialsForProduction(
      req.params.id,
      quantity_produced,
      changedBy
    );
    
    return successResponse(res, result, 'Materials deducted for production');
  });

  // Toggle product status
  toggleStatus = asyncHandler(async (req, res) => {
    const { is_active } = req.body;
    const product = await productService.toggleProductStatus(req.params.id, is_active);
    return successResponse(res, product, 'Product status updated');
  });

  // Delete product
  deleteProduct = asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(req.params.id);
    return successResponse(res, result, 'Product deleted successfully');
  });

  // Get product categories
  getProductCategories = asyncHandler(async (req, res) => {
    const categories = await productService.getProductCategories();
    return successResponse(res, categories, 'Product categories retrieved');
  });

  // Get product stats
  getProductStats = asyncHandler(async (req, res) => {
    const stats = await productService.getProductStats();
    return successResponse(res, stats, 'Product statistics retrieved');
  });
}

module.exports = new ProductController();