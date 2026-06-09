ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_status_check;
ALTER TABLE public.drivers ADD CONSTRAINT drivers_status_check
  CHECK (status = ANY (ARRAY['available','loading','in_transit','customs','on_trip','day_off','sick_leave','pending_details','on_verification']));