// backend/src/modules/accounts_management/routes/accountRoutes.js
// Route definitions for the Account Management module

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const supplierController = require('../controllers/supplierController');

// ──── USER / EMPLOYEE ROUTES ────────────────────────────────────
// IMPORTANT: Bulk action routes MUST come before :id routes
// to prevent "deactivate" from being parsed as a UUID param.

router.get('/users', userController.getAllUsers);
router.post('/users', userController.createUser);
router.patch('/users/deactivate', userController.bulkDeactivate);
router.patch('/users/reactivate', userController.bulkReactivate);
router.patch('/users/:id/reactivate', userController.reactivateUser);
router.put('/users/:id', userController.updateUser);

// ──── SUPPLIER ROUTES (Account Dashboard Scope) ─────────────────

router.get('/suppliers', supplierController.getAllSuppliers);
router.post('/suppliers', supplierController.createSupplier);
router.patch('/suppliers/deactivate', supplierController.bulkDeactivate);
router.patch('/suppliers/reactivate', supplierController.bulkReactivate);
router.patch('/suppliers/:id/flag', supplierController.flagSupplier);
router.patch('/suppliers/:id/reactivate', supplierController.reactivateSupplier);

module.exports = router;
