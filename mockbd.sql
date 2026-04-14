-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.


CREATE TABLE public.attendance_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid,
  date date,
  time_in timestamp without time zone,
  time_out timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_logs_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  specifications text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  sender_id uuid,
  receiver_id uuid,
  message text,
  attachment_url character varying,
  is_seen boolean DEFAULT false,
  sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT chat_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id)
);
CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL,
  supplier_id uuid,
  requested_by uuid,
  requested_quantity numeric NOT NULL CHECK (requested_quantity > 0::numeric),
  expected_arrival_date date,
  status character varying NOT NULL DEFAULT 'requested'::character varying CHECK (status::text = ANY (ARRAY['requested'::character varying, 'ordered'::character varying, 'en_route'::character varying, 'received'::character varying, 'returned'::character varying, 'completed'::character varying]::text[])),
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
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_code character varying,
  full_name character varying,
  position character varying,
  base_hourly_rate numeric,
  holiday_rate_multiplier numeric,
  overtime_rate_multiplier numeric,
  hire_date date,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  holiday_date date NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  is_recurring boolean DEFAULT true,
  CONSTRAINT holidays_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_changes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_item_id uuid NOT NULL,
  change_type character varying NOT NULL CHECK (change_type::text = ANY (ARRAY['Manual Adjustment'::character varying, 'Waste'::character varying, 'Damage'::character varying, 'Correction'::character varying, 'Production Use'::character varying]::text[])),
  quantity_change numeric NOT NULL,
  quantity_before numeric NOT NULL,
  quantity_after numeric NOT NULL,
  reason text NOT NULL,
  changed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_changes_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_changes_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  unit_of_measure character varying NOT NULL,
  current_quantity numeric DEFAULT 0.00 CHECK (current_quantity >= 0::numeric),
  reorder_point numeric NOT NULL CHECK (reorder_point >= 0::numeric),
  unit_cost numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  purchase_unit character varying DEFAULT ''::character varying,
  conversion_rate numeric DEFAULT 1.0,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.item_suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_item_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  supplier_unit_price numeric NOT NULL CHECK (supplier_unit_price >= 0::numeric),
  lead_time_days integer DEFAULT 0,
  is_preferred boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT item_suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT item_suppliers_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT item_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  related_module character varying,
  related_id uuid,
  title character varying,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  product_name character varying NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  specifications text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.order_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  updated_by uuid,
  status character varying,
  note text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_logs_pkey PRIMARY KEY (id),
  CONSTRAINT order_logs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying NOT NULL UNIQUE,
  customer_id uuid,
  created_by uuid,
  order_type character varying NOT NULL DEFAULT 'online'::character varying CHECK (order_type::text = ANY (ARRAY['online'::character varying, 'walk-in'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'in_queue'::character varying CHECK (status::text = ANY (ARRAY['in_queue'::character varying, 'designing'::character varying, 'payment'::character varying, 'production'::character varying, 'pickup'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  payment_status character varying NOT NULL DEFAULT 'unpaid'::character varying CHECK (payment_status::text = ANY (ARRAY['unpaid'::character varying, 'partial'::character varying, 'paid'::character varying]::text[])),
  assigned_designer uuid,
  assigned_production uuid,
  special_instructions text,
  due_date timestamp without time zone,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  comments text,
  guest_name character varying,
  guest_phone character varying,
  guest_email character varying,
  tracking_token uuid DEFAULT gen_random_uuid(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT orders_assigned_designer_fkey FOREIGN KEY (assigned_designer) REFERENCES public.users(id),
  CONSTRAINT orders_assigned_production_fkey FOREIGN KEY (assigned_production) REFERENCES public.users(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method character varying NOT NULL DEFAULT 'cash'::character varying CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'gcash'::character varying, 'bank_transfer'::character varying, 'maya'::character varying]::text[])),
  reference_number character varying,
  received_by uuid,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id)
);
CREATE TABLE public.payroll_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  employee_id uuid,
  period_start date,
  period_end date,
  total_hours numeric,
  hourly_rate numeric,
  holiday_hours numeric,
  overtime_hours numeric,
  cash_advance numeric,
  bonus numeric,
  total_salary numeric,
  payroll_notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payroll_records_pkey PRIMARY KEY (id),
  CONSTRAINT payroll_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);
CREATE TABLE public.product_supply_mapping (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL,
  quantity_required numeric NOT NULL CHECK (quantity_required > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_supply_mapping_pkey PRIMARY KEY (id),
  CONSTRAINT product_supply_mapping_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_supply_mapping_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  category character varying,
  variant character varying,
  size_spec character varying,
  material_cost numeric DEFAULT 0.00,
  profit_fee numeric DEFAULT 0.00,
  final_price numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.receipts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  payment_id uuid,
  issued_by uuid,
  receipt_number character varying,
  pdf_url character varying,
  issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id)
);
CREATE TABLE public.sales_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  generated_by uuid,
  period_start date,
  period_end date,
  total_sales numeric,
  supply_cost numeric,
  payroll_cost numeric,
  net_profit numeric,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sales_reports_pkey PRIMARY KEY (id),
  CONSTRAINT sales_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  contact_person character varying,
  phone character varying,
  email character varying,
  address text,
  is_active boolean DEFAULT true,
  is_flagged boolean DEFAULT false,
  flag_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_name character varying,
  last_name character varying,
  username character varying UNIQUE,
  contact_number character varying,
  email character varying UNIQUE,
  role character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_active boolean DEFAULT true,
  address text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);


-- Enable RLS on tables
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_amr_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_client_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_supply_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE s3_multipart_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saml_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saml_relay_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;


-- Create RLS policies


-- cart_items
CREATE POLICY cart_delete ON cart_items
  FOR DELETE
  TO public
  USING (customer_id = auth.uid());


CREATE POLICY cart_insert ON cart_items
  FOR INSERT
  TO public
  WITH CHECK (customer_id = auth.uid());


CREATE POLICY cart_select ON cart_items
  FOR SELECT
  TO public
  USING (customer_id = auth.uid());


CREATE POLICY cart_update ON cart_items
  FOR UPDATE
  TO public
  USING (customer_id = auth.uid());


-- deliveries
CREATE POLICY "Admin full access deliveries" ON deliveries
  FOR ALL
  TO public
  USING (is_admin());


CREATE POLICY "Cashier can confirm deliveries" ON deliveries
  FOR UPDATE
  TO public
  USING (get_user_role() = ANY (ARRAY['cashier','admin']));


CREATE POLICY "Production can request restocks" ON deliveries
  FOR INSERT
  TO public
  WITH CHECK (get_user_role() = ANY (ARRAY['production','admin']));


CREATE POLICY "Staff can view deliveries" ON deliveries
  FOR SELECT
  TO public
  USING (is_staff());


-- employees
CREATE POLICY employees_admin_delete ON employees
  FOR DELETE
  TO public
  USING (is_admin());


CREATE POLICY employees_admin_insert ON employees
  FOR INSERT
  TO public
  WITH CHECK (is_admin());


CREATE POLICY employees_admin_update ON employees
  FOR UPDATE
  TO public
  USING (is_admin());


CREATE POLICY employees_staff_read ON employees
  FOR SELECT
  TO public
  USING (is_staff());


-- inventory_changes
CREATE POLICY inv_changes_staff_insert ON inventory_changes
  FOR INSERT
  TO public
  WITH CHECK (get_user_role() = ANY (ARRAY['admin','production']));


CREATE POLICY inv_changes_staff_read ON inventory_changes
  FOR SELECT
  TO public
  USING (is_staff());


CREATE POLICY inventory_changes_insert_staff ON inventory_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin','production']));


CREATE POLICY inventory_changes_select_staff ON inventory_changes
  FOR SELECT
  TO authenticated
  USING (is_staff());


-- inventory_items
CREATE POLICY inventory_admin_delete ON inventory_items
  FOR DELETE
  TO public
  USING (is_admin());


CREATE POLICY inventory_admin_insert ON inventory_items
  FOR INSERT
  TO public
  WITH CHECK (is_admin());


CREATE POLICY inventory_admin_update ON inventory_items
  FOR UPDATE
  TO public
  USING (is_admin());


CREATE POLICY inventory_delete_admin ON inventory_items
  FOR DELETE
  TO authenticated
  USING (is_admin());


CREATE POLICY inventory_insert_staff ON inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin','production']));


CREATE POLICY inventory_select_staff ON inventory_items
  FOR SELECT
  TO authenticated
  USING (is_staff());


CREATE POLICY inventory_staff_read ON inventory_items
  FOR SELECT
  TO public
  USING (is_staff());


CREATE POLICY inventory_update_staff ON inventory_items
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin','production']))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin','production']));


-- item_suppliers
CREATE POLICY item_suppliers_admin_delete ON item_suppliers
  FOR DELETE
  TO public
  USING (is_admin());


CREATE POLICY item_suppliers_admin_insert ON item_suppliers
  FOR INSERT
  TO public
  WITH CHECK (is_admin());


CREATE POLICY item_suppliers_admin_update ON item_suppliers
  FOR UPDATE
  TO public
  USING (is_admin());


CREATE POLICY item_suppliers_delete_admin ON item_suppliers
  FOR DELETE
  TO authenticated
  USING (is_admin());


CREATE POLICY item_suppliers_insert_admin ON item_suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());


CREATE POLICY item_suppliers_select_staff ON item_suppliers
  FOR SELECT
  TO authenticated
  USING (is_staff());


CREATE POLICY item_suppliers_staff_read ON item_suppliers
  FOR SELECT
  TO public
  USING (is_staff());


CREATE POLICY item_suppliers_update_admin ON item_suppliers
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());  






