import { createClient } from '@supabase/supabase-js';

// User provided Supabase configuration
// We use these as defaults if environment variables are not set, ensuring the app works in the preview environment.
const FALLBACK_URL = "https://qhxegzjcqqetmxajrtqf.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeGVnempjcXFldG14YWpydHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTEyMDIsImV4cCI6MjA4MTEyNzIwMn0.1CPkcfikzrbSdIvYsOKjiiGn5UawkjpINWhcZnIzlnE";

// Safe access to environment variables
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials are missing. Please check your configuration.");
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);