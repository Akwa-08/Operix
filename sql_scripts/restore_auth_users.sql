-- ============================================================================
-- SQL Script to Restore Auth Users and Identities
-- Default Password for all restored accounts is 'password123'
-- ============================================================================

-- 1. Ensure `public.users` exists and matches the provided snapshot
INSERT INTO public.users (id, first_name, last_name, username, contact_number, email, role, is_active, address)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'Juan', 'Dela Cruz', 'juandc', '09171112222', 'juan@example.com', 'Customer', true, null),
    ('c0000000-0000-0000-0000-000000000002', 'Maria', 'Santos', 'mariasantos', '09182223333', 'maria.santos@example.com', 'Customer', true, null),
    ('c0000000-0000-0000-0000-000000000003', 'Jose', 'Rizal', 'joserizal', '09193334444', 'jose@example.com', 'Customer', true, null),
    ('c0000000-0000-0000-0000-000000000004', 'Andres', 'Bonifacio', 'andresb', '09204445555', 'andres@example.com', 'Customer', true, null),
    ('d0000000-0000-0000-0000-000000000001', 'Ana', 'Reyes', 'anacashier', '09215556666', 'ana.cashier@example.com', 'cashier', true, null),
    ('d0000000-0000-0000-0000-000000000002', 'Mark', 'Bautista', 'markdesign', '09226667777', 'mark.designer@example.com', 'designer', true, null),
    ('d0000000-0000-0000-0000-000000000003', 'Paolo', 'Luna', 'paoloprod', '09237778888', 'paolo.production@example.com', 'production', true, null),
    ('6bbc2e8b-168c-4a1c-98de-5939c6045d69', 'Sys', 'Admin', null, null, 'operixadmin@spicysoda.com', 'admin', true, null)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    username = EXCLUDED.username,
    contact_number = EXCLUDED.contact_number,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- 2. Construct the `auth.users` records using data from `public.users`
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    id,
    'authenticated',
    'authenticated',
    email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('firstName', first_name, 'lastName', last_name, 'username', username, 'role', role),
    created_at,
    updated_at,
    '', '', '', ''
FROM public.users
WHERE id IN (
  'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003', '6bbc2e8b-168c-4a1c-98de-5939c6045d69'
)
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at;

-- 3. Construct the `auth.identities` correctly so Supabase Auth logs them in normally
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id, 'email', email),
    'email',
    id::text,
    NULL,
    created_at,
    updated_at
FROM public.users
WHERE id IN (
  'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003', '6bbc2e8b-168c-4a1c-98de-5939c6045d69'
)
ON CONFLICT DO NOTHING;
