'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { assignmentService, driverService, orderService } from '@/services/database';
import type { Assignment, DeliveryFeedback, DeliveryPersonnel, DeliveryProof, Order } from '@/types';
import { useAuth } from './auth';

interface OperationsData {
  orders: Order[];
  drivers: DeliveryPersonnel[];
  assignments: Assignment[];
  deliveryProofs: DeliveryProof[];
  customerFeedback: DeliveryFeedback[];
  deliveryProofsError: string;
  customerFeedbackError: string;
  isLoading: boolean;
  error: string;
  realtimeStatus: 'connecting' | 'live' | 'polling';
  refresh: (silent?: boolean) => Promise<void>;
}

interface PendingRefresh {
  userId: string;
  promise: Promise<void>;
  refreshAgain: boolean;
}

const OperationsDataContext = createContext<OperationsData | null>(null);

export function OperationsDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = !authLoading ? user?.id ?? null : null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryPersonnel[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);
  const [customerFeedback, setCustomerFeedback] = useState<DeliveryFeedback[]>([]);
  const [deliveryProofsError, setDeliveryProofsError] = useState('');
  const [customerFeedbackError, setCustomerFeedbackError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<OperationsData['realtimeStatus']>('connecting');
  const currentUserIdRef = useRef<string | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const lastRefreshAtRef = useRef(0);
  const pendingRefreshRef = useRef<PendingRefresh | null>(null);

  const refresh = useCallback((silent = false) => {
    if (!userId) return Promise.resolve();

    const pending = pendingRefreshRef.current;
    if (pending?.userId === userId) {
      pending.refreshAgain = true;
      return pending.promise;
    }

    const refreshUserId = userId;
    if (!silent && loadedUserIdRef.current !== refreshUserId) setIsLoading(true);
    setError('');

    const promise = (async () => {
      try {
        const [orderResult, driverResult, assignmentResult, proofResult, feedbackResult] = await Promise.all([
          orderService.getAll(),
          driverService.getAll(),
          assignmentService.getAll(),
          assignmentService.getAllProofs(),
          assignmentService.getAllFeedback(),
        ]);
        const firstError = orderResult.error || driverResult.error || assignmentResult.error;
        if (firstError) throw new Error(firstError);

        if (currentUserIdRef.current === refreshUserId) {
          setOrders(orderResult.data ?? []);
          setDrivers(driverResult.data ?? []);
          setAssignments(assignmentResult.data ?? []);
          setDeliveryProofs(proofResult.data ?? []);
          setDeliveryProofsError(proofResult.error ?? '');
          setCustomerFeedback(feedbackResult.data ?? []);
          setCustomerFeedbackError(feedbackResult.error ?? '');
          loadedUserIdRef.current = refreshUserId;
          setError('');
        }
      } catch (loadError) {
        if (currentUserIdRef.current === refreshUserId) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load operations data');
        }
      } finally {
        if (currentUserIdRef.current === refreshUserId) {
          lastRefreshAtRef.current = Date.now();
          setIsLoading(false);
        }
      }
    })();

    pendingRefreshRef.current = { userId: refreshUserId, promise, refreshAgain: false };
    void promise.finally(() => {
      const completedRefresh = pendingRefreshRef.current;
      if (completedRefresh?.promise === promise) {
        pendingRefreshRef.current = null;
        if (completedRefresh.refreshAgain && currentUserIdRef.current === refreshUserId) {
          void refresh(true);
        }
      }
    });
    return promise;
  }, [userId]);

  useEffect(() => {
    currentUserIdRef.current = userId;
    lastRefreshAtRef.current = 0;
    setError('');

    if (!userId) {
      loadedUserIdRef.current = null;
      setOrders([]);
      setDrivers([]);
      setAssignments([]);
      setDeliveryProofs([]);
      setCustomerFeedback([]);
      setDeliveryProofsError('');
      setCustomerFeedbackError('');
      setIsLoading(authLoading);
      setRealtimeStatus('connecting');
      return;
    }

    if (loadedUserIdRef.current !== userId) {
      setOrders([]);
      setDrivers([]);
      setAssignments([]);
      setDeliveryProofs([]);
      setCustomerFeedback([]);
      setIsLoading(true);
    }

    let active = true;
    let refreshTimer: number | undefined;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void refresh(true), 200);
    };

    const channel = supabase
      .channel(`operations-live-data-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_assignments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_personnel' }, scheduleRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'delivery_feedback' }, scheduleRefresh)
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('polling');
          if (status !== 'CLOSED') {
            console.error(`Operations realtime subscription unavailable (${status}); using periodic refresh.`);
          }
        }
      });

    const refreshIfStale = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastRefreshAtRef.current >= 30_000
      ) {
        void refresh(true);
      }
    };
    const refreshOnResume = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastRefreshAtRef.current >= 5_000
      ) {
        void refresh(true);
      }
    };
    const pollTimer = window.setInterval(refreshIfStale, 30_000);
    document.addEventListener('visibilitychange', refreshOnResume);
    window.addEventListener('focus', refreshOnResume);

    void refresh();

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      window.clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', refreshOnResume);
      window.removeEventListener('focus', refreshOnResume);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, refresh, userId]);

  return (
    <OperationsDataContext.Provider value={{
      orders,
      drivers,
      assignments,
      deliveryProofs,
      customerFeedback,
      deliveryProofsError,
      customerFeedbackError,
      isLoading,
      error,
      realtimeStatus,
      refresh,
    }}>
      {children}
    </OperationsDataContext.Provider>
  );
}

export function useOperationsData() {
  const context = useContext(OperationsDataContext);
  if (!context) throw new Error('useOperationsData must be used within OperationsDataProvider.');
  return context;
}
