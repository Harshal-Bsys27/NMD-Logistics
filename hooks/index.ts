'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

const getFallbackUser = (sessionUser: any): User | null => {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    full_name: sessionUser.user_metadata?.full_name ?? 'NMD User',
    phone: sessionUser.user_metadata?.phone ?? undefined,
    role: sessionUser.user_metadata?.role ?? 'supervisor',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/**
 * Hook to get current user and auth state
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async (sessionUser: any) => {
      if (!sessionUser) {
        if (isMounted) setUser(null);
        return;
      }

      const fallbackUser = getFallbackUser(sessionUser);
      if (fallbackUser && isMounted) {
        setUser(fallbackUser);
      }

      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (profileData && isMounted) {
          setUser(profileData as User);
        }
      } catch {
        if (fallbackUser && isMounted) {
          setUser(fallbackUser);
        }
      }
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!isMounted) return;

        if (session?.user) {
          await syncUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Auth error'));
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          await syncUser(session.user);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}

/**
 * Hook to check if user has required role
 */
export function useRequireRole(allowedRoles: string[]) {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setHasAccess(allowedRoles.includes(user.role));
    }
  }, [user, loading, allowedRoles]);

  return { hasAccess, loading };
}

/**
 * Hook for debounced search
 */
export function useDebounce<T>(value: T, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to track if component is mounted
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

/**
 * Hook for managing form errors
 */
export function useFormError(defaultError: string | null = null) {
  const [error, setError] = useState(defaultError);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorMessage = useCallback((message: string) => {
    setError(message);
  }, []);

  return { error, setError: setErrorMessage, clearError };
}

/**
 * Hook for managing loading state
 */
export function useLoading(initial = false) {
  const [loading, setLoading] = useState(initial);

  const startLoading = useCallback(() => {
    setLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  return { loading, startLoading, stopLoading };
}

/**
 * Hook for local storage with type safety
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Get from local storage by key
  const getValue = useCallback(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (item) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  }, [key, initialValue]);

  useEffect(() => {
    setStoredValue(getValue());
  }, [getValue]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

/**
 * Hook for previous value comparison
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

import React from 'react';
