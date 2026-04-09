-- Run this in your Supabase SQL Editor to apply the Architecture updates

-- 1. Add Guest Order tracking columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_name character varying,
ADD COLUMN IF NOT EXISTS guest_phone character varying,
ADD COLUMN IF NOT EXISTS guest_email character varying,
ADD COLUMN IF NOT EXISTS tracking_token uuid DEFAULT gen_random_uuid();

-- 2. Ensure auth.users -> public.users syncing works automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, role, email, contact_number, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    new.email,
    new.raw_user_meta_data->>'contact_number',
    new.raw_user_meta_data->>'username'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure public.users deletion -> auth.users cascading deletion
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS trigger AS $$
BEGIN
  DELETE FROM auth.users WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_public_user_deleted ON public.users;
CREATE TRIGGER on_public_user_deleted
  AFTER DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_delete_user();

-- 4. Create an RPC function to lookup an order securely using just the Tracking Token.
-- This allows walk-ins to check order status without needing an account, without breaking RLS.
CREATE OR REPLACE FUNCTION public.get_guest_order(p_tracking_token UUID)
RETURNS jsonb AS $$
DECLARE
  v_order jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'payment_status', o.payment_status,
    'total_amount', o.total_amount,
    'guest_name', o.guest_name,
    'customer_id', o.customer_id,
    'items', (
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'subtotal', oi.subtotal
      )) FROM public.order_items oi WHERE oi.order_id = o.id
    )
  ) INTO v_order
  FROM public.orders o
  WHERE o.tracking_token = p_tracking_token;
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
