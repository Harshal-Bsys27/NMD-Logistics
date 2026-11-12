import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DriverDeliveryProof } from '../types';
import { getDriverDeliveryProofs } from '../services/driver';
import { useAppTheme } from '../theme';
import InlineError from '../components/InlineError';

export default function ProofsScreen({ driverId }: { driverId: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [proofs, setProofs] = useState<DriverDeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProofs = useCallback(async () => {
    if (!driverId) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      setProofs(await getDriverDeliveryProofs(driverId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load delivery proofs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadProofs();
  }, [loadProofs]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>NMD LOGISTICS</Text>
        <Text style={styles.title}>Proof of delivery</Text>
        <Text style={styles.subtitle}>Recipient records and delivery photos</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProofs();
            }}
            tintColor={colors.blue}
            colors={[colors.blue]}
          />
        }
      >
        <InlineError message={error} />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.muted}>Loading your delivery records…</Text>
          </View>
        ) : proofs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>No proof records yet</Text>
            <Text style={styles.muted}>
              Complete an active delivery with the recipient’s name to save a proof of delivery.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{proofs.length} recent delivery {proofs.length === 1 ? 'record' : 'records'}</Text>
            {proofs.map((proof) => (
              <View key={proof.id} style={styles.proofCard}>
                <View style={styles.proofHeader}>
                  <View style={styles.proofHeading}>
                    <Text style={styles.orderNumber}>{proof.order_number}</Text>
                    <Text numberOfLines={1} style={styles.clientName}>{proof.client_name}</Text>
                  </View>
                  <View style={styles.deliveredPill}>
                    <Text style={styles.deliveredText}>DELIVERED</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Received by</Text>
                  <Text style={styles.detailValue}>{proof.recipient_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivered</Text>
                  <Text style={styles.detailValue}>{new Date(proof.delivered_at).toLocaleString()}</Text>
                </View>
                {proof.notes ? (
                  <View style={styles.notes}>
                    <Text style={styles.detailLabel}>Delivery notes</Text>
                    <Text style={styles.noteText}>{proof.notes}</Text>
                  </View>
                ) : null}
                {proof.signature_exception_reason ? (
                  <View style={styles.notes}>
                    <Text style={styles.detailLabel}>No-signature exception</Text>
                    <Text style={styles.noteText}>{proof.signature_exception_reason}</Text>
                  </View>
                ) : null}
                {proof.signature_url ? (
                  <View style={styles.signatureBlock}>
                    <Text style={styles.detailLabel}>Recipient acknowledgement</Text>
                    <Image
                      accessibilityLabel={`Recipient signature for ${proof.order_number}`}
                      source={{ uri: proof.signature_url }}
                      style={styles.signature}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
                {proof.photo_url ? (
                  <Image
                    accessibilityLabel={`Proof photo for ${proof.order_number}`}
                    source={{ uri: proof.photo_url }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.noPhoto}>No photo was attached to this delivery.</Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
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
  subtitle: {
    color: '#D5DCEE',
    fontSize: 13,
    marginTop: 5,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  countText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  proofCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 14,
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  proofHeading: {
    flex: 1,
    gap: 3,
  },
  orderNumber: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
  },
  clientName: {
    color: colors.muted,
    fontSize: 12,
  },
  deliveredPill: {
    borderRadius: 99,
    backgroundColor: colors.paleGreen,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  deliveredText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  detailValue: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  notes: {
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  noteText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  photo: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  signatureBlock: {
    gap: 6,
  },
  signature: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  noPhoto: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 24,
  },
  emptyIcon: {
    color: colors.success,
    fontSize: 30,
    fontWeight: '900',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    padding: 28,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
