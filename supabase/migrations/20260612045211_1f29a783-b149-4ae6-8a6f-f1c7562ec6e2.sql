
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS trip_date date,
  ADD COLUMN IF NOT EXISTS route text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UAH',
  ADD COLUMN IF NOT EXISTS freight_price_original numeric,
  ADD COLUMN IF NOT EXISTS freight_price_uah numeric,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric,
  ADD COLUMN IF NOT EXISTS payment_date date;

-- Currency check
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_currency_check') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_currency_check CHECK (currency IN ('UAH','EUR','USD'));
  END IF;
END $$;

-- Auto-fill route, freight_price_uah, trip_date defaults
CREATE OR REPLACE FUNCTION public.orders_sync_sheet_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.route IS NULL OR NEW.route = '' THEN
    NEW.route := COALESCE(NEW.origin,'') || ' → ' || COALESCE(NEW.destination,'');
  END IF;

  IF NEW.trip_date IS NULL THEN
    NEW.trip_date := COALESCE(NEW.unloading_date, (NEW.created_at)::date, CURRENT_DATE);
  END IF;

  IF NEW.freight_price_uah IS NULL AND NEW.freight_price_original IS NOT NULL THEN
    IF NEW.currency = 'UAH' THEN
      NEW.freight_price_uah := NEW.freight_price_original;
    ELSIF NEW.exchange_rate IS NOT NULL THEN
      NEW.freight_price_uah := ROUND(NEW.freight_price_original * NEW.exchange_rate, 2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_sheet_fields_trg ON public.orders;
CREATE TRIGGER orders_sync_sheet_fields_trg
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_sync_sheet_fields();
