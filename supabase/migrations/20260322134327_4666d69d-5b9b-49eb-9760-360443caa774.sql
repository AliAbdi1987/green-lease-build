INSERT INTO storage.buckets (id, name, public)
VALUES ('salvage-photos', 'salvage-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload salvage photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'salvage-photos');

CREATE POLICY "Anyone can read salvage photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'salvage-photos');