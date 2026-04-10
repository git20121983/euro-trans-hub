ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['new', 'planning', 'in_transit', 'customs', 'unloading', 'awaiting_payment', 'completed', 'cancelled']));