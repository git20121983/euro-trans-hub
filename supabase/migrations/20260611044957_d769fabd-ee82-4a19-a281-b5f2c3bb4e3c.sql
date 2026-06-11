-- 1) Allowance field on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS allowance_amount numeric NOT NULL DEFAULT 0;

-- 2) Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_order_id_idx ON public.expenses(order_id);
CREATE INDEX IF NOT EXISTS expenses_driver_id_idx ON public.expenses(driver_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Driver: own trip expenses
CREATE POLICY "Drivers can view own trip expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = expenses.driver_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can insert own trip expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = expenses.driver_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update own trip expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = expenses.driver_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can delete own trip expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = expenses.driver_id AND d.user_id = auth.uid()
  )
);

-- Staff: full access
CREATE POLICY "Staff can manage all expenses"
ON public.expenses FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'accountant')
  OR public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'accountant')
  OR public.has_role(auth.uid(), 'manager')
);

-- updated_at trigger
DROP TRIGGER IF EXISTS expenses_set_updated_at ON public.expenses;
CREATE TRIGGER expenses_set_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;