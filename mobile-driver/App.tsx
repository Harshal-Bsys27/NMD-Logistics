import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import {
  getDriverProfile,
  getDriverAssignments,
} from './src/services/driver';
import type { DriverAssignment, DriverProfile } from './src/types';
import SignInScreen from './src/screens/SignInScreen';
import AssignmentsScreen from './src/screens/AssignmentsScreen';
import AssignmentDetailScreen from './src/screens/AssignmentDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProofsScreen from './src/screens/ProofsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BottomTabBar, { type WorkspaceTab } from './src/components/BottomTabBar';
import { ThemeProvider, useAppTheme } from './src/theme';

function DriverApp() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('deliveries');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'live' | 'polling'>('connecting');

  const loadDriverData = useCallback(async (userId: string, showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setError('');
    try {
      const driver = await getDriverProfile(userId);
      setProfile(driver);
      const rows = await getDriverAssignments(driver.id);
      setAssignments(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your driver workspace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!active) return;
        setSession(data.session);
        if (data.session) {
          await loadDriverData(data.session.user.id);
        } else {
          setLoading(false);
        }
      } catch (initializationError) {
        if (!active) return;
        setError(initializationError instanceof Error ? initializationError.message : 'Unable to restore your sign-in.');
        setLoading(false);
      }
    };

    initialize();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setAssignments([]);
        setSelectedAssignmentId(null);
        setLoading(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        loadDriverData(nextSession.user.id);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadDriverData]);

  useEffect(() => {
    if (!session?.user.id || !profile?.id) {
      setRealtimeStatus('connecting');
      return;
    }

    let active = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
    let connectionTimeout: ReturnType<typeof setTimeout> | undefined;
    const userId = session.user.id;
    const driverId = profile.id;
    connectionTimeout = setTimeout(() => {
      if (active) setRealtimeStatus('polling');
    }, 15_000);
    const scheduleRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        if (active) loadDriverData(userId);
      }, 250);
    };

    const channel = supabase
      .channel(`driver-live-workspace-${driverId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_assignments',
        filter: `personnel_id=eq.${driverId}`,
      }, scheduleRefresh)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_personnel',
        filter: `id=eq.${driverId}`,
      }, scheduleRefresh)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, scheduleRefresh)
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          setRealtimeStatus('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          setRealtimeStatus('polling');
          if (status !== 'CLOSED') {
            console.error(`Driver realtime subscription unavailable (${status}); using periodic refresh.`);
          }
        }
      });

    const refreshOnResume = (state: string) => {
      if (state === 'active') loadDriverData(userId);
    };
    const appStateSubscription = AppState.addEventListener('change', refreshOnResume);
    const pollTimer = setInterval(() => {
      if (AppState.currentState === 'active') loadDriverData(userId);
    }, 30_000);

    return () => {
      active = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
      if (connectionTimeout) clearTimeout(connectionTimeout);
      clearInterval(pollTimer);
      appStateSubscription.remove();
      supabase.removeChannel(channel).then((result) => {
        if (result !== 'ok') console.error(`Could not clean up driver realtime channel (${result}).`);
      }).catch((removeError: unknown) => {
        console.error('Could not clean up driver realtime channel.', removeError);
      });
    };
  }, [loadDriverData, profile?.id, session?.user.id]);

  const refresh = useCallback(async () => {
    if (session) await loadDriverData(session.user.id, true);
  }, [loadDriverData, session]);

  const handleSignOut = async () => {
    setError('');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  };

  const handleAssignmentUpdated = async () => {
    setSelectedAssignmentId(null);
    await refresh();
  };

  const selectedAssignment = assignments.find((item) => item.id === selectedAssignmentId) ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading your driver workspace…</Text>
        </View>
      ) : !session ? (
        <SignInScreen error={error} onError={setError} />
      ) : selectedAssignment ? (
        <AssignmentDetailScreen
          assignment={selectedAssignment}
          onBack={() => setSelectedAssignmentId(null)}
          onUpdated={handleAssignmentUpdated}
          error={error}
          onClearError={() => setError('')}
        />
      ) : (
        <View style={styles.workspace}>
          {activeTab === 'profile' ? (
            <ProfileScreen
              profile={profile}
              userId={session.user.id}
              email={session.user.email ?? ''}
              assignments={assignments}
              error={error}
              onSignOut={() => handleSignOut()}
              onOpenSettings={() => setActiveTab('settings')}
              onProfileUpdated={refresh}
            />
          ) : activeTab === 'proofs' ? (
            <ProofsScreen driverId={profile?.id ?? ''} />
          ) : activeTab === 'settings' ? (
            <SettingsScreen />
          ) : (
            <AssignmentsScreen
              profile={profile}
              assignments={assignments}
              tab={activeTab}
              refreshing={refreshing}
              error={error}
              realtimeStatus={realtimeStatus}
              onRefresh={() => refresh()}
              onOpenAssignment={setSelectedAssignmentId}
            />
          )}
          <BottomTabBar activeTab={activeTab} onSelect={setActiveTab} />
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <DriverApp />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  workspace: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
  },
});
