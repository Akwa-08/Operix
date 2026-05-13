-- =================================================================================
-- MIGRATION: Add sss_contribution to employees table
-- =================================================================================
-- Description: Adds the manual SSS contribution column to the employees table.
-- This aligns it with PhilHealth and HDMF fields, allowing the Admin
-- to set per-employee SSS deductions from the Contributions panel.

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS sss_contribution numeric DEFAULT 0;

-- Optional: If you want to comment the column for future maintainers
COMMENT ON COLUMN public.employees.sss_contribution IS 'Manual SSS deduction amount per payroll period';
