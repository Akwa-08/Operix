// backend/src/modules/orders/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const { requireRole } = require('../../../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// Read — all staff roles
router.get('/',        requireRole('admin', 'cashier', 'designer', 'production'), orderController.getAllOrders);
router.get('/stats',   requireRole('admin', 'cashier'), orderController.getStats);
router.get('/:id',     requireRole('admin', 'cashier', 'designer', 'production'), orderController.getOrderById);

// Create — admin + cashier
router.post('/',       requireRole('admin', 'cashier'), orderController.createOrder);

// Update status — all staff (designer marks designing→payment, production marks production→pickup)
router.patch('/:id/status',  requireRole('admin', 'cashier', 'designer', 'production'), orderController.updateStatus);

// Assign staff — admin only
router.patch('/:id/assign',  requireRole('admin'), orderController.assignStaff);

// Payments — admin + cashier
router.post('/:id/payments',  requireRole('admin', 'cashier'), orderController.recordPayment);
router.get('/:id/payments',   requireRole('admin', 'cashier'), orderController.getPayments);

module.exports = router;