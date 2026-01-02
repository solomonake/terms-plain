import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv) {
  console.warn(
    "Missing Supabase environment variables. Check your .env.local file."
  );
}

export const supabase: SupabaseClient | null = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
