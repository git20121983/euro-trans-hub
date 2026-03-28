
CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'status_change',
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage order events"
ON public.order_events FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Drivers can view events for assigned orders"
ON public.order_events FOR SELECT
USING (order_id IN (
  SELECT o.id FROM public.orders o
  JOIN public.drivers d ON o.driver_id = d.id
  WHERE d.user_id = auth.uid()
));

CREATE POLICY "Drivers can insert events for assigned orders"
ON public.order_events FOR INSERT
WITH CHECK (order_id IN (
  SELECT o.id FROM public.orders o
  JOIN public.drivers d ON o.driver_id = d.id
  WHERE d.user_id = auth.uid()
));

CREATE POLICY "Clients can view events for own orders"
ON public.order_events FOR SELECT
USING (order_id IN (
  SELECT id FROM public.orders WHERE client_user_id = auth.uid()
));

-- Auto-log status changes via trigger
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_events (order_id, event_type, description, metadata)
    VALUES (
      NEW.id,
      'status_change',
      'Статус змінено: ' || COALESCE(OLD.status, 'none') || ' → ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();
