const express = require('express');
const router = express.Router();

// Import controllers
const supplierController = require('../controllers/supplierController');
const inventoryItemController = require('../controllers/inventoryItemController');
const productController = require('../controllers/productController');

// SUPPLIER ROUTES
router.post('/suppliers', supplierController.createSupplier);
router.get('/suppliers', supplierController.getAllSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.patch('/suppliers/:id/flag', supplierController.flagSupplier);
router.patch('/suppliers/:id/status', supplierController.toggleStatus);
router.delete('/suppliers/:id', supplierController.deleteSupplier);
router.get('/suppliers/:id/stats', supplierController.getSupplierStats);

// INVENTORY ITEM ROUTES
router.post('/inventory-items', inventoryItemController.createInventoryItem);
router.get('/inventory-items', inventoryItemController.getAllInventoryItems);
router.get('/inventory-items/low-stock', inventoryItemController.getLowStockItems);
router.get('/inventory-items/stats', inventoryItemController.getInventoryStats);
router.get('/inventory-items/:id', inventoryItemController.getInventoryItemById);
router.put('/inventory-items/:id', inventoryItemController.updateInventoryItem);
router.patch('/inventory-items/:id/adjust', inventoryItemController.adjustQuantity);
router.get('/inventory-items/:id/history', inventoryItemController.getInventoryHistory);
router.post('/inventory-items/:id/suppliers', inventoryItemController.linkSupplierToItem);
router.delete('/inventory-items/:id/suppliers/:supplierId', inventoryItemController.unlinkSupplierFromItem);
router.delete('/inventory-items/:id', inventoryItemController.deleteInventoryItem);

// PRODUCT ROUTES
router.post('/products', productController.createProduct);
router.get('/products', productController.getAllProducts);
router.get('/products/categories', productController.getProductCategories);
router.get('/products/stats', productController.getProductStats);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', productController.updateProduct);
router.post('/products/:id/materials', productController.addMaterialToProduct);
router.put('/products/materials/:mappingId', productController.updateProductMaterial);
router.delete('/products/:id/materials/:materialId', productController.removeMaterialFromProduct);
router.get('/products/:id/material-cost', productController.calculateMaterialCost);
router.put('/products/:id/pricing', productController.updateProductPricing);
router.get('/products/:id/production-feasibility', productController.checkProductionFeasibility);
router.post('/products/:id/deduct-materials', productController.deductMaterials);
router.patch('/products/:id/status', productController.toggleStatus);
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;