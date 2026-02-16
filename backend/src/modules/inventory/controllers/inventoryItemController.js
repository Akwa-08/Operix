const inventoryItemService = require('../services/inventoryItemService');
const { successResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class InventoryItemController {
  // Create inventory item
  createInventoryItem = asyncHandler(async (req, res) => {
    const item = await inventoryItemService.createInventoryItem(req.body);
    return successResponse(res, item, 'Inventory item created successfully', 201);
  });

  // Get all inventory items
  getAllInventoryItems = asyncHandler(async (req, res) => {
    const items = await inventoryItemService.getAllInventoryItems(req.query);
    return successResponse(res, items, 'Inventory items retrieved successfully');
  });

  // Get low stock items
  getLowStockItems = asyncHandler(async (req, res) => {
    const items = await inventoryItemService.getLowStockItems();
    return successResponse(res, items, 'Low stock items retrieved successfully');
  });

  // Get inventory item by ID
  getInventoryItemById = asyncHandler(async (req, res) => {
    const item = await inventoryItemService.getInventoryItemById(req.params.id);
    return successResponse(res, item, 'Inventory item retrieved successfully');
  });

  // Update inventory item
  updateInventoryItem = asyncHandler(async (req, res) => {
    const item = await inventoryItemService.updateInventoryItem(req.params.id, req.body);
    return successResponse(res, item, 'Inventory item updated successfully');
  });

  // Adjust inventory quantity
  adjustQuantity = asyncHandler(async (req, res) => {
    const { adjustment, reason } = req.body;
    const changedBy = req.user?.id || 'system'; // From auth middleware
    
    const result = await inventoryItemService.adjustInventoryQuantity(
      req.params.id,
      adjustment,
      reason,
      changedBy
    );
    
    return successResponse(res, result, 'Inventory quantity adjusted successfully');
  });

  // Get inventory history
  getInventoryHistory = asyncHandler(async (req, res) => {
    const history = await inventoryItemService.getInventoryHistory(req.params.id, req.query);
    return successResponse(res, history, 'Inventory history retrieved successfully');
  });

  // Link supplier to item
  linkSupplierToItem = asyncHandler(async (req, res) => {
    const { supplier_id, supplier_unit_price, lead_time_days, is_preferred } = req.body;
    
    const link = await inventoryItemService.linkSupplierToItem(
      req.params.id,
      supplier_id,
      supplier_unit_price,
      lead_time_days,
      is_preferred
    );
    
    return successResponse(res, link, 'Supplier linked to item successfully', 201);
  });

  // Unlink supplier from item
  unlinkSupplierFromItem = asyncHandler(async (req, res) => {
    const result = await inventoryItemService.unlinkSupplierFromItem(
      req.params.id,
      req.params.supplierId
    );
    return successResponse(res, result, 'Supplier unlinked from item successfully');
  });

  // Delete inventory item
  deleteInventoryItem = asyncHandler(async (req, res) => {
    const result = await inventoryItemService.deleteInventoryItem(req.params.id);
    return successResponse(res, result, 'Inventory item deleted successfully');
  });

  // Get inventory stats
  getInventoryStats = asyncHandler(async (req, res) => {
    const stats = await inventoryItemService.getInventoryStats();
    return successResponse(res, stats, 'Inventory statistics retrieved successfully');
  });
}

module.exports = new InventoryItemController();