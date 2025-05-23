-- Create enum for home status
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

-- Homes table
CREATE TABLE homes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  zillow_url TEXT NOT NULL,
  asking_price DECIMAL(10,2) NOT NULL,
  agent_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_status home_status DEFAULT 'New',
  last_status_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Status updates table (for tracking status history)
CREATE TABLE status_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  status home_status NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  agent_name TEXT,
  offer_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table (for general notes)
CREATE TABLE home_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status home_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Home checklist table
CREATE TABLE home_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE UNIQUE,
  three_bed BOOLEAN DEFAULT false,
  two_bath BOOLEAN DEFAULT false,
  under_200k BOOLEAN DEFAULT false,
  no_basement BOOLEAN DEFAULT false,
  no_trees_back BOOLEAN DEFAULT false,
  brick BOOLEAN DEFAULT false,
  updated BOOLEAN DEFAULT false,
  ranch BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Trigger to update home status
CREATE TRIGGER update_home_status_trigger
AFTER INSERT ON status_updates
FOR EACH ROW
EXECUTE FUNCTION update_home_status();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to home_checklists table
CREATE TRIGGER update_home_checklists_updated_at
  BEFORE UPDATE ON home_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_checklists ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON homes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON status_updates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON home_notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON home_checklists
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_homes_current_status ON homes(current_status);
CREATE INDEX idx_status_updates_home_id ON status_updates(home_id);
CREATE INDEX idx_home_notes_home_id ON home_notes(home_id);
CREATE INDEX idx_status_updates_date ON status_updates(date);
CREATE INDEX idx_home_notes_date ON home_notes(date);

-- Sample data (optional)
INSERT INTO homes (address, zillow_url) VALUES 
('123 Main St, Anytown, USA', 'https://www.zillow.com/homedetails/123-main-st'),
('456 Oak Ave, Somewhere, USA', 'https://www.zillow.com/homedetails/456-oak-ave');

-- Create corresponding checklists
INSERT INTO home_checklists (home_id, three_bed, two_bath) 
SELECT id, true, true FROM homes WHERE address = '123 Main St, Anytown, USA';

INSERT INTO home_checklists (home_id, three_bed, no_basement, brick) 
SELECT id, true, true, true FROM homes WHERE address = '456 Oak Ave, Somewhere, USA'; 