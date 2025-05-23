-- Create home_images table
CREATE TABLE IF NOT EXISTS home_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE home_images ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON home_images
  FOR ALL USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_home_images_home_id ON home_images(home_id);

-- Function to ensure only one primary image per home
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE home_images
    SET is_primary = false
    WHERE home_id = NEW.home_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary image management
CREATE TRIGGER ensure_single_primary_image_trigger
BEFORE INSERT OR UPDATE ON home_images
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_image(); 