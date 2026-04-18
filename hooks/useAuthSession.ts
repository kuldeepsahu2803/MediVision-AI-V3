
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

export type User = { name: string; email: string; id: string };
export type CloudStatus = 'UNINITIALIZED' | 'DISCOVERING' | 'ENABLED' | 'LOCAL_ONLY' | 'DEGRADED';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('UNINITIALIZED');

  const checkCapability = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCloudStatus('LOCAL_ONLY');
      return false;
    }
    
    try {
      setCloudStatus('DISCOVERING');
      
      // Add a timeout to prevent infinite spinner if Supabase is unreachable
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase connection timed out")), 5000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      
      const { error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error("Network error: Could not connect to Supabase. Check your URL and internet connection.");
        }
        throw error;
      }
      
      setCloudStatus('ENABLED');
      return true;
    } catch (e: any) {
      console.warn("Clinical Infrastructure: Cloud node unreachable.");
      setCloudStatus('DEGRADED');
      // If it's a fetch error, it's likely a configuration or network issue
      if (e.message?.includes('Failed to fetch')) {
        setError("Failed to connect to cloud infrastructure. Operating in local-only mode.");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const isAvailable = await checkCapability();
      
      if (!isAvailable) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser({
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            id: session.user.id
          });
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Auth hydration failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          id: session.user.id
        });
        setIsLoggedIn(true);
        setCloudStatus('ENABLED');
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkCapability]);

  const logout = async () => { 
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('rx_history_cache');
    window.location.reload(); 
  };

  return { user, isLoggedIn, logout, loading, error, cloudStatus, refreshCapability: checkCapability };
};
