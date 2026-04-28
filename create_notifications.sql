-- create_notifications.sql
-- Run this in your Supabase SQL editor to create the notifications table and triggers.

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_module TEXT,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- Trigger for Orders to notify customers when status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Notify the customer
        IF NEW.customer_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, related_module, related_id)
            VALUES (
                NEW.customer_id, 
                'Order Update', 
                'Your order ' || COALESCE(NEW.order_number, '') || ' is now ' || NEW.status, 
                'orders', 
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_change ON public.orders;
CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

-- Trigger for Inventory Low Stock
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- If quantity drops below reorder point
    IF NEW.current_quantity <= NEW.reorder_point AND OLD.current_quantity > OLD.reorder_point THEN
        -- Find all users with role 'admin' or 'cashier'
        FOR admin_user IN SELECT id FROM public.users WHERE role IN ('admin', 'cashier') LOOP
            INSERT INTO public.notifications (user_id, title, message, related_module, related_id)
            VALUES (
                admin_user.id, 
                'Low Stock Alert', 
                NEW.name || ' is running low on stock.', 
                'inventory', 
                NEW.id
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_low_stock ON public.inventory_items;
CREATE TRIGGER trg_low_stock
AFTER UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
