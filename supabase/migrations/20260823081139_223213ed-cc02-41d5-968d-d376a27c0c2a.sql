ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS price numeric,
  ALTER COLUMN client_name SET DEFAULT 'Telegram Bot',
  ALTER COLUMN origin SET DEFAULT '',
  ALTER COLUMN destination SET DEFAULT '',
  ALTER COLUMN distance SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.orders_normalize_intake()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  parts text[];
  src text;
BEGIN
  -- Parse "Одеса - Київ" style route into origin/destination
  src := COALESCE(NULLIF(TRIM(NEW.route), ''), NEW.origin);
  IF src IS NOT NULL AND (NEW.destination IS NULL OR TRIM(NEW.destination) = '') THEN
    parts := regexp_split_to_array(src, '\s*(?:->|-->|—|–|→|-|/)\s*');
    IF array_length(parts, 1) >= 2 THEN
      IF NEW.origin IS NULL OR TRIM(NEW.origin) = '' OR NEW.origin = src THEN
        NEW.origin := TRIM(parts[1]);
      END IF;
      NEW.destination := TRIM(parts[array_length(parts, 1)]);
    END IF;
  END IF;

  IF NEW.origin IS NULL THEN NEW.origin := ''; END IF;
  IF NEW.destination IS NULL THEN NEW.destination := ''; END IF;
  IF NEW.cargo_type IS NULL OR TRIM(NEW.cargo_type) = '' THEN NEW.cargo_type := 'standard'; END IF;

  -- price (from Make "freight") feeds the financial fields
  IF NEW.price IS NOT NULL THEN
    IF NEW.total_price IS NULL THEN NEW.total_price := NEW.price; END IF;
    IF NEW.total_amount IS NULL THEN NEW.total_amount := NEW.price; END IF;
    IF NEW.freight_price_original IS NULL THEN NEW.freight_price_original := NEW.price; END IF;
  ELSIF NEW.total_price IS NOT NULL THEN
    NEW.price := NEW.total_price;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_normalize_intake_trg ON public.orders;
CREATE TRIGGER orders_normalize_intake_trg
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_normalize_intake();