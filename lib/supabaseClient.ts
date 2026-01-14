import { createClient } from '@supabase/supabase-js';

// User provided Supabase configuration
// We use these as defaults if environment variables are not set, ensuring the app works in the preview environment.
const FALLBACK_URL = "https://qhxegzjcqqetmxajrtqf.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoeGVnempjcXFldG14YWpydHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTEyMDIsImV4cCI6MjA4MTEyNzIwMn0.1CPkcfikzrbSdIvYsOKjiiGn5UawkjpINWhcZnIzlnE";

// Use import.meta.env for Vite compatibility in Vercel
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (process as any).env?.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process as any).env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

/**
 * CLINICAL SAFETY: Lazy initialization wrapper.
 * Ensures that if Supabase keys are missing, the app doesn't crash on boot,
 * allowing Guest Mode to remain functional.
 */
let clientInstance: any = null;

export const getSupabase = () => {
    if (!clientInstance) {
        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn("Supabase credentials missing. Persistent storage and Auth will be disabled.");
            return null;
        }
        clientInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return clientInstance;
};

// Re-export as a standard client for existing code, using a proxy to handle nulls
export const supabase = new Proxy({} as any, {
    get(_, prop) {
        const client = getSupabase();
        if (!client) {
            // Return a robust dummy object that fails gracefully for common Supabase methods
            if (prop === 'auth') return { 
                getSession: async () => ({ data: { session: null }, error: null }), 
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Authentication service unavailable: Missing API keys." } }),
                signUp: async () => ({ data: { user: null, session: null }, error: { message: "Registration service unavailable: Missing API keys." } }),
                signOut: async () => ({ error: null }),
                resetPasswordForEmail: async () => ({ data: {}, error: { message: "Password reset unavailable: Missing API keys." } })
            };
            
            // Generic fallback for database queries
            return { 
                from: () => ({
                    select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }), 
                    upsert: async () => ({ error: { message: "Cloud storage unavailable: Missing API keys." } }), 
                    insert: async () => ({ error: { message: "Cloud storage unavailable: Missing API keys." } }), 
                    delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }) 
                })
            };
        }
        return client[prop];
    }
});