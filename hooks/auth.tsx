'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) throw new Error('You must be signed in to update your profile photo.');
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('id, email, full_name, phone, role, status, avatar_url, department, created_at, updated_at, created_by')
      .single();

    if (updateError) throw new Error(updateError.message);
    setUser(data as User);
  };

  useEffect(() => {
    let isMounted = true;
    let requestId = 0;
    let currentUserId: string | null = null;
    let resolvedProfileUserId: string | null = null;
    let initialSessionResolved = false;

    const syncUser = async (sessionUser: { id: string } | null) => {
      if (!sessionUser) {
        requestId += 1;
        currentUserId = null;
        resolvedProfileUserId = null;
        if (isMounted) {
          setUser(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (currentUserId !== sessionUser.id) {
        currentUserId = sessionUser.id;
        resolvedProfileUserId = null;
        if (isMounted) setUser(null);
      }

      const currentRequestId = ++requestId;
      if (isMounted && resolvedProfileUserId !== sessionUser.id) {
        setLoading(true);
      }
      if (isMounted) setError(null);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, email, full_name, phone, role, status, avatar_url, department, created_at, updated_at, created_by')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Your account profile could not be found.');

        if (isMounted && currentRequestId === requestId) {
          setUser(profileData as User);
          resolvedProfileUserId = sessionUser.id;
          setError(null);
        }
      } catch (syncError) {
        if (isMounted && currentRequestId === requestId) {
          resolvedProfileUserId = null;
          setUser(null);
          setError(syncError instanceof Error ? syncError : new Error('Unable to load your account profile.'));
        }
      } finally {
        if (isMounted && currentRequestId === requestId) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'INITIAL_SESSION') {
        if (initialSessionResolved) return;
        initialSessionResolved = true;
        void syncUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT' || !session?.user) {
        void syncUser(null);
      } else if (event !== 'TOKEN_REFRESHED' || currentUserId !== session.user.id) {
        void syncUser(session.user);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted || initialSessionResolved) return;
      initialSessionResolved = true;
      if (sessionError) {
        setError(sessionError);
        setLoading(false);
        return;
      }
      void syncUser(data.session?.user ?? null);
    }).catch((sessionError: unknown) => {
      if (isMounted && !initialSessionResolved) {
        initialSessionResolved = true;
        setError(sessionError instanceof Error ? sessionError : new Error('Unable to load your session.'));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
