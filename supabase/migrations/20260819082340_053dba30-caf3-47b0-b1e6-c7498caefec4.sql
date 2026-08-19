CREATE POLICY "Authenticated can upload CMR" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cmr-documents');
CREATE POLICY "Authenticated can read CMR" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cmr-documents');
CREATE POLICY "Authenticated can update CMR" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cmr-documents');