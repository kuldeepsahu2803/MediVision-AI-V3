import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { Session } from '@supabase/supabase-js';

export type User = { name: string; email: string; id: string };

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Safety Timeout: Guarantee terminal loading state
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.warn("Auth check timed out. Proceeding as guest.");
        setLoading(false);
      }
    }, 2500);

    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          id: session.user.id
        });
        setIsLoggedIn(true);
      }
      clearTimeout(timeoutRef.current);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeoutRef.current);
      setLoading(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: any) => {};
  const logout = async () => { await supabase.auth.signOut(); };

  return { user, isLoggedIn, login, logout, loading };
};