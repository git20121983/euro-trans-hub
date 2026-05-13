
-- ============ 1. Extend orders ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS manager_id uuid,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_amount numeric,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS driver_advance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_international boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unloading_date date;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid','partially_paid','paid','overdue'));

CREATE INDEX IF NOT EXISTS idx_orders_manager_id ON public.orders(manager_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- ============ 2. Trigger: recompute VAT + payment_status ============
CREATE OR REPLACE FUNCTION public.orders_recompute_finance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ta numeric := COALESCE(NEW.total_amount, NEW.total_price, 0);
BEGIN
  -- VAT: 20% domestic, 0% international
  IF NEW.is_international THEN
    NEW.vat_amount := 0;
  ELSE
    NEW.vat_amount := ROUND(ta * 0.20 / 1.20, 2);
  END IF;

  -- Payment status (overdue is computed in view, не тут)
  IF ta > 0 AND NEW.paid_amount >= ta THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < ta THEN
    NEW.payment_status := 'partially_paid';
  ELSIF NEW.payment_status NOT IN ('overdue') THEN
    NEW.payment_status := 'unpaid';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_recompute_finance_trg ON public.orders;
CREATE TRIGGER orders_recompute_finance_trg
BEFORE INSERT OR UPDATE OF total_amount, paid_amount, is_international, total_price
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.orders_recompute_finance();

-- ============ 3. View: orders_finance ============
CREATE OR REPLACE VIEW public.orders_finance
WITH (security_invoker = true)
AS
SELECT
  o.*,
  COALESCE(o.total_amount, o.total_price, 0) - COALESCE(o.paid_amount, 0) AS debt,
  CASE
    WHEN COALESCE(o.total_amount, o.total_price, 0) - COALESCE(o.paid_amount, 0) > 0
         AND o.unloading_date IS NOT NULL
         AND o.unloading_date + INTERVAL '14 days' < now()
      THEN 'overdue'
    ELSE o.payment_status
  END AS effective_payment_status
FROM public.orders o;

-- ============ 4. Invoices ============
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','paid','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 5. Payments ============
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL DEFAULT 'bank' CHECK (method IN ('bank','cash','card','other')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============ 6. Update orders RLS ============
DROP POLICY IF EXISTS "Staff can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Accountants can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;

-- Admin: full access
CREATE POLICY "Admins can manage orders"
ON public.orders FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Manager: only own (manager_id = auth.uid())
CREATE POLICY "Managers can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager') AND manager_id = auth.uid());

CREATE POLICY "Managers can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager') AND manager_id = auth.uid());

CREATE POLICY "Managers can update own orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'manager') AND manager_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'manager') AND manager_id = auth.uid());

-- Accountant: read-only on all orders
CREATE POLICY "Accountants can view orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'accountant'));

-- ============ 7. RLS for invoices ============
CREATE POLICY "Admins manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'accountant'))
WITH CHECK (public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Managers view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager')
  AND order_id IN (SELECT id FROM public.orders WHERE manager_id = auth.uid())
);

-- ============ 8. RLS for payments ============
CREATE POLICY "Admins manage payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants manage payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'accountant'))
WITH CHECK (public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Managers view own payments"
ON public.payments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager')
  AND order_id IN (SELECT id FROM public.orders WHERE manager_id = auth.uid())
);
