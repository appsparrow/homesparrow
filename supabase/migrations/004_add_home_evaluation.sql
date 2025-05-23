-- Check and add user_id column to homes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'homes' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE homes ADD COLUMN user_id UUID REFERENCES auth.users(id);
        -- Update existing rows to use the current user
        UPDATE homes SET user_id = auth.uid();
        -- Make user_id required for future rows
        ALTER TABLE homes ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Enable RLS on homes table if not already enabled
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own homes" ON homes;
    DROP POLICY IF EXISTS "Users can insert their own homes" ON homes;
    DROP POLICY IF EXISTS "Users can update their own homes" ON homes;
    DROP POLICY IF EXISTS "Users can delete their own homes" ON homes;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create policies for homes table
CREATE POLICY "Users can view their own homes"
ON homes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own homes"
ON homes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own homes"
ON homes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own homes"
ON homes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create enum types for various conditions
CREATE TYPE condition_status AS ENUM ('Good', 'Fair', 'Poor');
CREATE TYPE hvac_type AS ENUM ('Central', 'Window', 'Mini-Split', 'None');
CREATE TYPE heating_type AS ENUM ('Gas', 'Electric');
CREATE TYPE hot_water_test AS ENUM ('Instant', 'Delay', 'None');
CREATE TYPE lights_working AS ENUM ('All', 'Some', 'None');
CREATE TYPE flooring_type AS ENUM ('Hardwood', 'Carpet', 'Tile', 'Laminate');
CREATE TYPE egress_type AS ENUM ('Window', 'Door');

-- Create table for basic systems evaluation
CREATE TABLE home_basic_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
    roof_year TEXT,
    paint_condition condition_status DEFAULT 'Good',
    hvac_type hvac_type DEFAULT 'None',
    hvac_year TEXT,
    ac_unit_year_month TEXT,
    heating_type heating_type DEFAULT 'Electric',
    water_heater_present BOOLEAN DEFAULT false,
    water_heater_year TEXT,
    hot_water_test hot_water_test DEFAULT 'None',
    plumbing_condition condition_status DEFAULT 'Good',
    electrical_panel_updated BOOLEAN DEFAULT false,
    gfci_present BOOLEAN DEFAULT false,
    outlets_grounded BOOLEAN DEFAULT false,
    lights_working lights_working DEFAULT 'All',
    smoke_alarms_installed BOOLEAN DEFAULT false,
    smoke_alarms_working BOOLEAN DEFAULT false,
    co_detectors_installed BOOLEAN DEFAULT false,
    co_detectors_working BOOLEAN DEFAULT false,
    fire_extinguisher_present BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for structure evaluation
CREATE TABLE home_structure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
    foundation_cracks BOOLEAN DEFAULT false,
    crawl_space_accessible BOOLEAN DEFAULT false,
    vapor_barrier_present BOOLEAN DEFAULT false,
    attic_insulation_present BOOLEAN DEFAULT false,
    double_glazed_windows BOOLEAN DEFAULT false,
    doors_locking_properly BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for interior features
CREATE TABLE home_interior (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
    flooring_type flooring_type DEFAULT 'Carpet',
    hardwood_condition condition_status DEFAULT 'Good',
    ceiling_issues BOOLEAN DEFAULT false,
    cabinet_condition condition_status DEFAULT 'Good',
    appliances_present TEXT[] DEFAULT '{}',
    fixtures_operational BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for bedroom evaluation
CREATE TABLE home_bedrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
    bedroom_name TEXT NOT NULL,
    adequate_size BOOLEAN DEFAULT false,
    closet_present BOOLEAN DEFAULT false,
    entry_door_present BOOLEAN DEFAULT false,
    egress_present BOOLEAN DEFAULT false,
    egress_type egress_type DEFAULT 'Window',
    window_size_meets_code BOOLEAN DEFAULT false,
    window_sill_height_ok BOOLEAN DEFAULT false,
    smoke_detector_present BOOLEAN DEFAULT false,
    co_detector_present BOOLEAN DEFAULT false,
    gas_appliance_present BOOLEAN DEFAULT false,
    accessed_through_another BOOLEAN DEFAULT false,
    connects_to_garage BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for site vicinity evaluation
CREATE TABLE home_site_vicinity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
    adjacent_dilapidated BOOLEAN DEFAULT false,
    vacant_units_next_door BOOLEAN DEFAULT false,
    fire_damage_nearby BOOLEAN DEFAULT false,
    trash_dumping_present BOOLEAN DEFAULT false,
    illegal_repairs_nearby BOOLEAN DEFAULT false,
    excessive_noise BOOLEAN DEFAULT false,
    graffiti_present BOOLEAN DEFAULT false,
    isolated_location BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_home_basic_systems_home_id ON home_basic_systems(home_id);
CREATE INDEX idx_home_structure_home_id ON home_structure(home_id);
CREATE INDEX idx_home_interior_home_id ON home_interior(home_id);
CREATE INDEX idx_home_bedrooms_home_id ON home_bedrooms(home_id);
CREATE INDEX idx_home_site_vicinity_home_id ON home_site_vicinity(home_id);

-- Enable Row Level Security
ALTER TABLE home_basic_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_interior ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_bedrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_site_vicinity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own home evaluations"
ON home_basic_systems FOR SELECT
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own home evaluations"
ON home_basic_systems FOR INSERT
TO authenticated
WITH CHECK (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own home evaluations"
ON home_basic_systems FOR UPDATE
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

-- Repeat similar policies for other tables
CREATE POLICY "Users can view their own home structure"
ON home_structure FOR SELECT
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own home structure"
ON home_structure FOR INSERT
TO authenticated
WITH CHECK (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own home structure"
ON home_structure FOR UPDATE
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

-- Interior policies
CREATE POLICY "Users can view their own home interior"
ON home_interior FOR SELECT
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own home interior"
ON home_interior FOR INSERT
TO authenticated
WITH CHECK (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own home interior"
ON home_interior FOR UPDATE
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

-- Bedroom policies
CREATE POLICY "Users can view their own home bedrooms"
ON home_bedrooms FOR SELECT
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own home bedrooms"
ON home_bedrooms FOR INSERT
TO authenticated
WITH CHECK (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own home bedrooms"
ON home_bedrooms FOR UPDATE
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

-- Site vicinity policies
CREATE POLICY "Users can view their own home site vicinity"
ON home_site_vicinity FOR SELECT
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own home site vicinity"
ON home_site_vicinity FOR INSERT
TO authenticated
WITH CHECK (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own home site vicinity"
ON home_site_vicinity FOR UPDATE
TO authenticated
USING (home_id IN (
    SELECT id FROM homes WHERE user_id = auth.uid()
));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_home_basic_systems_updated_at
    BEFORE UPDATE ON home_basic_systems
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_home_structure_updated_at
    BEFORE UPDATE ON home_structure
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_home_interior_updated_at
    BEFORE UPDATE ON home_interior
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_home_bedrooms_updated_at
    BEFORE UPDATE ON home_bedrooms
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_home_site_vicinity_updated_at
    BEFORE UPDATE ON home_site_vicinity
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column(); 