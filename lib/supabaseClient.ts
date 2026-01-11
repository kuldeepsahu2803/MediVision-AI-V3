

import { createClient } from '@supabase/supabase-js';

/**
 * SECURE: Supabase credentials must be provided via environment variables.
 * In Vite, variables are accessed statically (import.meta.env.VITE_...) 
 * so the compiler can perform string replacement during production builds.
 */

// 1. Check Vite's static env replacement (Build-time target)
// We guard the access with a check for 'import.meta.env' to prevent TypeErrors in raw browser environments.
// Fix: Use type casting on import.meta to allow access to the Vite-injected 'env' object without type errors.
const viteUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env) 
  ? (import.meta as any).env.VITE_SUPABASE_URL 
  : undefined;

// Fix: Use type casting on import.meta to allow access to the Vite-injected 'env' object without type errors.
const viteKey = (typeof import.meta !== 'undefined' && (import.meta as any).env) 
  ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY 
  : undefined;

// 2. Check process.env (Runtime fallback for Node.js/Cloud environments)
const processUrl = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined;
const processKey = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined;

const supabaseUrl = viteUrl || (processUrl as string);
const supabaseAnonKey = viteKey || (processKey as string);

if (!supabaseUrl || !supabaseAnonKey) {
  /**
   * We log this as information. The application is architected to function 
   * in 'Guest' mode using local IndexedDB when Supabase credentials are missing.
   */
  console.info("Supabase environment variables not found. Cloud features disabled, using local storage fallback.");
}

// Initialize client with placeholders if variables are missing.
// This prevents the SDK from crashing on init. Core app functionality remains 
// active via the local persistence logic in databaseService.ts.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
