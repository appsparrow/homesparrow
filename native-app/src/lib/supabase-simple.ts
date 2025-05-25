// Minimal Supabase client using fetch only
class MinimalSupabaseClient {
  private baseUrl: string;
  private apiKey: string;
  private accessToken: string | null = null;
  private isValidConfig: boolean;

  constructor(url: string, key: string) {
    this.baseUrl = url;
    this.apiKey = key;
    
    // Check if we have valid configuration
    this.isValidConfig = !!(url && 
                           key && 
                           url !== 'https://your-project.supabase.co' && 
                           key !== 'your-anon-key' &&
                           url.includes('.supabase.co'));
    
    // Debug logging
    console.log('Supabase URL:', url ? 'Set' : 'Missing');
    console.log('Supabase Key:', key ? 'Set' : 'Missing');
    console.log('Valid config:', this.isValidConfig);
  }

  private getHeaders() {
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
        if (!this.isValidConfig) {
          throw new Error('Supabase not properly configured - using demo mode');
        }

        const url = `${this.baseUrl}/auth/v1/token?grant_type=password`;
        console.log('Attempting login to:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ email, password }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Login response received');

        if (data.access_token) {
          this.accessToken = data.access_token;
          console.log('Access token stored');
        }

        return { data, error: null };
      } catch (error: any) {
        console.log('Login error:', error.message);
        return { data: null, error: { message: error.message } };
      }
    },

    signOut: async () => {
      this.accessToken = null;
      return { error: null };
    },

    getSession: async () => {
      if (this.accessToken) {
        return { data: { session: { access_token: this.accessToken } }, error: null };
      }
      return { data: { session: null }, error: null };
    },
  };

  // Database methods (now fully functional)
  from(table: string) {
    return {
      select: (columns = '*') => ({
        eq: async (column: string, value: any) => {
          try {
            const url = `${this.baseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`;
            const response = await fetch(url, {
              headers: this.getHeaders(),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
        order: async (column: string, options: any = {}) => {
          try {
            const ascending = options.ascending !== false;
            const url = `${this.baseUrl}/rest/v1/${table}?select=${columns}&order=${column}.${ascending ? 'asc' : 'desc'}`;
            const response = await fetch(url, {
              headers: this.getHeaders(),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
        single: async () => {
          try {
            const url = `${this.baseUrl}/rest/v1/${table}?select=${columns}&limit=1`;
            const response = await fetch(url, {
              headers: this.getHeaders(),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { data: data[0] || null, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
      }),
      insert: async (data: any) => {
        try {
          const url = `${this.baseUrl}/rest/v1/${table}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { ...this.getHeaders(), 'Prefer': 'return=representation' },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const result = await response.json();
          return { data: result, error: null };
        } catch (error: any) {
          return { data: null, error: { message: error.message } };
        }
      },
      update: (data: any) => ({
        eq: async (column: string, value: any) => {
          try {
            const url = `${this.baseUrl}/rest/v1/${table}?${column}=eq.${value}`;
            const response = await fetch(url, {
              method: 'PATCH',
              headers: { ...this.getHeaders(), 'Prefer': 'return=representation' },
              body: JSON.stringify(data),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            return { data: result, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
      }),
      delete: () => ({
        eq: async (column: string, value: any) => {
          try {
            const url = `${this.baseUrl}/rest/v1/${table}?${column}=eq.${value}`;
            const response = await fetch(url, {
              method: 'DELETE',
              headers: this.getHeaders(),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            return { data: null, error: null };
          } catch (error: any) {
            return { data: null, error: { message: error.message } };
          }
        },
      }),
      upsert: async (data: any) => {
        try {
          const url = `${this.baseUrl}/rest/v1/${table}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 
              ...this.getHeaders(), 
              'Prefer': 'return=representation,resolution=merge-duplicates' 
            },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upsert error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          return { data: result, error: null };
        } catch (error: any) {
          console.error('Upsert error:', error);
          return { data: null, error: { message: error.message } };
        }
      },
    };
  }

  // Storage methods (simplified)
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options: any = {}) => {
        // Simplified upload - you may need to implement this based on your needs
        return { data: null, error: { message: 'Upload not implemented in simple client' } };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `${this.baseUrl}/storage/v1/object/public/${bucket}/${path}` },
      }),
    }),
  };
}

// Initialize client with environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = new MinimalSupabaseClient(supabaseUrl, supabaseAnonKey);

// Complete types from your web app
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

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return error?.message || 'An unexpected error occurred';
}; 