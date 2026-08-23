ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS freight numeric;

CREATE OR REPLACE FUNCTION public.orders_normalize_intake()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  parts text[];
  src text;
BEGIN
  -- Aliases coming straight from the Make "Parse JSON" payload
  IF NEW.cargo IS NOT NULL AND TRIM(NEW.cargo) <> '' AND (NEW.cargo_type IS NULL OR NEW.cargo_type IN ('', 'standard')) THEN
    NEW.cargo_type := NEW.cargo;
  ELSIF NEW.cargo IS NULL THEN
    NEW.cargo := NEW.cargo_type;
  END IF;

  IF NEW.freight IS NOT NULL AND NEW.price IS NULL THEN
    NEW.price := NEW.freight;
  ELSIF NEW.freight IS NULL THEN
    NEW.freight := NEW.price;
  END IF;

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

  IF NEW.price IS NOT NULL THEN
    IF NEW.total_price IS NULL THEN NEW.total_price := NEW.price; END IF;
    IF NEW.total_amount IS NULL THEN NEW.total_amount := NEW.price; END IF;
    IF NEW.freight_price_original IS NULL THEN NEW.freight_price_original := NEW.price; END IF;
  ELSIF NEW.total_price IS NOT NULL THEN
    NEW.price := NEW.total_price;
    NEW.freight := NEW.total_price;
  END IF;

  RETURN NEW;
END;
$$;