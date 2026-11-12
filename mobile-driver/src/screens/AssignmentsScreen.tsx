import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DriverAssignment, DriverProfile } from '../types';
import { useAppTheme } from '../theme';
import InlineError from '../components/InlineError';
import type { WorkspaceTab } from '../components/BottomTabBar';

interface AssignmentsScreenProps {
  profile: DriverProfile | null;
  assignments: DriverAssignment[];
  tab: Exclude<WorkspaceTab, 'profile' | 'proofs'>;
  refreshing: boolean;
  error: string;
  realtimeStatus: 'connecting' | 'live' | 'polling';
  onRefresh: () => void;
  onOpenAssignment: (id: string) => void;
}

const statusLabels: Record<string, string> = {
  pending: 'Awaiting your response',
  accepted: 'Accepted',
  rejected: 'Declined',
  in_progress: 'On delivery',
  completed: 'Delivered',
  failed: 'Delivery issue',
  cancelled: 'Cancelled',
};

export default function AssignmentsScreen({
  profile,
  assignments,
  tab,
  refreshing,
  error,
  realtimeStatus,
  onRefresh,
  onOpenAssignment,
}: AssignmentsScreenProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const activeAssignments = assignments.filter((item) =>
    ['pending', 'accepted', 'in_progress'].includes(item.status)
  );
  const completedAssignments = assignments.filter((item) =>
    ['completed', 'rejected', 'cancelled', 'failed'].includes(item.status)
  );
  const isHistory = tab === 'history';
  const orderedAssignments = isHistory ? completedAssignments : activeAssignments;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brand}>NMD LOGISTICS</Text>
            <Text style={styles.headerTitle}>{isHistory ? 'Delivery history' : 'My deliveries'}</Text>
          </View>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>
              {isHistory ? 'PAST' : realtimeStatus === 'live' ? 'LIVE' : 'SYNC'}
            </Text>
          </View>
        </View>
        <View style={styles.driverInfo}>
          {profile?.avatar_url ? (
            <Image
              accessibilityLabel="Driver profile photo"
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name || 'D').split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}
              </Text>
            </View>
          )}
          <View style={styles.driverText}>
            <Text numberOfLines={1} style={styles.driverName}>
              {profile?.full_name || 'Delivery driver'}
            </Text>
            <Text style={styles.driverMeta}>
              {profile?.employee_id || 'Driver'} · {profile?.vehicle_number || 'Vehicle not set'}
            </Text>
          </View>
          <View style={styles.deliveryCount}>
            <Text style={styles.deliveryCountValue}>{profile?.total_deliveries_completed ?? 0}</Text>
            <Text style={styles.deliveryCountLabel}>done</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.blue}
            colors={[colors.blue]}
          />
        }
      >
        <InlineError message={error} />
        {!isHistory && realtimeStatus !== 'live' ? (
          <Text style={styles.syncNotice}>
            {realtimeStatus === 'connecting'
              ? 'Connecting to live dispatch updates…'
              : 'Live updates are unavailable. This screen syncs periodically; pull down to refresh now.'}
          </Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{isHistory ? 'Past assignments' : 'Assigned to you'}</Text>
            <Text style={styles.sectionSubtitle}>
              {isHistory
                ? `${completedAssignments.length} past ${completedAssignments.length === 1 ? 'assignment' : 'assignments'}`
                : `${activeAssignments.length} active ${activeAssignments.length === 1 ? 'delivery' : 'deliveries'}`}
            </Text>
          </View>
          {refreshing && <ActivityIndicator color={colors.blue} />}
        </View>

        {orderedAssignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{isHistory ? '↻' : '✓'}</Text>
            <Text style={styles.emptyTitle}>{isHistory ? 'No delivery history yet' : 'You’re all caught up'}</Text>
            <Text style={styles.emptyText}>
              {isHistory
                ? 'Completed and closed assignments will appear here.'
                : 'New assignments from dispatch will appear here.'}
            </Text>
          </View>
        ) : orderedAssignments.map((assignment) => (
          <Pressable
            key={assignment.id}
            accessibilityRole="button"
            accessibilityLabel={`${assignment.order.order_number}, ${assignment.order.client_name}, ${statusLabels[assignment.status]}`}
            onPress={() => onOpenAssignment(assignment.id)}
            style={({ pressed }) => [styles.assignmentCard, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.orderNumber}>{assignment.order.order_number}</Text>
              <View style={[styles.statusPill, statusStyle(assignment.status, colors)]}>
                <Text style={[styles.statusText, statusTextStyle(assignment.status, colors)]}>
                  {statusLabels[assignment.status] ?? assignment.status}
                </Text>
              </View>
            </View>
            <Text numberOfLines={1} style={styles.clientName}>{assignment.order.client_name}</Text>
            <Text style={styles.packageWeight}>
              Weight · {assignment.order.package_weight != null
                ? `${assignment.order.package_weight.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`
                : 'Not provided'}
            </Text>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text numberOfLines={2} style={styles.routeValue}>{assignment.order.pickup_location}</Text>
            <View style={styles.routeDivider} />
            <Text style={styles.routeLabel}>DELIVER TO</Text>
            <Text numberOfLines={2} style={styles.routeValue}>{assignment.order.delivery_location}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.assignedDate}>
                Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
              </Text>
              <Text style={styles.openLabel}>Open ›</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function statusStyle(status: string, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (status === 'in_progress') return { backgroundColor: colors.paleBlue };
  if (status === 'completed') return { backgroundColor: colors.paleGreen };
  if (status === 'failed') return { backgroundColor: '#FEE2E2' };
  if (status === 'pending') return { backgroundColor: colors.paleGold };
  return { backgroundColor: colors.background };
}

function statusTextStyle(status: string, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (status === 'in_progress') return { color: colors.blue };
  if (status === 'completed') return { color: colors.success };
  if (status === 'failed') return { color: colors.danger };
  if (status === 'pending') return { color: colors.warning };
  return { color: colors.muted };
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  headerTag: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 11,
  },
  headerTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  syncNotice: {
    borderRadius: 10,
    backgroundColor: colors.paleGold,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    padding: 11,
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.gold,
  },
  avatarText: {
    color: colors.navy,
    fontWeight: '800',
  },
  driverText: {
    minWidth: 0,
    flex: 1,
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  driverMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 3,
  },
  deliveryCount: {
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.2)',
    paddingLeft: 12,
  },
  deliveryCountValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  deliveryCountLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 5,
    marginBottom: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  emptyCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    paddingHorizontal: 22,
    paddingVertical: 36,
    marginTop: 4,
  },
  emptyIcon: {
    color: colors.success,
    fontSize: 36,
    fontWeight: '800',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  assignmentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 15,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.82,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderNumber: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  clientName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },
  packageWeight: {
    marginTop: 4,
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  routeLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 12,
  },
  routeValue: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  routeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 10,
  },
  assignedDate: {
    color: colors.muted,
    fontSize: 11,
  },
  openLabel: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
});
