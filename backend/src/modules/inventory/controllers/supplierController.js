const supplierService = require('../services/supplierService');
const { successResponse, errorResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class SupplierController {
  // Create supplier
  createSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.createSupplier(req.body);
    return successResponse(res, supplier, 'Supplier created successfully', 201);
  });

  // Get all suppliers
  getAllSuppliers = asyncHandler(async (req, res) => {
    const suppliers = await supplierService.getAllSuppliers(req.query);
    return successResponse(res, suppliers, 'Suppliers retrieved successfully');
  });

  // Get supplier by ID
  getSupplierById = asyncHandler(async (req, res) => {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return successResponse(res, supplier, 'Supplier retrieved successfully');
  });

  // Update supplier
  updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    return successResponse(res, supplier, 'Supplier updated successfully');
  });

  // Flag supplier
  flagSupplier = asyncHandler(async (req, res) => {
    const { is_flagged, flag_reason } = req.body;
    const supplier = await supplierService.flagSupplier(req.params.id, is_flagged, flag_reason);
    return successResponse(res, supplier, 'Supplier flag status updated');
  });

  // Toggle supplier status
  toggleStatus = asyncHandler(async (req, res) => {
    const { is_active } = req.body;
    const supplier = await supplierService.toggleSupplierStatus(req.params.id, is_active);
    return successResponse(res, supplier, 'Supplier status updated');
  });

  // Delete supplier
  deleteSupplier = asyncHandler(async (req, res) => {
    const result = await supplierService.deleteSupplier(req.params.id);
    return successResponse(res, result, 'Supplier deleted successfully');
  });

  // Get supplier stats
  getSupplierStats = asyncHandler(async (req, res) => {
    const stats = await supplierService.getSupplierStats(req.params.id);
    return successResponse(res, stats, 'Supplier statistics retrieved');
  });
}

module.exports = new SupplierController();