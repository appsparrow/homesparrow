-- Add youtube_link column to homes table
ALTER TABLE homes ADD COLUMN youtube_link TEXT;

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Users can view their own homes" ON homes;
DROP POLICY IF EXISTS "Users can update their own homes" ON homes;

CREATE POLICY "Users can view their own homes"
ON homes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own homes"
ON homes FOR UPDATE
TO authenticated
USING (user_id = auth.uid()); 