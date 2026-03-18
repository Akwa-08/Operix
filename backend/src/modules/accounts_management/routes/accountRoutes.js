const express = require('express');
const router = express.Router();
const { requireRole } = require('../../../middleware/authMiddleware');
const userController = require('../controllers/userController');
const supplierController = require('../controllers/supplierController');
const employeeController = require('../controllers/employeeController');

// USER ACCOUNTS
router.get(   '/users',                requireRole('admin'), userController.getAllUsers);
router.post(  '/users',                requireRole('admin'), userController.createUser);
router.patch( '/users/deactivate',     requireRole('admin'), userController.bulkDeactivate);
router.patch( '/users/reactivate',     requireRole('admin'), userController.bulkReactivate);
router.patch( '/users/:id/reactivate', requireRole('admin'), userController.reactivateUser);
router.put(   '/users/:id',           requireRole('admin'), userController.updateUser);

// EMPLOYEE HR RECORDS
router.get(   '/employees',                requireRole('admin'), employeeController.getAllEmployees);
router.post(  '/employees',                requireRole('admin'), employeeController.createEmployee);
router.put(   '/employees/:id',            requireRole('admin'), employeeController.updateEmployee);
router.patch( '/employees/:id/deactivate', requireRole('admin'), employeeController.deactivateEmployee);

// SUPPLIERS
router.get(   '/suppliers',              requireRole('admin'), supplierController.getAllSuppliers);
router.post(  '/suppliers',              requireRole('admin'), supplierController.createSupplier);
router.patch( '/suppliers/deactivate',   requireRole('admin'), supplierController.bulkDeactivate);
router.patch( '/suppliers/reactivate',   requireRole('admin'), supplierController.bulkReactivate);
router.patch( '/suppliers/:id/flag',     requireRole('admin'), supplierController.flagSupplier);
router.patch( '/suppliers/:id/reactivate', requireRole('admin'), supplierController.reactivateSupplier);

module.exports = router;