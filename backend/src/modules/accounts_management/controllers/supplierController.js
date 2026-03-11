// backend/src/modules/accounts_management/controllers/supplierController.js
// Request/response handling for account-scoped supplier management

const supplierService = require('../services/supplierService');
const { successResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class SupplierController {
    // List all suppliers (default: active only)
    getAllSuppliers = asyncHandler(async (req, res) => {
        const suppliers = await supplierService.getAllSuppliers(req.query);
        return successResponse(res, suppliers, 'Suppliers retrieved successfully');
    });

    // Create a new supplier
    createSupplier = asyncHandler(async (req, res) => {
        const supplier = await supplierService.createSupplier(req.body);
        return successResponse(res, supplier, 'Supplier created successfully', 201);
    });

    // Flag or unflag a supplier
    flagSupplier = asyncHandler(async (req, res) => {
        const supplier = await supplierService.flagSupplier(req.params.id, req.body);
        return successResponse(res, supplier, 'Supplier flag status updated');
    });

    // Bulk deactivate suppliers
    bulkDeactivate = asyncHandler(async (req, res) => {
        const result = await supplierService.bulkDeactivate(req.body);
        return successResponse(
            res,
            result,
            `${result.deactivated_count} supplier(s) deactivated successfully`
        );
    });
    // Reactivate a single supplier
    reactivateSupplier = asyncHandler(async (req, res) => {
        const supplier = await supplierService.reactivateSupplier(req.params.id);
        return successResponse(res, supplier, 'Supplier reactivated successfully');
    });

    // Bulk reactivate suppliers
    bulkReactivate = asyncHandler(async (req, res) => {
        const result = await supplierService.bulkReactivate(req.body);
        return successResponse(
            res,
            result,
            `${result.reactivated_count} supplier(s) reactivated successfully`
        );
    });
}

module.exports = new SupplierController();
