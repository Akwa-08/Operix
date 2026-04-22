-- ============================================================================
-- Operix Power Seed Script (v3.0)
-- Objective: Refresh system data while PRESERVING Payroll and Employee records.
-- Includes: Auth Synchronization, Functional Accounts, and Realistic Lifecycle Data.
-- ============================================================================

-- 1. UTILITY: Setup Catch-all Admin Reference
-- System Admin ID: 6bbc2e8b-168c-4a1c-98de-5939c6045d69
DO $$
BEGIN
    -- Re-assign critical Payroll/Employee references to the System Admin before purging.
    -- This ensures we don't break historic payroll records or pending cash advances.
    
    UPDATE public.payroll_periods 
    SET created_by = '6bbc2e8b-168c-4a1c-98de-5939c6045d69' 
    WHERE created_by NOT IN (SELECT id FROM public.users WHERE role = 'admin');

    UPDATE public.cash_advances 
    SET issued_by = '6bbc2e8b-168c-4a1c-98de-5939c6045d69' 
    WHERE issued_by NOT IN (SELECT id FROM public.users WHERE role = 'admin');

    UPDATE public.cash_advances 
    SET requested_by_cashier = '6bbc2e8b-168c-4a1c-98de-5939c6045d69' 
    WHERE requested_by_cashier NOT IN (SELECT id FROM public.users WHERE role = 'admin')
    AND requested_by_cashier IS NOT NULL;
END $$;


-- 2. PHASE 1: DEEP PURGE (Operational Data & Non-Admin Accounts)
-- ============================================================================

-- A. Clear Backend Operational Tables
DELETE FROM public.cart_items;
DELETE FROM public.chat_messages;
DELETE FROM public.notifications;
DELETE FROM public.sales_reports;
DELETE FROM public.receipts;
DELETE FROM public.payments;
DELETE FROM public.order_logs;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.inventory_changes;
DELETE FROM public.deliveries;
DELETE FROM public.audit_logs;

-- B. Sync with Supabase Auth (Delete non-admin identities and users)
-- We target the IDs that are about to be deleted from public.users
DELETE FROM auth.identities WHERE user_id NOT IN (SELECT id FROM public.users WHERE lower(role) = 'admin');
DELETE FROM auth.sessions WHERE user_id NOT IN (SELECT id FROM public.users WHERE lower(role) = 'admin');
DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.users WHERE lower(role) = 'admin');

-- C. Clear Public Users
-- Deleting based on ID exclusion of current admins is the most robust way to swipe
DELETE FROM public.users WHERE lower(role) != 'admin' OR role IS NULL;


-- 3. PHASE 2: FUNCTIONAL ACCOUNT CREATION
-- ============================================================================

-- Helper to insert into both Auth and Public with functional credentials
-- Passwords: FirstNameLastName123!
DO $$
DECLARE
    uid uuid;
BEGIN
    -- STAFF: Ana Reyes (Cashier)
    uid := 'd0000000-0000-0000-0000-000000000001';
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (uid, 'ana.cashier@example.com', crypt('AnaReyes123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"firstName":"Ana","lastName":"Reyes","role":"cashier"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'ana.cashier@example.com'), 'email', uid::text, now())
    ON CONFLICT (provider, provider_id) DO NOTHING;
    
    INSERT INTO public.users (id, first_name, last_name, email, role, contact_number)
    VALUES (uid, 'Ana', 'Reyes', 'ana.cashier@example.com', 'cashier', '09215556666')
    ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, role = EXCLUDED.role;

    -- STAFF: Mark Bautista (Designer)
    uid := 'd0000000-0000-0000-0000-000000000002';
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (uid, 'mark.designer@example.com', crypt('MarkBautista123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"firstName":"Mark","lastName":"Bautista","role":"designer"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'mark.designer@example.com'), 'email', uid::text, now())
    ON CONFLICT (provider, provider_id) DO NOTHING;

    INSERT INTO public.users (id, first_name, last_name, email, role, contact_number)
    VALUES (uid, 'Mark', 'Bautista', 'mark.designer@example.com', 'designer', '09226667777')
    ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, role = EXCLUDED.role;

    -- CUSTOMER: Juan Dela Cruz
    uid := 'c0000000-0000-0000-0000-000000000001';
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (uid, 'juan@example.com', crypt('JuanDela Cruz123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"firstName":"Juan","lastName":"Dela Cruz","role":"customer"}', 'authenticated', 'authenticated')
    ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at)
    VALUES (gen_random_uuid(), uid, jsonb_build_object('sub', uid, 'email', 'juan@example.com'), 'email', uid::text, now())
    ON CONFLICT (provider, provider_id) DO NOTHING;

    INSERT INTO public.users (id, first_name, last_name, email, role, contact_number)
    VALUES (uid, 'Juan', 'Dela Cruz', 'juan@example.com', 'customer', '09171112222')
    ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, role = EXCLUDED.role;

END $$;


-- 4. PHASE 3: REALISTIC OPERATIONAL STATE
-- ============================================================================

-- A. Active Production Orders
INSERT INTO public.orders (id, order_number, customer_id, order_type, status, payment_status, total_amount, amount_paid, assigned_designer, due_date)
VALUES 
('00000000-0000-0000-0000-000000000001', 'ORD-2026-001', 'c0000000-0000-0000-0000-000000000001', 'online', 'designing', 'partial', 5500.00, 2000.00, 'd0000000-0000-0000-0000-000000000002', NOW() + INTERVAL '3 days');

INSERT INTO public.order_items (order_id, product_name, quantity, unit_price, subtotal, specifications)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Bulk T-Shirt Printing', 20, 250.00, 5000.00, 'Cotton, Mixed Sizes'),
('00000000-0000-0000-0000-000000000001', 'Graphic Design Fee', 1, 500.00, 500.00, 'Logo cleanup');

-- B. Accounting (Payment & Receipt)
INSERT INTO public.payments (id, order_id, amount, payment_method, received_by)
VALUES ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2000.00, 'gcash', 'd0000000-0000-0000-0000-000000000001');

INSERT INTO public.receipts (payment_id, issued_by, receipt_number)
VALUES ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'RCPT-2026-001');

-- C. Notifications
INSERT INTO public.notifications (user_id, related_module, related_id, title, message)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'orders', '00000000-0000-0000-0000-000000000001', 'Order Update', 'Your order ORD-2026-001 is now in the Designing phase.'),
('d0000000-0000-0000-0000-000000000002', 'orders', '00000000-0000-0000-0000-000000000001', 'New Assignment', 'You have been assigned to design order ORD-2026-001.');

-- DONE
