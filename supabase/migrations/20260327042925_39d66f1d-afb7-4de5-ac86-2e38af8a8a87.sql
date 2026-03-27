-- Create storage bucket for order documents (TTN, CMR, photos)
INSERT INTO storage.buckets (id, name, public) VALUES ('order-documents', 'order-documents', true);

-- RLS for order-documents bucket: authenticated users can upload
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-documents');

-- Anyone can view documents (public bucket)
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-documents');

-- Admins and drivers can delete documents
CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'order-documents');