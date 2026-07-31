CREATE POLICY "Drivers upload own receipts" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'expense-receipts' AND (
  EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid())
  OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'accountant')
));

CREATE POLICY "Staff and drivers read receipts" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'expense-receipts' AND (
  EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid())
  OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'accountant')
));

CREATE POLICY "Staff delete receipts" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'expense-receipts' AND (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'accountant')
));