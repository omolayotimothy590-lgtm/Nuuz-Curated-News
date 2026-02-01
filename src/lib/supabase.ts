import { createClient, SupabaseClient } from '@supabase/supabase-js';

// CRITICAL: Hardcoded fallbacks to ensure these ALWAYS work
const FALLBACK_URL = 'https://itnxliunzuzlvtaswesi.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnhsaXVuenV6bHZ0YXN3ZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDgxNzUsImV4cCI6MjA3ODEyNDE3NX0.q3sP2NKUT3_2GX8Fjq3PkWsUfPHyfHM5ut9SitE0bE0';

// Get values with multiple fallback strategies
const getEnvValue = (key: string, fallback: string): string => {
  // Try multiple environment variable names
  const value = import.meta.env[key] ||
                import.meta.env[`VITE_${key}`] ||
                (typeof process !== 'undefined' && process.env?.[key]) ||
                fallback;

  // Ensure we never return undefined or empty string
  return (value && typeof value === 'string' && value.trim()) ? value.trim() : fallback;
};

const supabaseUrl = getEnvValue('SUPABASE_URL', FALLBACK_URL);
const supabaseAnonKey = getEnvValue('SUPABASE_ANON_KEY', FALLBACK_KEY);

// Validate configuration
if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseUrl.startsWith('http')) {
  console.error('❌ Invalid Supabase URL:', supabaseUrl);
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}. Check your environment variables.`);
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey.length < 20) {
  console.error('❌ Invalid Supabase Anon Key');
  throw new Error('Invalid Supabase Anon Key. Check your environment variables.');
}

let supabase: SupabaseClient;
let supabaseEnabled = true;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase initialized successfully');
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔑 Anon Key length:', supabaseAnonKey.length);
} catch (error) {
  console.error('❌ Supabase initialization failed:', error);
  throw new Error('Failed to initialize Supabase: ' + (error instanceof Error ? error.message : 'Unknown error'));
}

export { supabase, supabaseEnabled, supabaseUrl, supabaseAnonKey };
export type { SupabaseClient };
