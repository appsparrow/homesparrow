import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Simple Supabase client using HTTP calls only
class SimpleSupabaseClient {
  private baseUrl: string;
  private apiKey: string;
  private accessToken: string | null = null;

  constructor(url: string, key: string) {
    this.baseUrl = url;
    this.apiKey = key;
  }

  private async getHeaders() {
    const headers: any = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    return headers;
  }

  // Auth methods
  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await axios.post(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
          email,
          password,
        }, {
          headers: await this.getHeaders(),
        });

        if (response.data.access_token) {
          this.accessToken = response.data.access_token;
          await SecureStore.setItemAsync('supabase_token', response.data.access_token);
        }

        return { data: response.data, error: null };
      } catch (error: any) {
        return { data: null, error: error.response?.data || error };
      }
    },

    signOut: async () => {
      try {
        this.accessToken = null;
        await SecureStore.deleteItemAsync('supabase_token');
        return { error: null };
      } catch (error: any) {
        return { error };
      }
    },

    getSession: async () => {
      try {
        const token = await SecureStore.getItemAsync('supabase_token');
        if (token) {
          this.accessToken = token;
          return { data: { session: { access_token: token } }, error: null };
        }
        return { data: { session: null }, error: null };
      } catch (error: any) {
        return { data: { session: null }, error };
      }
    },
  };

  // Database methods
  from(table: string) {
    return {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => this.query('GET', table, { [column]: value }, columns),
        order: (column: string, options: any = {}) => this.query('GET', table, {}, columns, { order: column, ascending: options.ascending }),
        single: () => this.query('GET', table, {}, columns, { single: true }),
      }),
      insert: (data: any) => this.query('POST', table, data),
      update: (data: any) => ({
        eq: (column: string, value: any) => this.query('PATCH', table, data, '*', { [column]: value }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => this.query('DELETE', table, {}, '*', { [column]: value }),
      }),
      upsert: (data: any) => this.query('POST', table, data, '*', { upsert: true }),
    };
  }

  private async query(method: string, table: string, data: any = {}, select = '*', options: any = {}) {
    try {
      const headers = await this.getHeaders();
      let url = `${this.baseUrl}/rest/v1/${table}`;
      
      if (method === 'GET' && select !== '*') {
        url += `?select=${select}`;
      }

      const config: any = {
        method,
        url,
        headers,
      };

      if (method !== 'GET' && method !== 'DELETE') {
        config.data = data;
      }

      const response = await axios(config);
      return { data: response.data, error: null };
    } catch (error: any) {
      return { data: null, error: error.response?.data || error };
    }
  }

  // Storage methods (simplified)
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options: any = {}) => {
        // Simplified upload - you may need to implement this based on your needs
        return { data: null, error: { message: 'Upload not implemented in simple client' } };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `${this.baseUrl}/storage/v1/object/public/${path}` },
      }),
    }),
  };
}

// Initialize client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = new SimpleSupabaseClient(supabaseUrl, supabaseAnonKey);

// Types
export type Status = 'New' | 'Contacted' | 'Seen' | 'Liked' | 'Disliked' | 'Offer Made' | 'Accepted';

export interface Home {
  id: string;
  address: string;
  zillow_url: string;
  asking_price: number;
  agent_name?: string;
  current_status: Status;
  youtube_link?: string;
  user_id: string;
  created_at: string;
}

export interface HomeChecklist {
  id: string;
  home_id: string;
  // HVAC
  has_central_air: boolean;
  has_heat_pump: boolean;
  has_gas_furnace: boolean;
  has_window_units: boolean;
  // Flooring
  has_hardwood: boolean;
  has_carpet: boolean;
  has_tile: boolean;
  has_laminate: boolean;
  // Kitchen
  has_kitchen_island: boolean;
  has_pantry: boolean;
  has_updated_appliances: boolean;
  is_open_concept: boolean;
  // Bathrooms
  has_master_bath: boolean;
  has_updated_fixtures: boolean;
  has_separate_tub_shower: boolean;
  has_double_vanity: boolean;
  // Exterior
  has_garage: boolean;
  has_deck_patio: boolean;
  has_fenced_yard: boolean;
  has_pool: boolean;
  // Other Features
  has_basement: boolean;
  has_attic: boolean;
  has_fireplace: boolean;
  has_security_system: boolean;
  // Original fields
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
  created_at: string;
}

export interface HomeNote {
  id: string;
  home_id: string;
  note: string;
  status: Status;
  date: string;
  created_at: string;
}

export interface HomeImage {
  id: string;
  home_id: string;
  image_url: string;
  is_primary: boolean;
  created_at: string;
}

// Error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred');
}; 