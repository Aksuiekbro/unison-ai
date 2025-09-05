import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types/database";

// Use placeholder values for build-time if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

// Legacy export for compatibility and job search functionality
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);