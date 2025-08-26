-- Reservations & Booking System v1.0
-- Complete table reservation and booking management

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  reservation_number varchar(50) UNIQUE NOT NULL,
  
  -- Customer information
  customer_name varchar(255) NOT NULL,
  customer_phone varchar(50),
  customer_email varchar(255),
  
  -- Reservation details
  party_size integer NOT NULL CHECK (party_size > 0),
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 120,
  
  -- Status and notes
  status varchar(20) NOT NULL DEFAULT 'confirmed' 
    CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  special_requests text,
  internal_notes text,
  
  -- Tracking
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  confirmed_at timestamptz,
  seated_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.reservation_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.tables(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(reservation_id, table_id)
);

-- Fulfillment slots for takeaway/delivery scheduling
CREATE TABLE public.fulfillment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  
  -- Slot timing
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  
  -- Capacity and type
  slot_type varchar(20) NOT NULL CHECK (slot_type IN ('pickup', 'delivery')),
  max_capacity integer NOT NULL DEFAULT 10,
  current_bookings integer NOT NULL DEFAULT 0,
  
  -- Configuration
  active boolean NOT NULL DEFAULT true,
  preparation_time_minutes integer NOT NULL DEFAULT 30,
  
  -- Location for delivery
  delivery_zone varchar(100), -- For delivery slots
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(company_id, slot_date, start_time, slot_type, delivery_zone)
);

