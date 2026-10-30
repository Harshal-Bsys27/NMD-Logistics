'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
export { AuthProvider, useAuth } from './auth';

/**
 * Hook to check if user has required role
 */
export function useRequireRole(allowedRoles: string[]) {
  const { user, loading } = useAuth();
  return { hasAccess: !loading && !!user && allowedRoles.includes(user.role), loading };
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
