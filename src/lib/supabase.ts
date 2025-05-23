import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging - remove in production
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key Length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('Is Key Empty:', supabaseAnonKey === '');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Add error handling to fetch operations
export async function handleSupabaseError<T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    return data;
  } catch (error: any) {
    console.error('Supabase operation failed:', error);
    throw error;
  }
}

export type Status = 'New' | 'Contacted' | 'Seen' | 'Liked' | 'Disliked' | 'Offer Made' | 'Accepted' | 'Rejected';

export interface Home {
  id: string;
  address: string;
  zillow_url: string;
  asking_price: number;
  agent_name?: string;
  current_status: Status;
  created_at: string;
}

export interface HomeChecklist {
  id: string;
  home_id: string;
  three_bed: boolean;
  two_bath: boolean;
  under_200k: boolean;
  no_basement: boolean;
  no_trees_back: boolean;
  brick: boolean;
  updated: boolean;
  ranch: boolean;
  notes: string;
  created_at: string;
}

export interface StatusUpdate {
  id: string;
  home_id: string;
  status: Status;
  notes?: string;
  offer_amount?: number;
  date: string;
}

export interface HomeNote {
  id: string;
  home_id: string;
  note: string;
  status: Status;
  date: string;
}

export interface HomeImage {
  id: string;
  home_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface HomeBasicSystems {
  id?: string;
  home_id: string;
  roof_year: string;
  paint_condition: 'Good' | 'Fair' | 'Poor';
  hvac_type: 'Central' | 'Window' | 'Mini-Split' | 'None';
  hvac_year: string;
  ac_unit_year_month: string;
  heating_type: 'Gas' | 'Electric';
  water_heater_present: boolean;
  water_heater_year: string;
  hot_water_test: 'Instant' | 'Delay' | 'None';
  plumbing_condition: 'Good' | 'Fair' | 'Poor';
  electrical_panel_updated: boolean;
  gfci_present: boolean;
  outlets_grounded: boolean;
  lights_working: 'All' | 'Some' | 'None';
  smoke_alarms_installed: boolean;
  smoke_alarms_working: boolean;
  co_detectors_installed: boolean;
  co_detectors_working: boolean;
  fire_extinguisher_present: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeStructure {
  id?: string;
  home_id: string;
  foundation_cracks: boolean;
  crawl_space_accessible: boolean;
  vapor_barrier_present: boolean;
  attic_insulation_present: boolean;
  double_glazed_windows: boolean;
  doors_locking_properly: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeInterior {
  id?: string;
  home_id: string;
  flooring_type: 'Hardwood' | 'Carpet' | 'Tile' | 'Laminate';
  hardwood_condition: 'Good' | 'Fair' | 'Poor';
  ceiling_issues: boolean;
  cabinet_condition: 'Good' | 'Fair' | 'Poor';
  appliances_present: string[];
  fixtures_operational: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeBedroom {
  id?: string;
  home_id: string;
  bedroom_name: string;
  adequate_size: boolean;
  closet_present: boolean;
  entry_door_present: boolean;
  egress_present: boolean;
  egress_type: 'Window' | 'Door';
  window_size_meets_code: boolean;
  window_sill_height_ok: boolean;
  smoke_detector_present: boolean;
  co_detector_present: boolean;
  gas_appliance_present: boolean;
  accessed_through_another: boolean;
  connects_to_garage: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeSiteVicinity {
  id?: string;
  home_id: string;
  adjacent_dilapidated: boolean;
  vacant_units_next_door: boolean;
  fire_damage_nearby: boolean;
  trash_dumping_present: boolean;
  illegal_repairs_nearby: boolean;
  excessive_noise: boolean;
  graffiti_present: boolean;
  isolated_location: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeEvaluationData {
  basicSystems: Omit<HomeBasicSystems, 'id' | 'created_at' | 'updated_at' | 'home_id'>;
  structure: Omit<HomeStructure, 'id' | 'created_at' | 'updated_at' | 'home_id'>;
  interior: Omit<HomeInterior, 'id' | 'created_at' | 'updated_at' | 'home_id'>;
  bedrooms: Record<string, Omit<HomeBedroom, 'id' | 'created_at' | 'updated_at' | 'home_id' | 'bedroom_name'>>;
  siteVicinity: Omit<HomeSiteVicinity, 'id' | 'created_at' | 'updated_at' | 'home_id'>;
} 