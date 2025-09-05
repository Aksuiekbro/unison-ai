import { createClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          role: "employer" | "job-seeker"
          full_name: string
          company_name?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: "employer" | "job-seeker"
          full_name: string
          company_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: "employer" | "job-seeker"
          full_name?: string
          company_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Client-side Supabase client
export const supabase = createClient<Database>(
  // Fallbacks prevent runtime crash if .env.local isn't configured yet
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'
);

// Server-side Supabase client (admin)
export const supabaseAdmin = createClient<Database>(
  // Prefer server-only vars; fall back to public URL placeholder to avoid crash during dev
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);