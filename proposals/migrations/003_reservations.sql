-- Reservations System v1.0
-- Complete table booking and reservation management with time conflict prevention

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL, -- References companies(id)
  location_id uuid, -- Optional location
  reservation_number varchar(50) UNIQUE NOT NULL,
  
  -- Customer information
  customer_name varchar(255) NOT NULL,
  customer_phone varchar(50),
  customer_email varchar(255),
  customer_notes text,
  
  -- Reservation details
  party_size integer NOT NULL CHECK (party_size > 0 AND party_size <= 50),
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 120 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  
  -- Time range for efficient conflict detection
  time_range tstzrange GENERATED ALWAYS AS (
    tstzrange(
      (reservation_date + reservation_time)::timestamptz,
      (reservation_date + reservation_time + (duration_minutes || ' minutes')::interval)::timestamptz,
      '[)'
    )
  ) STORED,
  
  -- Status management
  status varchar(20) NOT NULL DEFAULT 'confirmed' 
    CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  
  -- Special requirements
  special_requests text,
  dietary_restrictions text,
  accessibility_needs text,
  
  -- Tracking
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, -- References auth.users(id)
  confirmed_at timestamptz,
  seated_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  
  -- Metadata
  source varchar(50) DEFAULT 'manual', -- 'online', 'phone', 'walk_in'
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Junction table for reservation-table assignments
CREATE TABLE IF NOT EXISTS public.reservation_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  table_id uuid NOT NULL, -- References tables(id)
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid, -- References auth.users(id)
  
  UNIQUE(reservation_id, table_id)
);

-- Indexes for performance and conflict detection
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_date_time 
ON public.reservations(tenant_id, reservation_date, reservation_time);

CREATE INDEX IF NOT EXISTS idx_reservations_status_date 
ON public.reservations(status, reservation_date) 
WHERE status IN ('confirmed', 'seated');

CREATE INDEX IF NOT EXISTS idx_reservations_customer_phone 
ON public.reservations(customer_phone) 
WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_customer_email 
ON public.reservations(customer_email) 
WHERE customer_email IS NOT NULL;

-- GiST index for efficient time range overlap queries
CREATE INDEX IF NOT EXISTS idx_reservations_time_range_gist 
ON public.reservations USING gist(tenant_id, time_range);

CREATE INDEX IF NOT EXISTS idx_reservation_tables_reservation 
ON public.reservation_tables(reservation_id);

CREATE INDEX IF NOT EXISTS idx_reservation_tables_table_time 
ON public.reservation_tables(table_id, assigned_at);

-- Function to generate reservation numbers
CREATE OR REPLACE FUNCTION public.generate_reservation_number(p_tenant_id uuid)
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
  WHERE r.tenant_id = p_tenant_id
    AND r.reservation_number LIKE 'RES-' || today_date || '-%';
  
  new_reservation_number := 'RES-' || today_date || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_reservation_number;
END;
$$;

