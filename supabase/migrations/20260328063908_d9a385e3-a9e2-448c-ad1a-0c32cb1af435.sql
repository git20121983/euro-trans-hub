CREATE POLICY "Drivers can insert own profile"
ON public.drivers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());