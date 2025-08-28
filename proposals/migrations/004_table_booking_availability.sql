-- Table Booking Availability v1.0
-- Add online booking availability flags to tables and rooms

-- Add booking availability columns to tables
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS available_for_booking boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_buffer_minutes integer NOT NULL DEFAULT 15,
ADD COLUMN IF NOT EXISTS max_advance_booking_days integer NOT NULL DEFAULT 30;

-- Add room-level booking settings if rooms table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
    ALTER TABLE public.rooms 
    ADD COLUMN IF NOT EXISTS available_for_booking boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS booking_buffer_minutes integer NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS max_advance_booking_days integer NOT NULL DEFAULT 30;
  END IF;
END $$;

-- Create index for booking availability queries
CREATE INDEX IF NOT EXISTS idx_tables_booking_availability 
ON public.tables(tenant_id, available_for_booking, active)
WHERE available_for_booking = true AND active = true;

-- Function to get bookable tables for a location
CREATE OR REPLACE FUNCTION public.get_bookable_tables(
  p_tenant_id uuid,
  p_location_id uuid DEFAULT NULL
) RETURNS TABLE (
  table_id uuid,
  table_name varchar,
  capacity integer,
  location varchar,
  available_for_booking boolean,
  booking_buffer_minutes integer
) LANGUAGE sql AS $$
  SELECT 
    t.id as table_id,
    t.name as table_name,
    t.capacity,
    COALESCE(t.location, 'Main') as location,
    t.available_for_booking,
    t.booking_buffer_minutes
  FROM public.tables t
  WHERE t.tenant_id = p_tenant_id
    AND (p_location_id IS NULL OR t.location_id = p_location_id)
    AND t.available_for_booking = true
    AND t.active = true
  ORDER BY t.capacity, t.name;
$$;

-- Function to update table booking availability
CREATE OR REPLACE FUNCTION public.update_table_booking_availability(
  p_table_id uuid,
  p_available_for_booking boolean,
  p_booking_buffer_minutes integer DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.tables 
  SET 
    available_for_booking = p_available_for_booking,
    booking_buffer_minutes = COALESCE(p_booking_buffer_minutes, booking_buffer_minutes)
  WHERE id = p_table_id;
  
  -- Log the change
  INSERT INTO public.user_activity_logs (
    user_id,
    action,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'table_booking_availability_changed',
    jsonb_build_object(
      'table_id', p_table_id,
      'available_for_booking', p_available_for_booking,
      'booking_buffer_minutes', p_booking_buffer_minutes
    ),
    inet_client_addr()
  );
END;
$$;

-- Function to check if table can accept bookings for a given time
CREATE OR REPLACE FUNCTION public.can_table_accept_booking(
  p_table_id uuid,
  p_requested_time timestamptz
) RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.tables t
    WHERE t.id = p_table_id
      AND t.available_for_booking = true
      AND t.active = true
      AND p_requested_time >= (now() + (t.booking_buffer_minutes || ' minutes')::interval)
      AND p_requested_time <= (now() + (t.max_advance_booking_days || ' days')::interval)
  );
$$;

-- View for table booking status
CREATE OR REPLACE VIEW public.table_booking_status AS
SELECT 
  t.id as table_id,
  t.name as table_name,
  t.capacity,
  t.location,
  t.available_for_booking,
  t.booking_buffer_minutes,
  t.max_advance_booking_days,
  CASE 
    WHEN NOT t.available_for_booking THEN 'disabled'
    WHEN EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.reservation_tables rt ON r.id = rt.reservation_id
      WHERE rt.table_id = t.id
        AND r.status IN ('confirmed', 'seated')
        AND r.time_range @> now()::timestamptz
    ) THEN 'reserved'
    WHEN EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.table_id = t.id
        AND o.status IN ('pending', 'preparing', 'ready')
    ) THEN 'occupied'
    ELSE 'available'
  END as current_status,
  (
    SELECT COUNT(*)
    FROM public.reservations r
    JOIN public.reservation_tables rt ON r.id = rt.reservation_id
    WHERE rt.table_id = t.id
      AND r.status IN ('confirmed', 'seated')
      AND r.reservation_date = CURRENT_DATE
  ) as todays_reservations
FROM public.tables t
WHERE t.active = true;

-- Sample data for testing (optional - remove in production)
-- UPDATE public.tables SET available_for_booking = true WHERE tenant_id IS NOT NULL;


