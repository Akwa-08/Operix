// backend/src/modules/orders/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const { requireRole } = require('../../../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

// Product catalog — all authenticated users can browse
router.get('/products', requireRole('admin', 'cashier', 'designer', 'production', 'customer'), cartController.getProducts);

// Cart — customer only
router.get('/cart',          requireRole('customer'), cartController.getCart);
router.post('/cart',         requireRole('customer'), cartController.addToCart);
router.put('/cart/:id',      requireRole('customer'), cartController.updateCartItem);
router.delete('/cart/:id',   requireRole('customer'), cartController.removeFromCart);
router.delete('/cart',       requireRole('customer'), cartController.clearCart);

// Checkout — customer only
router.post('/checkout',     requireRole('customer'), cartController.checkout);

module.exports = router;