-- Operix Realistic Data Seed Script
-- WARNING: This will delete existing customer orders, cart items, and mock customer accounts.
-- Run this in the Supabase SQL Editor.

-- 1. Clear related tables first to avoid foreign key conflicts
DELETE FROM public.cart_items;
DELETE FROM public.chat_messages;
DELETE FROM public.payments;
DELETE FROM public.receipts;
DELETE FROM public.order_logs;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.users WHERE role ILIKE 'customer';

-- 2. Insert Mock Users (Customers and Staff) with static UUIDs for referencing
INSERT INTO public.users (id, first_name, last_name, username, contact_number, email, role, is_active)
VALUES
('c0000000-0000-0000-0000-000000000001', 'Juan', 'Dela Cruz', 'juandc', '09171112222', 'juan@example.com', 'Customer', true),
('c0000000-0000-0000-0000-000000000002', 'Maria', 'Santos', 'mariasantos', '09182223333', 'maria.santos@example.com', 'Customer', true),
('c0000000-0000-0000-0000-000000000003', 'Jose', 'Rizal', 'joserizal', '09193334444', 'jose@example.com', 'Customer', true),
('c0000000-0000-0000-0000-000000000004', 'Andres', 'Bonifacio', 'andresb', '09204445555', 'andres@example.com', 'Customer', true),
('d0000000-0000-0000-0000-000000000001', 'Ana', 'Reyes', 'anacashier', '09215556666', 'ana.cashier@example.com', 'cashier', true),
('d0000000-0000-0000-0000-000000000002', 'Mark', 'Bautista', 'markdesign', '09226667777', 'mark.designer@example.com', 'designer', true),
('d0000000-0000-0000-0000-000000000003', 'Paolo', 'Luna', 'paoloprod', '09237778888', 'paolo.production@example.com', 'production', true);

-- 3. Insert Realistic Orders
INSERT INTO public.orders (id, order_number, customer_id, order_type, status, payment_status, total_amount, amount_paid, special_instructions, created_at, due_date, assigned_designer, assigned_production)
VALUES
('00000000-0000-0000-0000-000000000001', 'ORD-2026-001', 'c0000000-0000-0000-0000-000000000001', 'online', 'in_queue', 'unpaid', 1500.00, 0, 'Please rush if possible', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', NULL, NULL),
('00000000-0000-0000-0000-000000000002', 'ORD-2026-002', 'c0000000-0000-0000-0000-000000000002', 'walk-in', 'production', 'partial', 4500.00, 2000.00, 'Matte finish', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000003', 'ORD-2026-003', 'c0000000-0000-0000-0000-000000000003', 'online', 'completed', 'paid', 850.00, 850.00, '', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 days', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000004', 'ORD-2026-004', 'c0000000-0000-0000-0000-000000000004', 'walk-in', 'pickup', 'paid', 12000.00, 12000.00, 'Deliver via courier', NOW() - INTERVAL '1 days', NOW() + INTERVAL '5 days', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');

-- 4. Insert Order Items attached to those realistic orders
INSERT INTO public.order_items (order_id, product_name, quantity, unit_price, subtotal)
VALUES
('00000000-0000-0000-0000-000000000001', 'Custom Corporate T-Shirt', 5, 300.00, 1500.00),
('00000000-0000-0000-0000-000000000002', 'Tarpaulin 3x4 ft', 10, 450.00, 4500.00),
('00000000-0000-0000-0000-000000000003', 'Business Cards (100pcs)', 1, 850.00, 850.00),
('00000000-0000-0000-0000-000000000004', 'Sintra Board Signage', 4, 3000.00, 12000.00);

-- 5. Insert Payments corresponding to the paid and partial orders
INSERT INTO public.payments (order_id, amount, payment_method)
VALUES
('00000000-0000-0000-0000-000000000002', 2000.00, 'cash'),
('00000000-0000-0000-0000-000000000003', 850.00, 'gcash'),
('00000000-0000-0000-0000-000000000004', 12000.00, 'bank_transfer');

-- Done!
