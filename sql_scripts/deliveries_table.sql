-- ═══════════════════════════════════════════════════════════════════════════════
-- DELIVERIES TABLE + RLS
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL,
  supplier_id uuid,
  requested_by uuid,
  requested_quantity numeric NOT NULL CHECK (requested_quantity > 0),
  expected_arrival_date date,
  status character varying NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'ordered', 'en_route', 'received', 'returned', 'completed')),
  received_quantity numeric DEFAULT 0,
  receipt_reference_number character varying,
  received_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT deliveries_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT deliveries_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT deliveries_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id)
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- All staff can read deliveries
CREATE POLICY "Staff can view deliveries"
  ON public.deliveries FOR SELECT
  USING (public.is_staff());

-- Admin can do everything
CREATE POLICY "Admin full access deliveries"
  ON public.deliveries FOR ALL
  USING (public.is_admin());

-- Production can create restock requests
CREATE POLICY "Production can request restocks"
  ON public.deliveries FOR INSERT
  WITH CHECK (public.get_user_role() IN ('production', 'admin'));

-- Cashier can update deliveries (confirm receipt)
CREATE POLICY "Cashier can confirm deliveries"
  ON public.deliveries FOR UPDATE
  USING (public.get_user_role() IN ('cashier', 'admin'));
