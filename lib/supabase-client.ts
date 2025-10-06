import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types/database";

// Use placeholder values for build-time if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'

let browserClient: SupabaseClient<Database> | null = null

// Returns a singleton browser client to avoid multiple GoTrue instances
export function getBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// Export a universal client:
// - In the browser, reuse the singleton browser client
// - On the server, use a stateless client (no session persistence)
export const supabase: SupabaseClient<Database> =
  typeof window === 'undefined'
    ? createSupabaseJsClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : getBrowserClient()