-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX CART DUPLICATION CONSTRAINT
-- Run this in your Supabase SQL Editor if you previously had a strict 
-- UNIQUE constraint forcing (customer_id, product_id) to be completely unique.
-- Our new application logic safely manages quantity increments vs creating new
-- rows for different designs.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Replace 'cart_items_customer_id_product_id_key' with the actual name of your
-- unique constraint if you set one up. By default, Opera mockdb.sql didn't have
-- one, but if Supabase throws a uniqueness error, this removes it:

ALTER TABLE public.cart_items 
DROP CONSTRAINT IF EXISTS cart_items_customer_id_product_id_key;

-- If you also want to enforce a more specific composite UNIQUE layout, you can
-- do so loosely on the same attributes + specifications:
-- (Uncomment the logic below if strictly needed, though the app safely manages it)
-- ALTER TABLE public.cart_items 
-- ADD CONSTRAINT cart_items_unique_comb UNIQUE (customer_id, product_id, coalesce(specifications, ''));
