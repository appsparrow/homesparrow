-- Create enum for home status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE home_status AS ENUM (
      'New',
      'Contacted',
      'Seen',
      'Liked',
      'Disliked',
      'Offer Made',
      'Accepted',
      'Rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to homes table
ALTER TABLE homes 
  ADD COLUMN IF NOT EXISTS asking_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS current_status home_status DEFAULT 'New',
  ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create status updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS status_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  status home_status NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  agent_name TEXT,
  offer_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS home_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status home_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update home's last_status_update
CREATE OR REPLACE FUNCTION update_home_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE homes
  SET current_status = NEW.status,
      last_status_update = NEW.date
  WHERE id = NEW.home_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_home_status_trigger ON status_updates;
CREATE TRIGGER update_home_status_trigger
AFTER INSERT ON status_updates
FOR EACH ROW
EXECUTE FUNCTION update_home_status();

-- Enable RLS on new tables
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON status_updates;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON home_notes;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create policies for authenticated users on new tables
CREATE POLICY "Enable all access for authenticated users" ON status_updates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON home_notes
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_homes_current_status ON homes(current_status);
CREATE INDEX IF NOT EXISTS idx_status_updates_home_id ON status_updates(home_id);
CREATE INDEX IF NOT EXISTS idx_home_notes_home_id ON home_notes(home_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_date ON status_updates(date);
CREATE INDEX IF NOT EXISTS idx_home_notes_date ON home_notes(date);

-- Update existing homes with default status if current_status is null
UPDATE homes 
SET current_status = 'New' 
WHERE current_status IS NULL; 