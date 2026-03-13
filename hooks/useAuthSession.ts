
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

export type User = { name: string; email: string; id: string };
export type CloudStatus = 'UNINITIALIZED' | 'DISCOVERING' | 'ENABLED' | 'LOCAL_ONLY' | 'DEGRADED';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('UNINITIALIZED');

  const checkCapability = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCloudStatus('LOCAL_ONLY');
      return false;
    }
    
    try {
      setCloudStatus('DISCOVERING');
      // Minimal heartbeat check to verify node connectivity
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      
      setCloudStatus('ENABLED');
      return true;
    } catch (e) {
      console.warn("Clinical Infrastructure: Cloud node unreachable.", e);
      setCloudStatus('DEGRADED');
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

  return { user, isLoggedIn, logout, loading, cloudStatus, refreshCapability: checkCapability };
};
