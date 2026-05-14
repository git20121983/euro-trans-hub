
-- 1. Add columns to drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS license_front_url text,
  ADD COLUMN IF NOT EXISTS license_back_url text,
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS details_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- 2. Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-docs', 'driver-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies
DROP POLICY IF EXISTS "Drivers upload own docs" ON storage.objects;
CREATE POLICY "Drivers upload own docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-docs'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Drivers update own docs" ON storage.objects;
CREATE POLICY "Drivers update own docs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-docs'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Drivers view own docs" ON storage.objects;
CREATE POLICY "Drivers view own docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-docs'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.drivers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Staff view all driver docs" ON storage.objects;
CREATE POLICY "Staff view all driver docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-docs'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
);

-- 4. Auto-link driver to user account by phone on profile creation
CREATE OR REPLACE FUNCTION public.link_driver_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 3 THEN
    UPDATE public.drivers
    SET user_id = NEW.user_id
    WHERE phone = NEW.phone AND user_id IS NULL;

    -- Grant driver role if matched
    IF FOUND THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'driver')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_link_driver ON public.profiles;
CREATE TRIGGER profiles_link_driver
AFTER INSERT OR UPDATE OF phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.link_driver_to_user();

-- 5. Update handle_new_user to also write phone into profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
