ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cmr_document_url text,
  ADD COLUMN IF NOT EXISTS cmr_stamp_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cmr_signature_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cmr_quality text,
  ADD COLUMN IF NOT EXISTS cmr_notes text,
  ADD COLUMN IF NOT EXISTS cmr_verified_at timestamptz;