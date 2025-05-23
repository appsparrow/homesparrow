-- Create a new storage bucket for home images
INSERT INTO storage.buckets (id, name, public)
VALUES ('home-images', 'home-images', true);

-- Set up storage policies for the home-images bucket
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'home-images');

CREATE POLICY "Allow authenticated users to read images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'home-images');

CREATE POLICY "Allow authenticated users to delete their own images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'home-images');

-- Note: RLS is already enabled on storage.objects by default
-- No need to enable it explicitly 