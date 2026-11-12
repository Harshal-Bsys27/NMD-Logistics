import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type {
  DriverAssignment,
  DriverAvailability,
  DriverAvailabilityHistory,
  DriverFeedback,
  DriverProfile,
} from '../types';
import { useAppTheme, type AppColors } from '../theme';
import ActionButton from '../components/ActionButton';
import InlineError from '../components/InlineError';
import {
  getDriverAvailabilityHistory,
  getDriverFeedback,
  setDriverAvailability,
  updateDriverAvatar,
} from '../services/driver';

interface ProfileScreenProps {
  profile: DriverProfile | null;
  userId: string;
  email: string;
  assignments: DriverAssignment[];
  error: string;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onProfileUpdated: () => Promise<void>;
}

const availabilityOptions: { value: Exclude<DriverAvailability, 'on_delivery'>; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'on_break', label: 'On break' },
  { value: 'off_duty', label: 'Off duty' },
];

export default function ProfileScreen({
  profile,
  userId,
  email,
  assignments,
  error,
  onSignOut,
  onOpenSettings,
  onProfileUpdated,
}: ProfileScreenProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const [history, setHistory] = useState<DriverAvailabilityHistory[]>([]);
  const [feedback, setFeedback] = useState<DriverFeedback[]>([]);
  const [detailsError, setDetailsError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const activeAssignments = assignments.filter((item) =>
    ['pending', 'accepted', 'in_progress'].includes(item.status)
  );
  const hasInProgress = activeAssignments.some((item) => item.status === 'in_progress');
  const displayedStatus = activeAssignments.length > 0
    ? hasInProgress ? 'on_delivery' : 'assigned'
    : profile?.current_status ?? 'off_duty';
  const initials = (profile?.full_name || 'Driver')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const loadDetails = useCallback(async () => {
    if (!profile?.id) return;
    setDetailsError('');
    try {
      const [availabilityHistory, customerFeedback] = await Promise.all([
        getDriverAvailabilityHistory(profile.id),
        getDriverFeedback(profile.id),
      ]);
      setHistory(availabilityHistory);
      setFeedback(customerFeedback);
    } catch (loadError) {
      setDetailsError(loadError instanceof Error ? loadError.message : 'Unable to load your profile history.');
    }
  }, [profile?.id]);

  useEffect(() => {
    let active = true;
    setAvatarUrl(profile?.avatar_url ?? null);
    setAvatarFailed(false);
    if (!profile?.id) return () => { active = false; };
    Promise.all([
      getDriverAvailabilityHistory(profile.id),
      getDriverFeedback(profile.id),
    ]).then(([availabilityHistory, customerFeedback]) => {
      if (!active) return;
      setHistory(availabilityHistory);
      setFeedback(customerFeedback);
      setDetailsError('');
    }).catch((loadError: unknown) => {
      if (!active) return;
      setDetailsError(loadError instanceof Error ? loadError.message : 'Unable to load your profile history.');
    });
    return () => { active = false; };
  }, [profile?.id, profile?.avatar_url]);

  const refreshDetails = async () => {
    setRefreshing(true);
    await loadDetails();
    await onProfileUpdated();
    setRefreshing(false);
  };

  const changeAvailability = async (status: Exclude<DriverAvailability, 'on_delivery'>) => {
    setBusy(true);
    setDetailsError('');
    setNotice('');
    try {
      await setDriverAvailability(status);
      await onProfileUpdated();
      await loadDetails();
      setNotice(`Availability updated to ${status.replace('_', ' ')}.`);
    } catch (updateError) {
      setDetailsError(updateError instanceof Error ? updateError.message : 'Unable to update availability.');
    } finally {
      setBusy(false);
    }
  };

  const chooseAvatar = async () => {
    setBusy(true);
    setDetailsError('');
    setNotice('');
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
      });
      if (result.didCancel) return;
      if (result.errorCode) throw new Error(result.errorMessage || 'Could not open your photo library.');
      const asset = result.assets?.[0];
      if (!asset?.base64) throw new Error('The selected photo could not be read. Please choose another image.');

      const saved = await updateDriverAvatar(userId, avatarUrl, {
        base64: asset.base64,
        fileName: asset.fileName || `profile-${Date.now()}.jpg`,
        mimeType: asset.type || 'image/jpeg',
      });
      setAvatarUrl(saved.avatarUrl);
      setAvatarFailed(false);
      setNotice(saved.warning ?? 'Profile photo updated.');
      await onProfileUpdated();
    } catch (photoError) {
      setDetailsError(photoError instanceof Error ? photoError.message : 'Unable to update your profile photo.');
    } finally {
      setBusy(false);
    }
  };

  const averageRating = feedback.length
    ? feedback.reduce((total, entry) => total + entry.rating, 0) / feedback.length
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>NMD LOGISTICS</Text>
        <Text style={styles.title}>My profile</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refreshDetails()}
            tintColor={colors.blue}
            colors={[colors.blue]}
          />
        }
      >
        <InlineError message={error || detailsError} />
        {notice ? <Text accessibilityRole="status" style={styles.notice}>{notice}</Text> : null}

        <View style={styles.identityCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={avatarUrl && !avatarFailed ? 'View profile photo' : 'Add profile photo'}
            disabled={busy}
            onPress={() => {
              if (avatarUrl && !avatarFailed) setAvatarPreviewVisible(true);
              else chooseAvatar();
            }}
            style={styles.avatarButton}
          >
            {avatarUrl && !avatarFailed ? (
              <Image
                accessibilityLabel="Profile photo"
                onError={() => setAvatarFailed(true)}
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || 'D'}</Text>
              </View>
            )}
            <Text style={styles.photoHint}>{avatarUrl && !avatarFailed ? 'Tap to view' : 'Add photo'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            disabled={busy}
            onPress={() => chooseAvatar()}
            style={styles.changePhotoButton}
          >
            <Text style={styles.photoHint}>{busy ? 'Please wait…' : 'Change photo'}</Text>
          </Pressable>
          <Text style={styles.name}>{profile?.full_name || 'Delivery driver'}</Text>
          <Text style={styles.email}>{email || profile?.email || 'No email on account'}</Text>
          <Text style={styles.contact}>{profile?.phone || 'No phone number on account'}</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>{displayedStatus.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        <Modal
          animationType="fade"
          onRequestClose={() => setAvatarPreviewVisible(false)}
          statusBarTranslucent
          transparent
          visible={avatarPreviewVisible && Boolean(avatarUrl)}
        >
          <View style={styles.photoPreviewBackdrop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close profile photo"
              onPress={() => setAvatarPreviewVisible(false)}
              style={styles.photoPreviewClose}
            >
              <Text style={styles.photoPreviewCloseText}>×</Text>
            </Pressable>
            {avatarUrl ? (
              <Image
                accessibilityLabel="Full-size profile photo"
                onError={() => {
                  setAvatarFailed(true);
                  setAvatarPreviewVisible(false);
                  setDetailsError('Could not load your profile photo. Check your connection and try again.');
                }}
                resizeMode="contain"
                source={{ uri: avatarUrl }}
                style={styles.photoPreviewImage}
              />
            ) : null}
          </View>
        </Modal>

        <Text style={styles.sectionTitle}>Availability</Text>
        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityHelp}>
            {activeAssignments.length
              ? 'Finish or decline your active assignments before changing availability.'
              : 'Let dispatch know when you are ready to receive work.'}
          </Text>
          <View style={styles.availabilityOptions}>
            {availabilityOptions.map((option) => {
              const selected = profile?.current_status === option.value && activeAssignments.length === 0;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Set availability to ${option.label}`}
                  accessibilityState={{ disabled: busy || activeAssignments.length > 0, selected }}
                  disabled={busy || activeAssignments.length > 0}
                  onPress={() => changeAvailability(option.value)}
                  style={[styles.availabilityOption, selected && styles.availabilitySelected,
                    (busy || activeAssignments.length > 0) && styles.availabilityDisabled]}
                >
                  <Text style={[styles.availabilityText, selected && styles.availabilityTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Delivery overview</Text>
        <View style={styles.statsCard}>
          <Stat value={String(profile?.total_deliveries_completed ?? 0)} label="Completed" colors={colors} />
          <View style={styles.statDivider} />
          <Stat value={String(activeAssignments.length)} label="Active" colors={colors} />
          <View style={styles.statDivider} />
          <Stat value={profile?.rating ? Number(profile.rating).toFixed(1) : '—'} label="Rating" colors={colors} />
        </View>

        <Text style={styles.sectionTitle}>Driver information</Text>
        <View style={styles.detailsCard}>
          <DetailRow label="Employee ID" value={profile?.employee_id || 'Not set'} colors={colors} />
          <DetailRow label="Vehicle type" value={profile?.vehicle_type || 'Not set'} colors={colors} />
          <DetailRow label="Vehicle number" value={profile?.vehicle_number || 'Not set'} colors={colors} last />
        </View>

        <Text style={styles.sectionTitle}>Availability history</Text>
        <View style={styles.detailsCard}>
          {history.length ? history.map((entry, index) => (
            <DetailRow
              key={entry.id}
              label={new Date(entry.changed_at).toLocaleString()}
              value={`${entry.previous_status.replace(/_/g, ' ')} → ${entry.new_status.replace(/_/g, ' ')}`}
              colors={colors}
              last={index === history.length - 1}
            />
          )) : (
            <Text style={styles.emptyText}>Availability changes will appear here.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Customer feedback</Text>
        <View style={styles.feedbackCard}>
          <Text style={styles.ratingSummary}>
            {averageRating === null ? 'No customer ratings yet' : `★ ${averageRating.toFixed(1)} average · ${feedback.length} ratings`}
          </Text>
          {feedback.length ? feedback.slice(0, 5).map((entry) => (
            <View key={entry.id} style={styles.feedbackItem}>
              <View style={styles.feedbackTop}>
                <Text style={styles.feedbackOrder}>{entry.order_number}</Text>
                <Text style={styles.feedbackRating}>{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</Text>
              </View>
              <Text style={styles.feedbackDate}>{new Date(entry.submitted_at).toLocaleDateString()}</Text>
              {entry.review ? <Text style={styles.feedbackReview}>{entry.review}</Text> : null}
            </View>
          )) : (
            <Text style={styles.emptyText}>Customer ratings and reviews will show here.</Text>
          )}
        </View>

        <View style={styles.signOutCard}>
          <Text style={styles.signOutTitle}>App preferences</Text>
          <Text style={styles.signOutText}>Choose your appearance and view app information.</Text>
          <ActionButton label="Open settings" onPress={onOpenSettings} variant="secondary" />
        </View>

        <View style={styles.signOutCard}>
          <Text style={styles.signOutTitle}>Account</Text>
          <Text style={styles.signOutText}>Sign out of this device when you are finished.</Text>
          <ActionButton label="Sign out" onPress={onSignOut} variant="secondary" />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, colors }: { value: string; label: string; colors: AppColors }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
  last = false,
}: {
  label: string;
  value: string;
  colors: AppColors;
  last?: boolean;
}) {
  const styles = createStyles(colors);
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Text numberOfLines={2} style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  brand: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  identityCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 20,
  },
  avatarButton: {
    alignItems: 'center',
    gap: 5,
  },
  changePhotoButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  avatar: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 56,
    backgroundColor: colors.paleGold,
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.paleGold,
  },
  avatarText: {
    color: colors.navy,
    fontSize: 25,
    fontWeight: '900',
  },
  photoHint: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  photoPreviewBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.94)',
    padding: 18,
  },
  photoPreviewClose: {
    position: 'absolute',
    zIndex: 1,
    top: 24,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  photoPreviewCloseText: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
  },
  photoPreviewImage: {
    width: '100%',
    height: '82%',
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  contact: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: colors.paleGreen,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  activeText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  availabilityCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 14,
  },
  availabilityHelp: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  availabilityOptions: {
    flexDirection: 'row',
    gap: 7,
  },
  availabilityOption: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  availabilitySelected: {
    borderColor: colors.blue,
    backgroundColor: colors.paleBlue,
  },
  availabilityDisabled: {
    opacity: 0.55,
  },
  availabilityText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  availabilityTextSelected: {
    color: colors.blue,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingVertical: 17,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
  },
  detailRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
  },
  detailValue: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  feedbackCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 15,
  },
  ratingSummary: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackItem: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  feedbackTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackOrder: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackRating: {
    color: colors.warning,
    fontSize: 13,
  },
  feedbackDate: {
    color: colors.muted,
    fontSize: 11,
  },
  feedbackReview: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 14,
  },
  notice: {
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    backgroundColor: colors.paleGreen,
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    padding: 12,
  },
  signOutCard: {
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 15,
    marginTop: 4,
  },
  signOutTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  signOutText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
});
