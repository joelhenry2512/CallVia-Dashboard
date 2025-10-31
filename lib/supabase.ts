import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Lazy initialization to avoid build-time errors
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  return url;
};

const getSupabaseAnonKey = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
};

const getSupabaseServiceKey = () => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
};

// Client-side Supabase client
export const supabase = createClient<Database>(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

// Server-side Supabase client with service role
export const supabaseAdmin = createClient<Database>(
  getSupabaseUrl(),
  getSupabaseServiceKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to get user session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Helper to get user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