CREATE TABLE public.order_fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  fulfillment_slot_id uuid REFERENCES public.fulfillment_slots(id),
  
  -- Fulfillment details
  fulfillment_type varchar(20) NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery', 'dine_in')),
  scheduled_time timestamptz,
  estimated_ready timestamptz,
  actual_ready timestamptz,
  
  -- Customer info for pickup/delivery
  customer_name varchar(255),
  customer_phone varchar(50),
  delivery_address text,
  delivery_instructions text,
  
  -- Status tracking
  status varchar(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_reservations_company_date ON public.reservations(company_id, reservation_date, reservation_time);
CREATE INDEX idx_reservations_status_date ON public.reservations(status, reservation_date) WHERE status IN ('confirmed', 'pending');
CREATE INDEX idx_reservations_customer_phone ON public.reservations(customer_phone) WHERE customer_phone IS NOT NULL;

CREATE INDEX idx_reservation_tables_reservation ON public.reservation_tables(reservation_id);
CREATE INDEX idx_reservation_tables_table ON public.reservation_tables(table_id);

CREATE INDEX idx_fulfillment_slots_company_date ON public.fulfillment_slots(company_id, slot_date, slot_type);
CREATE INDEX idx_fulfillment_slots_availability ON public.fulfillment_slots(slot_date, slot_type, active) 
  WHERE current_bookings < max_capacity;

CREATE INDEX idx_order_fulfillments_order ON public.order_fulfillments(order_id);
CREATE INDEX idx_order_fulfillments_slot ON public.order_fulfillments(fulfillment_slot_id);
CREATE INDEX idx_order_fulfillments_status_time ON public.order_fulfillments(status, scheduled_time);

-- Functions for reservation management
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS varchar(50) LANGUAGE plpgsql AS $$
DECLARE
  today_date text;
  next_number integer;
  new_reservation_number varchar(50);
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(RIGHT(r.reservation_number, 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.reservations r
  WHERE r.reservation_number LIKE 'RES-' || today_date || '-%';
  
  new_reservation_number := 'RES-' || today_date || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_reservation_number;
END;
$$;

CREATE OR REPLACE FUNCTION create_reservation(
  p_customer_name varchar(255),
  p_customer_phone varchar(50),
  p_customer_email varchar(255),
  p_party_size integer,
  p_reservation_date date,
  p_reservation_time time,
  p_duration_minutes integer DEFAULT 120,
  p_special_requests text DEFAULT NULL,
  p_table_ids uuid[] DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_company_id uuid;
  v_reservation_id uuid;
  v_reservation_number varchar(50);
  v_table_id uuid;
BEGIN
  -- Get company for current user
  SELECT company_id INTO v_company_id 
  FROM public.user_profiles WHERE id = auth.uid();
  
  -- Generate reservation number
  v_reservation_number := generate_reservation_number();
  
  -- Create reservation
  INSERT INTO public.reservations (
    company_id, reservation_number, customer_name, customer_phone, customer_email,
    party_size, reservation_date, reservation_time, duration_minutes,
    special_requests, created_by, status
  ) VALUES (
    v_company_id, v_reservation_number, p_customer_name, p_customer_phone, p_customer_email,
    p_party_size, p_reservation_date, p_reservation_time, p_duration_minutes,
    p_special_requests, auth.uid(), 'confirmed'
  ) RETURNING id INTO v_reservation_id;
  
  -- Assign tables if provided
  IF p_table_ids IS NOT NULL THEN
    FOREACH v_table_id IN ARRAY p_table_ids
    LOOP
      INSERT INTO public.reservation_tables (reservation_id, table_id)
      VALUES (v_reservation_id, v_table_id);
    END LOOP;
  END IF;
  
  -- Emit event
  PERFORM emit_domain_event(
    'reservation',
    v_reservation_id,
    'ReservationCreated',
    jsonb_build_object(
      'reservation_id', v_reservation_id,
      'reservation_number', v_reservation_number,
      'customer_name', p_customer_name,
      'party_size', p_party_size,
      'reservation_date', p_reservation_date,
      'reservation_time', p_reservation_time
    )
  );
  
  RETURN v_reservation_id;
END;
$$;

-- Check table availability
CREATE OR REPLACE FUNCTION check_table_availability(
  p_table_id uuid,
  p_date date,
  p_start_time time,
  p_duration_minutes integer DEFAULT 120
) RETURNS boolean LANGUAGE sql AS $$
  SELECT NOT EXISTS (
    SELECT 1 
    FROM public.reservations r
    JOIN public.reservation_tables rt ON r.id = rt.reservation_id
    WHERE rt.table_id = p_table_id
      AND r.reservation_date = p_date
      AND r.status IN ('confirmed', 'seated')
      AND (
        -- Check for time overlap
        (r.reservation_time, r.reservation_time + (r.duration_minutes || ' minutes')::interval) 
        OVERLAPS 
        (p_start_time, p_start_time + (p_duration_minutes || ' minutes')::interval)
      )
  );
$$;

-- Fulfillment slot management
CREATE OR REPLACE FUNCTION book_fulfillment_slot(
  p_order_id uuid,
  p_slot_id uuid,
  p_customer_name varchar(255),
  p_customer_phone varchar(50) DEFAULT NULL,
  p_delivery_address text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_fulfillment_id uuid;
  v_slot record;
BEGIN
  -- Get slot details and check availability
  SELECT * INTO v_slot
  FROM public.fulfillment_slots
  WHERE id = p_slot_id AND active = true AND current_bookings < max_capacity
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fulfillment slot not available';
  END IF;
  
  -- Create fulfillment record
  INSERT INTO public.order_fulfillments (
    order_id, fulfillment_slot_id, fulfillment_type,
    scheduled_time, estimated_ready,
    customer_name, customer_phone, delivery_address,
    status
  ) VALUES (
    p_order_id, p_slot_id, v_slot.slot_type,
    (v_slot.slot_date + v_slot.start_time)::timestamptz,
    (v_slot.slot_date + v_slot.start_time - (v_slot.preparation_time_minutes || ' minutes')::interval)::timestamptz,
    p_customer_name, p_customer_phone, p_delivery_address,
    'scheduled'
  ) RETURNING id INTO v_fulfillment_id;
  
  -- Update slot capacity
  UPDATE public.fulfillment_slots
  SET current_bookings = current_bookings + 1
  WHERE id = p_slot_id;
  
  RETURN v_fulfillment_id;
END;
$$;

-- RLS policies
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolated reservations" ON public.reservations FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolated reservation tables" ON public.reservation_tables FOR ALL TO authenticated
USING (reservation_id IN (
  SELECT r.id FROM public.reservations r
  JOIN public.user_profiles up ON r.company_id = up.company_id
  WHERE up.id = auth.uid()
));

CREATE POLICY "Tenant isolated fulfillment slots" ON public.fulfillment_slots FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolated order fulfillments" ON public.order_fulfillments FOR ALL TO authenticated
USING (order_id IN (
  SELECT o.id FROM public.orders o
  JOIN public.user_profiles up ON o.company_id = up.company_id
  WHERE up.id = auth.uid()
));
