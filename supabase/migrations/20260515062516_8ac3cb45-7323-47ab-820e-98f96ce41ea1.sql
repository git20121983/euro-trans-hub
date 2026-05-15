-- Add new columns to drivers
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS tacho_card_url text,
  ADD COLUMN IF NOT EXISTS tacho_expiry date,
  ADD COLUMN IF NOT EXISTS adr_certified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adr_certificate_url text,
  ADD COLUMN IF NOT EXISTS intl_passport_url text,
  ADD COLUMN IF NOT EXISTS intl_passport_expiry date;

-- Create public bucket for driver avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-avatars', 'driver-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Driver avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'driver-avatars');

-- Driver manages own folder (folder = drivers.id, matched via user_id)
CREATE POLICY "Drivers can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driver-avatars'
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Drivers can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'driver-avatars'
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Drivers can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'driver-avatars'
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.user_id = auth.uid()
      AND d.id::text = (storage.foldername(name))[1]
  )
);

-- Admins/managers full access
CREATE POLICY "Staff can manage driver avatars"
ON storage.objects FOR ALL
USING (
  bucket_id = 'driver-avatars'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
)
WITH CHECK (
  bucket_id = 'driver-avatars'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);
