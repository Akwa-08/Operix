-- Add notification tracking column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS unpaid_notification_sent boolean DEFAULT false;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_orders_unpaid_notif ON public.orders (payment_status, unpaid_notification_sent, created_at);
