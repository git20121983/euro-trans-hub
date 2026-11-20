CREATE POLICY "Only admins can close or reopen orders"
ON public.orders
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  status <> 'completed' OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  status <> 'completed' OR public.has_role(auth.uid(), 'admin')
);

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT full_name INTO v_actor_name
    FROM public.profiles
    WHERE user_id = auth.uid();

    INSERT INTO public.order_events (order_id, user_id, event_type, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      CASE
        WHEN NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed'
          THEN 'Рейс закрито'
        WHEN OLD.status = 'completed' AND NEW.status IS DISTINCT FROM 'completed'
          THEN 'Рейс відкрито знову'
        ELSE 'Статус змінено: ' || COALESCE(OLD.status, 'none') || ' → ' || NEW.status
      END,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'actor_name', v_actor_name
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;