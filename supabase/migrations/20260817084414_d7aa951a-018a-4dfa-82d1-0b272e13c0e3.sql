ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loading_free_hours numeric,
  ADD COLUMN IF NOT EXISTS loading_demurrage_rate numeric,
  ADD COLUMN IF NOT EXISTS unloading_free_hours numeric,
  ADD COLUMN IF NOT EXISTS unloading_demurrage_rate numeric;