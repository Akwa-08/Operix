-- =================================================================
-- OPERIX — SQL Migrations (Run in Supabase SQL Editor in order)
-- =================================================================

-- -----------------------------------------------------------------
-- MIGRATION 001: Create audit_logs table (for structured audit trail)
-- Run FIRST — before deploying updated frontend code
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.users(id),
  actor_role varchar,
  action varchar NOT NULL,
  target_table varchar,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action  ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor   ON public.audit_logs(actor_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_admin_read   ON public.audit_logs;
DROP POLICY IF EXISTS audit_staff_insert ON public.audit_logs;
CREATE POLICY audit_admin_read   ON public.audit_logs FOR SELECT TO public USING (is_admin());
CREATE POLICY audit_staff_insert ON public.audit_logs FOR INSERT TO public WITH CHECK (is_staff());

-- -----------------------------------------------------------------
-- MIGRATION 002: Fix orders.assigned_production FK
-- CHANGES:  users(id) → employees(id)
-- WARNING:  This NULLs all existing assigned_production values
--           (old values were users.id, which are invalid employees.id).
--           Run this BEFORE deploying updated frontend code.
-- -----------------------------------------------------------------

-- Step 1: Clear invalid references
UPDATE public.orders SET assigned_production = NULL WHERE assigned_production IS NOT NULL;

-- Step 2: Drop old FK constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_assigned_production_fkey;

-- Step 3: Add correct FK pointing to employees table
ALTER TABLE public.orders ADD CONSTRAINT orders_assigned_production_fkey
  FOREIGN KEY (assigned_production) REFERENCES public.employees(id);

-- -----------------------------------------------------------------
-- VERIFICATION QUERIES (run after migrations to confirm success)
-- -----------------------------------------------------------------
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs';
-- SELECT conname, confrelid::regclass FROM pg_constraint WHERE conname = 'orders_assigned_production_fkey';