-- Function to check table availability for a time range
CREATE OR REPLACE FUNCTION public.check_table_availability(
  p_tenant_id uuid,
  p_table_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_reservation_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE sql AS $$
  SELECT NOT EXISTS (
    SELECT 1 
    FROM public.reservations r
    JOIN public.reservation_tables rt ON r.id = rt.reservation_id
    WHERE r.tenant_id = p_tenant_id
      AND rt.table_id = p_table_id
      AND r.status IN ('confirmed', 'seated')
      AND r.time_range && tstzrange(p_start_time, p_end_time, '[)')
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
  );
$$;

-- Function to find available tables for a time slot
CREATE OR REPLACE FUNCTION public.find_available_tables(
  p_tenant_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_party_size integer,
  p_location_id uuid DEFAULT NULL
) RETURNS TABLE (
  table_id uuid,
  table_name varchar,
  capacity integer,
  location varchar
) LANGUAGE sql AS $$
  SELECT 
    t.id as table_id,
    t.name as table_name,
    t.capacity,
    t.location
  FROM public.tables t
  WHERE t.tenant_id = p_tenant_id
    AND (p_location_id IS NULL OR t.location_id = p_location_id)
    AND t.capacity >= p_party_size
    AND t.active = true
    AND NOT EXISTS (
      SELECT 1 
      FROM public.reservations r
      JOIN public.reservation_tables rt ON r.id = rt.reservation_id
      WHERE rt.table_id = t.id
        AND r.tenant_id = p_tenant_id
        AND r.status IN ('confirmed', 'seated')
        AND r.time_range && tstzrange(p_start_time, p_end_time, '[)')
    )
  ORDER BY t.capacity, t.name;
$$;

-- Function to create a reservation with automatic table assignment
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_tenant_id uuid,
  p_customer_name varchar(255),
  p_customer_phone varchar(50),
  p_customer_email varchar(255),
  p_party_size integer,
  p_reservation_date date,
  p_reservation_time time,
  p_duration_minutes integer DEFAULT 120,
  p_special_requests text DEFAULT NULL,
  p_table_ids uuid[] DEFAULT NULL,
  p_location_id uuid DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_reservation_id uuid;
  v_reservation_number varchar(50);
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_table_id uuid;
  v_available_tables uuid[];
BEGIN
  -- Generate reservation number
  v_reservation_number := generate_reservation_number(p_tenant_id);
  
  -- Calculate time range
  v_start_time := (p_reservation_date + p_reservation_time)::timestamptz;
  v_end_time := v_start_time + (p_duration_minutes || ' minutes')::interval;
  
  -- Validate reservation time is in the future
  IF v_start_time <= now() THEN
    RAISE EXCEPTION 'Reservation time must be in the future';
  END IF;
  
  -- Create reservation
  INSERT INTO public.reservations (
    tenant_id,
    location_id,
    reservation_number,
    customer_name,
    customer_phone,
    customer_email,
    party_size,
    reservation_date,
    reservation_time,
    duration_minutes,
    special_requests,
    created_by,
    status,
    confirmed_at
  ) VALUES (
    p_tenant_id,
    p_location_id,
    v_reservation_number,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_party_size,
    p_reservation_date,
    p_reservation_time,
    p_duration_minutes,
    p_special_requests,
    p_created_by,
    'confirmed',
    now()
  ) RETURNING id INTO v_reservation_id;
  
  -- Assign tables
  IF p_table_ids IS NOT NULL THEN
    -- Use specified tables (check availability first)
    FOREACH v_table_id IN ARRAY p_table_ids
    LOOP
      IF NOT check_table_availability(p_tenant_id, v_table_id, v_start_time, v_end_time) THEN
        RAISE EXCEPTION 'Table % is not available for the requested time', v_table_id;
      END IF;
      
      INSERT INTO public.reservation_tables (reservation_id, table_id, assigned_by)
      VALUES (v_reservation_id, v_table_id, p_created_by);
    END LOOP;
  ELSE
    -- Auto-assign suitable tables
    SELECT ARRAY_AGG(table_id) INTO v_available_tables
    FROM find_available_tables(p_tenant_id, v_start_time, v_end_time, p_party_size, p_location_id)
    LIMIT 3; -- Maximum 3 tables per reservation
    
    IF v_available_tables IS NULL OR array_length(v_available_tables, 1) = 0 THEN
      RAISE EXCEPTION 'No suitable tables available for party size % at requested time', p_party_size;
    END IF;
    
    -- Assign the first suitable table
    INSERT INTO public.reservation_tables (reservation_id, table_id, assigned_by)
    VALUES (v_reservation_id, v_available_tables[1], p_created_by);
  END IF;
  
  -- Emit domain event
  PERFORM emit_domain_event(
    p_tenant_id,
    'reservation',
    v_reservation_id,
    'ReservationCreated',
    jsonb_build_object(
      'reservation_id', v_reservation_id,
      'reservation_number', v_reservation_number,
      'customer_name', p_customer_name,
      'party_size', p_party_size,
      'reservation_date', p_reservation_date,
      'reservation_time', p_reservation_time,
      'duration_minutes', p_duration_minutes
    )
  );
  
  RETURN v_reservation_id;
END;
$$;

-- Function to update reservation status
CREATE OR REPLACE FUNCTION public.update_reservation_status(
  p_reservation_id uuid,
  p_status varchar(20),
  p_notes text DEFAULT NULL,
  p_updated_by uuid DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_old_status varchar(20);
  v_tenant_id uuid;
BEGIN
  -- Get current status and tenant
  SELECT status, tenant_id INTO v_old_status, v_tenant_id
  FROM public.reservations
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;
  
  -- Update reservation
  UPDATE public.reservations 
  SET 
    status = p_status,
    updated_at = now(),
    seated_at = CASE WHEN p_status = 'seated' AND seated_at IS NULL THEN now() ELSE seated_at END,
    completed_at = CASE WHEN p_status = 'completed' AND completed_at IS NULL THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_status = 'cancelled' AND cancelled_at IS NULL THEN now() ELSE cancelled_at END
  WHERE id = p_reservation_id;
  
  -- Emit status change event
  IF v_old_status != p_status THEN
    PERFORM emit_domain_event(
      v_tenant_id,
      'reservation',
      p_reservation_id,
      'ReservationStatusChanged',
      jsonb_build_object(
        'reservation_id', p_reservation_id,
        'old_status', v_old_status,
        'new_status', p_status,
        'notes', p_notes,
        'updated_by', p_updated_by
      )
    );
  END IF;
END;
$$;

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_reservation_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;
CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reservation_updated_at();

-- View for reservation details with table information
CREATE OR REPLACE VIEW public.reservation_details AS
SELECT 
  r.*,
  array_agg(
    jsonb_build_object(
      'table_id', rt.table_id,
      'assigned_at', rt.assigned_at
    )
  ) FILTER (WHERE rt.table_id IS NOT NULL) as assigned_tables
FROM public.reservations r
LEFT JOIN public.reservation_tables rt ON r.id = rt.reservation_id
GROUP BY r.id;







