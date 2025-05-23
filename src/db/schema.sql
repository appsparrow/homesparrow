-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create homes table
CREATE TABLE public.homes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  address TEXT NOT NULL,
  zillow_url TEXT,
  asking_price DECIMAL(12,2),
  agent_name TEXT,
  current_status TEXT DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on homes
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

-- Create home_checklists table
CREATE TABLE public.home_checklists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
  three_bed BOOLEAN DEFAULT false,
  two_bath BOOLEAN DEFAULT false,
  under_200k BOOLEAN DEFAULT false,
  no_basement BOOLEAN DEFAULT false,
  no_trees_back BOOLEAN DEFAULT false,
  brick BOOLEAN DEFAULT false,
  updated BOOLEAN DEFAULT false,
  ranch BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on home_checklists
ALTER TABLE public.home_checklists ENABLE ROW LEVEL SECURITY;

-- Create home_evaluations table
CREATE TABLE public.home_evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  -- Basic Systems
  roof_condition TEXT CHECK (roof_condition IN ('Good', 'OK', 'Bad')),
  hvac_type TEXT,
  hvac_condition TEXT CHECK (hvac_condition IN ('Good', 'OK', 'Bad')),
  plumbing_condition TEXT CHECK (plumbing_condition IN ('Good', 'OK', 'Bad')),
  electrical_updated BOOLEAN,
  gfci_present BOOLEAN,
  smoke_detectors BOOLEAN,
  co_detectors BOOLEAN,
  -- Structure
  foundation_issues BOOLEAN,
  crawl_space BOOLEAN,
  attic_access BOOLEAN,
  windows_updated BOOLEAN,
  doors_secure BOOLEAN,
  -- Interior
  flooring_type TEXT CHECK (flooring_type IN ('Carpet', 'LVP', 'Hardwood', 'Tile')),
  flooring_condition TEXT CHECK (flooring_condition IN ('Good', 'OK', 'Bad')),
  walls_condition TEXT CHECK (walls_condition IN ('Good', 'OK', 'Bad')),
  ceiling_condition TEXT CHECK (ceiling_condition IN ('Good', 'OK', 'Bad')),
  kitchen_updated BOOLEAN,
  bathrooms_updated BOOLEAN,
  -- Bedrooms
  adequate_size BOOLEAN,
  closet_space BOOLEAN,
  natural_light BOOLEAN,
  proper_egress BOOLEAN,
  -- Exterior
  siding_condition TEXT CHECK (siding_condition IN ('Good', 'OK', 'Bad')),
  landscaping_condition TEXT CHECK (landscaping_condition IN ('Good', 'OK', 'Bad')),
  drainage BOOLEAN,
  fencing BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on home_evaluations
ALTER TABLE public.home_evaluations ENABLE ROW LEVEL SECURITY;

-- Create status_updates table
CREATE TABLE public.status_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL,
  notes TEXT,
  offer_amount DECIMAL(12,2),
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on status_updates
ALTER TABLE public.status_updates ENABLE ROW LEVEL SECURITY;

-- Create home_notes table
CREATE TABLE public.home_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  status TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on home_notes
ALTER TABLE public.home_notes ENABLE ROW LEVEL SECURITY;

-- Create home_images table
CREATE TABLE public.home_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on home_images
ALTER TABLE public.home_images ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Homes policies
CREATE POLICY "Users can view their own homes" ON public.homes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create homes" ON public.homes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own homes" ON public.homes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own homes" ON public.homes
  FOR DELETE USING (auth.uid() = user_id);

-- Home checklists policies
CREATE POLICY "Users can view checklists of their homes" ON public.home_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_checklists.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create checklists for their homes" ON public.home_checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_checklists.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklists of their homes" ON public.home_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_checklists.home_id
      AND homes.user_id = auth.uid()
    )
  );

-- Home evaluations policies
CREATE POLICY "Users can view evaluations of their homes" ON public.home_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_evaluations.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations for their homes" ON public.home_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_evaluations.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update evaluations of their homes" ON public.home_evaluations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_evaluations.home_id
      AND homes.user_id = auth.uid()
    )
  );

-- Status updates policies
CREATE POLICY "Users can view status updates of their homes" ON public.status_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = status_updates.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create status updates for their homes" ON public.status_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = status_updates.home_id
      AND homes.user_id = auth.uid()
    )
  );

-- Home notes policies
CREATE POLICY "Users can view notes of their homes" ON public.home_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_notes.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their homes" ON public.home_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_notes.home_id
      AND homes.user_id = auth.uid()
    )
  );

-- Home images policies
CREATE POLICY "Users can view images of their homes" ON public.home_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_images.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images for their homes" ON public.home_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_images.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images of their homes" ON public.home_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_images.home_id
      AND homes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of their homes" ON public.home_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.homes
      WHERE homes.id = home_images.home_id
      AND homes.user_id = auth.uid()
    )
  );

-- Create functions for handling timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.homes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.home_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.home_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.home_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 