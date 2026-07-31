ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UAH',
  ADD COLUMN IF NOT EXISTS receipt_url text;