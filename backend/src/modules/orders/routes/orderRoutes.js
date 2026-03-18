const express = require('express');
const router = express.Router();
const { requireRole } = require('../../../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// Read
router.get('/',        requireRole('admin','cashier','designer','production'), orderController.getAllOrders);
router.get('/stats',   requireRole('admin','cashier'), orderController.getStats);
router.get('/staff',   requireRole('admin','cashier'), orderController.getStaffList);
router.get('/:id',     requireRole('admin','cashier','designer','production'), orderController.getOrderById);

// Create
router.post('/',       requireRole('admin','cashier'), orderController.createOrder);

// Update
router.put('/:id',          requireRole('admin'), orderController.updateOrder);
router.patch('/:id/status', requireRole('admin','cashier','designer','production'), orderController.updateStatus);
router.patch('/:id/assign', requireRole('admin'), orderController.assignStaff);
router.patch('/:id/self-assign', requireRole('designer','production'), orderController.selfAssign);

// Delete
router.delete('/:id',  requireRole('admin'), orderController.deleteOrder);

// Payments
router.post('/:id/payments', requireRole('admin','cashier'), orderController.recordPayment);
router.get('/:id/payments',  requireRole('admin','cashier'), orderController.getPayments);

module.exports = router;