// backend/src/modules/accounts_management/routes/accountRoutes.js
// REFACTORED: Added requireRole('admin') to ALL user and supplier management routes
// Previously ANY authenticated user (including customers) could access these endpoints

const express = require('express');
const router = express.Router();
const { requireRole } = require('../../../middleware/authMiddleware');

const userController = require('../controllers/userController');
const supplierController = require('../controllers/supplierController');

// ══════════════════════════════════════════════════════════════════════════════
// USER / EMPLOYEE ROUTES — Admin only
// ══════════════════════════════════════════════════════════════════════════════
// IMPORTANT: Bulk action routes MUST come before :id routes
// to prevent "deactivate" from being parsed as a UUID param.

router.get(   '/users',                  requireRole('admin'), userController.getAllUsers);
router.post(  '/users',                  requireRole('admin'), userController.createUser);
router.patch( '/users/deactivate',       requireRole('admin'), userController.bulkDeactivate);
router.patch( '/users/reactivate',       requireRole('admin'), userController.bulkReactivate);
router.patch( '/users/:id/reactivate',   requireRole('admin'), userController.reactivateUser);
router.put(   '/users/:id',             requireRole('admin'), userController.updateUser);

// ══════════════════════════════════════════════════════════════════════════════
// SUPPLIER ROUTES (Account Management Scope) — Admin only
// ══════════════════════════════════════════════════════════════════════════════
// NOTE: The duplicate supplier routes that existed in inventory module have been
// consolidated here. See inventoryRoutes.js — supplier routes there now redirect
// to this canonical source.

router.get(   '/suppliers',              requireRole('admin'), supplierController.getAllSuppliers);
router.post(  '/suppliers',              requireRole('admin'), supplierController.createSupplier);
router.patch( '/suppliers/deactivate',   requireRole('admin'), supplierController.bulkDeactivate);
router.patch( '/suppliers/reactivate',   requireRole('admin'), supplierController.bulkReactivate);
router.patch( '/suppliers/:id/flag',     requireRole('admin'), supplierController.flagSupplier);
router.patch( '/suppliers/:id/reactivate', requireRole('admin'), supplierController.reactivateSupplier);

module.exports = router;