
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { Session } from '@supabase/supabase-js';
import { clearLocalDB } from '../services/localDatabaseService.ts';

export type User = { name: string; email: string; id: string };

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateState(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateState = (session: Session | null) => {
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
  };

  const logout = async () => {
    // SECURE: Purge all local PHI records on sign-out to protect against shared-device leakage.
    await clearLocalDB();
    await supabase.auth.signOut();
  };

  return { user, isLoggedIn, logout, loading };
};
