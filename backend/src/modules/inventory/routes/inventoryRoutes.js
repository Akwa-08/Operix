// backend/src/modules/inventory/routes/inventoryRoutes.js
// REFACTORED: Added requireRole middleware to every route
// REFACTORED: Removed duplicate supplier CRUD routes (now consolidated in accountRoutes.js)
// 
// ROLE ACCESS MATRIX:
//   admin       — full access to everything
//   production  — read all + adjust inventory + deduct materials
//   cashier     — read-only access to inventory and products
//   designer    — read-only access to products
//   customer    — NO access (blocked by verifyToken + requireRole)

const express = require('express');
const router = express.Router();
const { requireRole } = require('../../../middleware/authMiddleware');

// Import controllers
const supplierController = require('../controllers/supplierController');
const inventoryItemController = require('../controllers/inventoryItemController');
const productController = require('../controllers/productController');

// ══════════════════════════════════════════════════════════════════════════════
// SUPPLIER ROUTES — Read-only here; write operations in accountRoutes.js
// ══════════════════════════════════════════════════════════════════════════════
// These provide read access for staff who need to see supplier info
// when managing inventory (e.g., viewing which suppliers provide an item).
// All write operations (create, update, flag, delete) are in accountRoutes.js.

router.get('/suppliers',
  requireRole('admin', 'cashier', 'production'),
  supplierController.getAllSuppliers
);

router.get('/suppliers/:id',
  requireRole('admin', 'cashier', 'production'),
  supplierController.getSupplierById
);

router.get('/suppliers/:id/stats',
  requireRole('admin'),
  supplierController.getSupplierStats
);

// ══════════════════════════════════════════════════════════════════════════════
// INVENTORY ITEM ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Read operations — all staff roles
router.get('/inventory-items',
  requireRole('admin', 'cashier', 'production'),
  inventoryItemController.getAllInventoryItems
);

router.get('/inventory-items/low-stock',
  requireRole('admin', 'cashier', 'production'),
  inventoryItemController.getLowStockItems
);

router.get('/inventory-items/stats',
  requireRole('admin', 'cashier', 'production'),
  inventoryItemController.getInventoryStats
);

router.get('/inventory-items/:id',
  requireRole('admin', 'cashier', 'production'),
  inventoryItemController.getInventoryItemById
);

router.get('/inventory-items/:id/history',
  requireRole('admin', 'production'),
  inventoryItemController.getInventoryHistory
);

// Write operations — admin and production only
router.post('/inventory-items',
  requireRole('admin'),
  inventoryItemController.createInventoryItem
);

router.put('/inventory-items/:id',
  requireRole('admin'),
  inventoryItemController.updateInventoryItem
);

router.patch('/inventory-items/:id/adjust',
  requireRole('admin', 'production'),
  inventoryItemController.adjustQuantity
);

router.post('/inventory-items/:id/suppliers',
  requireRole('admin'),
  inventoryItemController.linkSupplierToItem
);

router.delete('/inventory-items/:id/suppliers/:supplierId',
  requireRole('admin'),
  inventoryItemController.unlinkSupplierFromItem
);

router.delete('/inventory-items/:id',
  requireRole('admin'),
  inventoryItemController.deleteInventoryItem
);

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Read operations — all staff + designers
router.get('/products',
  requireRole('admin', 'cashier', 'production', 'designer'),
  productController.getAllProducts
);

router.get('/products/categories',
  requireRole('admin', 'cashier', 'production', 'designer'),
  productController.getProductCategories
);

router.get('/products/stats',
  requireRole('admin'),
  productController.getProductStats
);

router.get('/products/:id',
  requireRole('admin', 'cashier', 'production', 'designer'),
  productController.getProductById
);

router.get('/products/:id/material-cost',
  requireRole('admin', 'production'),
  productController.calculateMaterialCost
);

router.get('/products/:id/production-feasibility',
  requireRole('admin', 'production'),
  productController.checkProductionFeasibility
);

// Write operations — admin only (except deduct-materials)
router.post('/products',
  requireRole('admin'),
  productController.createProduct
);

router.put('/products/:id',
  requireRole('admin'),
  productController.updateProduct
);

router.post('/products/:id/materials',
  requireRole('admin'),
  productController.addMaterialToProduct
);

router.put('/products/materials/:mappingId',
  requireRole('admin'),
  productController.updateProductMaterial
);

router.delete('/products/:id/materials/:materialId',
  requireRole('admin'),
  productController.removeMaterialFromProduct
);

router.put('/products/:id/pricing',
  requireRole('admin'),
  productController.updateProductPricing
);

// Production can deduct materials (used when producing an order)
router.post('/products/:id/deduct-materials',
  requireRole('admin', 'production'),
  productController.deductMaterials
);

router.patch('/products/:id/status',
  requireRole('admin'),
  productController.toggleStatus
);

router.delete('/products/:id',
  requireRole('admin'),
  productController.deleteProduct
);

module.exports = router;