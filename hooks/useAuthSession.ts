import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { Session } from '@supabase/supabase-js';

export type User = { name: string; email: string; id: string };

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          id: session.user.id
        });
        setIsLoggedIn(true);
      }
      setLoading(false);
    });

    // 2. Listen for changes (Login, Logout, Auto-refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          id: session.user.id
        });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login is now handled via Supabase API in the component, but we keep this signature for compatibility
  // though typically you call supabase.auth.signInWithPassword directly.
  const login = (userData: any) => {
     // No-op: handled by onAuthStateChange
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // State update handled by onAuthStateChange
  };

  return { user, isLoggedIn, login, logout, loading };
};
