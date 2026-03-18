// backend/src/modules/orders/controllers/cartController.js

const { supabase } = require('../../../config/supabase');
const { successResponse, errorResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class CartController {

  // ── GET CART ITEMS ─────────────────────────────────────────────────────
  getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id, quantity, specifications, created_at,
        product:product_id ( id, name, description, category, size_spec, variant, final_price )
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return successResponse(res, data, 'Cart retrieved');
  });

  // ── ADD TO CART ────────────────────────────────────────────────────────
  addToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { product_id, quantity, specifications } = req.body;

    if (!product_id) return errorResponse(res, 'product_id is required', 400);

    // Check if already in cart (upsert)
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('customer_id', userId)
      .eq('product_id', product_id)
      .maybeSingle();

    if (existing) {
      // Update quantity
      const newQty = existing.quantity + (quantity || 1);
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty, specifications: specifications || null })
        .eq('id', existing.id)
        .select(`*, product:product_id ( id, name, final_price )`)
        .single();
      if (error) throw error;
      return successResponse(res, data, 'Cart item updated');
    }

    // Insert new
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{
        customer_id: userId,
        product_id,
        quantity: quantity || 1,
        specifications: specifications || null,
      }])
      .select(`*, product:product_id ( id, name, final_price )`)
      .single();

    if (error) throw error;
    return successResponse(res, data, 'Item added to cart', 201);
  });

  // ── UPDATE CART ITEM ───────────────────────────────────────────────────
  updateCartItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, specifications } = req.body;

    const payload = {};
    if (quantity !== undefined) payload.quantity = Math.max(1, quantity);
    if (specifications !== undefined) payload.specifications = specifications;

    const { data, error } = await supabase
      .from('cart_items')
      .update(payload)
      .eq('id', id)
      .eq('customer_id', req.user.id)
      .select(`*, product:product_id ( id, name, final_price )`)
      .single();

    if (error) throw error;
    if (!data) return errorResponse(res, 'Cart item not found', 404);
    return successResponse(res, data, 'Cart item updated');
  });

  // ── REMOVE FROM CART ───────────────────────────────────────────────────
  removeFromCart = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('customer_id', req.user.id);

    if (error) throw error;
    return successResponse(res, null, 'Item removed from cart');
  });

  // ── CLEAR CART ─────────────────────────────────────────────────────────
  clearCart = asyncHandler(async (req, res) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('customer_id', req.user.id);

    if (error) throw error;
    return successResponse(res, null, 'Cart cleared');
  });

  // ── CHECKOUT (convert cart → order) ────────────────────────────────────
  checkout = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { special_instructions, due_date } = req.body;

    // Get cart items
    const { data: cartItems, error: cartErr } = await supabase
      .from('cart_items')
      .select(`*, product:product_id ( id, name, final_price )`)
      .eq('customer_id', userId);

    if (cartErr) throw cartErr;
    if (!cartItems || cartItems.length === 0) return errorResponse(res, 'Cart is empty', 400);

    // Generate order number
    const { data: seqData } = await supabase.rpc('get_next_order_seq');
    const seqNum = seqData ?? Date.now();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(seqNum).padStart(5, '0')}`;

    // Calculate total
    const totalAmount = cartItems.reduce((sum, ci) => {
      const price = ci.product?.final_price || 0;
      return sum + (ci.quantity * parseFloat(price));
    }, 0);

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_id: userId,
        created_by: userId,
        order_type: 'online',
        status: 'in_queue',
        payment_status: 'unpaid',
        special_instructions: special_instructions || null,
        due_date: due_date || null,
        total_amount: totalAmount,
        amount_paid: 0,
      }])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Create order items from cart
    const orderItems = cartItems.map(ci => ({
      order_id: order.id,
      product_id: ci.product_id,
      product_name: ci.product?.name || 'Unknown Product',
      quantity: ci.quantity,
      unit_price: parseFloat(ci.product?.final_price || 0),
      subtotal: ci.quantity * parseFloat(ci.product?.final_price || 0),
      specifications: ci.specifications || null,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    // Clear cart
    await supabase.from('cart_items').delete().eq('customer_id', userId);

    // Return complete order
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`*, order_items ( * )`)
      .eq('id', order.id)
      .single();

    return successResponse(res, completeOrder, 'Order placed successfully', 201);
  });

  // ── GET PRODUCT CATALOG (public for customers) ─────────────────────────
  getProducts = asyncHandler(async (req, res) => {
    let query = supabase
      .from('products')
      .select('id, name, description, category, size_spec, variant, final_price, is_active')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }
    if (req.query.search) {
      const s = req.query.search.trim();
      query = query.or(`name.ilike.%${s}%,category.ilike.%${s}%,description.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return successResponse(res, data, 'Products retrieved');
  });
}

module.exports = new CartController();