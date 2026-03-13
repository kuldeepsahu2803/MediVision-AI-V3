
import { createClient } from '@supabase/supabase-js';

// CLINICAL INFRASTRUCTURE: Use import.meta.env for Vite compatibility
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || "";
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Fail-safe placeholders to prevent constructor crashes during SSR/Build
const FALLBACK_URL = "https://placeholder-clinical-node.supabase.co";
const FALLBACK_KEY = "placeholder-anon-key";

/**
 * Validates if the environment provides valid Supabase credentials.
 * This is used for UI hinting, not for hard execution gating.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(ENV_URL && ENV_KEY && ENV_URL.startsWith('https://') && ENV_URL !== FALLBACK_URL);
};

let clientInstance: any = null;

/**
 * Returns the singleton Supabase client. 
 * If keys are missing, returns a client with fallback values that will 
 * trigger natural network errors when used, providing a real feedback loop.
 */
export const getSupabaseClient = () => {
  if (!clientInstance) {
    const url = ENV_URL || FALLBACK_URL;
    const key = ENV_KEY || FALLBACK_KEY;
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return clientInstance;
};

// Export singleton instance
export const supabase = getSupabaseClient();
