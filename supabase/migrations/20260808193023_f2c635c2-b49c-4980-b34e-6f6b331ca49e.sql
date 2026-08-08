ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS loading_arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS loading_finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS unloading_arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS unloading_finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS free_hours numeric NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS demurrage_rate numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS demurrage_currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS demurrage_hours numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS demurrage_amount numeric NOT NULL DEFAULT 0;