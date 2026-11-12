import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { supabase } from '../lib/supabase';
import type { DeliveryExceptionReason, DriverAssignment, ProofPhoto } from '../types';
import { useAppTheme } from '../theme';
import ActionButton from '../components/ActionButton';
import InlineError from '../components/InlineError';
import {
  completeAssignment,
  reportDeliveryException,
  updateAssignmentStatus,
} from '../services/driver';

interface AssignmentDetailScreenProps {
  assignment: DriverAssignment;
  onBack: () => void;
  onUpdated: () => Promise<void>;
  error: string;
  onClearError: () => void;
}

export default function AssignmentDetailScreen({
  assignment,
  onBack,
  onUpdated,
  error,
  onClearError,
}: AssignmentDetailScreenProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ProofPhoto | null>(null);
  const [signature, setSignature] = useState<ProofPhoto | null>(null);
  const [signatureException, setSignatureException] = useState(false);
  const [signatureExceptionReason, setSignatureExceptionReason] = useState('');
  const [showProofForm, setShowProofForm] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionReason, setExceptionReason] = useState<DeliveryExceptionReason>('customer_unavailable');
  const [exceptionNotes, setExceptionNotes] = useState('');
  const [exceptionPhoto, setExceptionPhoto] = useState<ProofPhoto | null>(null);
  const statusLabel = assignment.status.replace(/_/g, ' ');

  const exceptionReasons: Array<{ value: DeliveryExceptionReason; label: string }> = [
    { value: 'customer_unavailable', label: 'Customer unavailable' },
    { value: 'address_issue', label: 'Address issue' },
    { value: 'customer_refused', label: 'Customer refused delivery' },
    { value: 'access_blocked', label: 'Could not access location' },
    { value: 'vehicle_issue', label: 'Vehicle issue' },
    { value: 'package_issue', label: 'Package issue' },
    { value: 'other', label: 'Other' },
  ];

  const runStatusAction = async (nextStatus: 'accepted' | 'rejected' | 'in_progress') => {
    setBusy(true);
    setActionError('');
    try {
      const notificationError = await updateAssignmentStatus(assignment, nextStatus);
      await onUpdated();
      if (notificationError && nextStatus === 'in_progress') {
        Alert.alert(
          'Delivery started',
          `Your status was updated, but the customer email needs attention: ${notificationError}`,
        );
      }
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : 'Unable to update assignment.');
    } finally {
      setBusy(false);
    }
  };

  const capturePhoto = async () => {
    setActionError('');
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        saveToPhotos: false,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        setActionError(result.errorMessage || 'Could not open the camera.');
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.base64) {
        setActionError('The camera did not return a usable photo. Please try again.');
        return;
      }
      if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        setActionError('Choose a photo smaller than 8 MB.');
        return;
      }
      setPhoto({
        base64: asset.base64,
        fileName: asset.fileName || `proof-${Date.now()}.jpg`,
        mimeType: asset.type || 'image/jpeg',
      });
    } catch (cameraError) {
      setActionError(cameraError instanceof Error ? cameraError.message : 'Unable to open the camera.');
    }
  };

  const captureExceptionPhoto = async () => {
    setActionError('');
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.8,
        saveToPhotos: false,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        setActionError(result.errorMessage || 'Could not open the camera.');
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.base64) {
        setActionError('The camera did not return a usable photo. Please try again.');
        return;
      }
      if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        setActionError('Choose a photo smaller than 8 MB.');
        return;
      }
      setExceptionPhoto({
        base64: asset.base64,
        fileName: asset.fileName || `exception-${Date.now()}.jpg`,
        mimeType: asset.type || 'image/jpeg',
      });
    } catch (cameraError) {
      setActionError(cameraError instanceof Error ? cameraError.message : 'Unable to open the camera.');
    }
  };

  const submitDeliveryException = async () => {
    if (exceptionNotes.trim().length > 1000) {
      setActionError('Issue notes must be 1000 characters or fewer.');
      return;
    }

    setBusy(true);
    setActionError('');
    try {
      const result = await reportDeliveryException({
        assignment,
        reason: exceptionReason,
        notes: exceptionNotes,
        photo: exceptionPhoto,
      });
      await onUpdated();
      Alert.alert(
        'Delivery issue recorded',
        result.notificationError
          ? `Dispatch has been notified. The customer email needs attention: ${result.notificationError}`
          : 'Dispatch has been notified. The order is now in the delivery issues queue.',
      );
    } catch (reportError) {
      setActionError(reportError instanceof Error ? reportError.message : 'Unable to report the delivery issue.');
    } finally {
      setBusy(false);
    }
  };

  const submitProof = async () => {
    if (!recipientName.trim()) {
      setActionError('Enter the name of the person who received the delivery.');
      return;
    }
    if (recipientName.trim().length > 120 || notes.trim().length > 1000) {
      setActionError('Recipient name must be 120 characters or fewer and notes must be 1000 characters or fewer.');
      return;
    }
    if (!signatureException && !signature) {
      setActionError('Ask the recipient to sign, or select the no-signature exception and provide a reason with a proof photo.');
      return;
    }
    if (signatureException && (!photo || signatureExceptionReason.trim().length < 10)) {
      setActionError('A proof photo and a reason of at least 10 characters are required when the recipient cannot sign.');
      return;
    }
    if (signatureExceptionReason.trim().length > 300) {
      setActionError('The no-signature reason must be 300 characters or fewer.');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setActionError(authError?.message || 'Your sign-in expired. Sign in again to continue.');
      return;
    }

    setBusy(true);
    setActionError('');
    try {
      const completion = await completeAssignment({
        assignment,
        recipientName,
        notes,
        photo,
        signature: signatureException ? null : signature,
        signatureExceptionReason: signatureException ? signatureExceptionReason : '',
      });
      await onUpdated();
      if (completion.notificationStatus === 'failed') {
        Alert.alert(
          'Delivery completed',
          `Proof was saved, but the customer email needs attention. An administrator can retry it.${completion.notificationError ? `\n\n${completion.notificationError}` : ''}`,
        );
      } else if (completion.notificationStatus === 'skipped') {
        Alert.alert('Delivery completed', 'Proof was saved. No customer email was sent because email consent or a customer email address was not recorded.');
      }
    } catch (completionError) {
      setActionError(completionError instanceof Error ? completionError.message : 'Unable to complete delivery.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDecline = () => {
    Alert.alert(
      'Decline this assignment?',
      'Dispatch will be able to assign this delivery to another driver.',
      [
        { text: 'Keep assignment', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => { runStatusAction('rejected'); } },
      ],
    );
  };

  const openExternal = async (url: string, fallbackMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch (linkError) {
      setActionError(linkError instanceof Error ? linkError.message : fallbackMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to assignments" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerEyebrow}>DELIVERY DETAILS</Text>
          <Text numberOfLines={1} style={styles.headerTitle}>{assignment.order.order_number}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <InlineError message={error || actionError} onDismiss={error ? onClearError : () => setActionError('')} />

        <View style={styles.clientCard}>
          <Text style={styles.eyebrow}>CLIENT</Text>
          <Text style={styles.clientName}>{assignment.order.client_name}</Text>
          <Text style={styles.phone}>{assignment.order.client_phone}</Text>
          <View style={styles.quickActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openExternal(`tel:${assignment.order.client_phone}`, 'No phone app is available on this device.')}
              style={styles.quickAction}
            >
              <Text style={styles.quickActionText}>Call client</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => openExternal(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(assignment.order.delivery_location)}`, 'No maps app is available on this device.')}
              style={styles.quickAction}
            >
              <Text style={styles.quickActionText}>Navigate</Text>
            </Pressable>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Assignment status</Text>
            <Text style={styles.statusValue}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery route</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationMarker}>
              <Text style={styles.markerPickup}>A</Text>
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationValue}>{assignment.order.pickup_location}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationCard}>
            <View style={[styles.locationMarker, styles.deliveryMarker]}>
              <Text style={styles.markerDelivery}>B</Text>
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>DELIVERY</Text>
              <Text style={styles.locationValue}>{assignment.order.delivery_location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package & instructions</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PACKAGE WEIGHT</Text>
            <Text style={styles.infoValue}>
              {assignment.order.package_weight != null
                ? `${assignment.order.package_weight.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`
                : 'Not provided'}
            </Text>
          </View>
          {assignment.order.package_description ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>PACKAGE</Text>
              <Text style={styles.infoValue}>{assignment.order.package_description}</Text>
            </View>
          ) : null}
          {assignment.order.special_instructions ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>CUSTOMER INSTRUCTIONS</Text>
              <Text style={styles.infoValue}>{assignment.order.special_instructions}</Text>
            </View>
          ) : null}
          {assignment.notes ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>DISPATCH NOTES</Text>
              <Text style={styles.infoValue}>{assignment.notes}</Text>
            </View>
          ) : null}
        </View>

        {assignment.status === 'in_progress' && showExceptionForm && (
          <View style={styles.exceptionCard}>
            <Text style={styles.sectionTitle}>Report delivery issue</Text>
            <Text style={styles.proofHint}>This records the attempt and returns the order to dispatch. It does not mark the delivery complete.</Text>
            <Text style={styles.inputLabel}>Issue reason *</Text>
            <View style={styles.reasonOptions}>
              {exceptionReasons.map((reason) => (
                <Pressable
                  key={reason.value}
                  accessibilityRole="radio"
                  accessibilityLabel={reason.label}
                  accessibilityState={{ checked: exceptionReason === reason.value }}
                  onPress={() => setExceptionReason(reason.value)}
                  style={[styles.reasonOption, exceptionReason === reason.value && styles.reasonOptionSelected]}
                >
                  <Text style={[styles.reasonOptionText, exceptionReason === reason.value && styles.reasonOptionTextSelected]}>
                    {reason.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              accessibilityLabel="Delivery issue notes"
              maxLength={1000}
              multiline
              onChangeText={setExceptionNotes}
              placeholder="Add details for dispatch (optional)"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.notesInput]}
              textAlignVertical="top"
              value={exceptionNotes}
            />
            <Pressable accessibilityRole="button" onPress={() => captureExceptionPhoto()} style={styles.photoButton}>
              <Text style={styles.photoButtonText}>{exceptionPhoto ? 'Photo captured · tap to retake' : 'Add issue photo (optional)'}</Text>
            </Pressable>
            <ActionButton label="Submit delivery issue" loading={busy} onPress={() => submitDeliveryException()} />
            <ActionButton label="Back to delivery" variant="secondary" disabled={busy} onPress={() => setShowExceptionForm(false)} />
          </View>
        )}

        {assignment.status === 'in_progress' && showProofForm && (
          <View style={styles.proofCard}>
            <Text style={styles.sectionTitle}>Proof of delivery</Text>
            <Text style={styles.proofHint}>Confirm who received the package and ask them to sign for the delivery.</Text>
            <Text style={styles.inputLabel}>Recipient name *</Text>
            <TextInput
              accessibilityLabel="Recipient name"
              maxLength={120}
              onChangeText={setRecipientName}
              placeholder="Name of person who received it"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={recipientName}
            />
            <Text style={styles.inputLabel}>Delivery notes</Text>
            <TextInput
              accessibilityLabel="Delivery notes"
              maxLength={1000}
              multiline
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.notesInput]}
              textAlignVertical="top"
              value={notes}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: signatureException }}
              onPress={() => {
                setSignatureException((current) => !current);
                setSignature(null);
                setSignatureExceptionReason('');
              }}
              style={styles.exceptionToggle}
            >
              <View style={[styles.checkbox, signatureException && styles.checkboxChecked]}>
                {signatureException ? <Text style={styles.checkboxCheck}>✓</Text> : null}
              </View>
              <Text style={styles.exceptionText}>Recipient is unable or unwilling to sign</Text>
            </Pressable>
            {signatureException ? (
              <>
                <Text style={styles.inputLabel}>Reason for no signature *</Text>
                <TextInput
                  accessibilityLabel="Reason for no signature"
                  maxLength={300}
                  multiline
                  onChangeText={setSignatureExceptionReason}
                  placeholder="Explain why the recipient could not sign"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.notesInput]}
                  textAlignVertical="top"
                  value={signatureExceptionReason}
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Recipient signature *</Text>
                <View style={styles.signaturePad}>
                  <SignatureScreen
                    backgroundColor="#FFFFFF"
                    clearText="Clear"
                    confirmText="Save"
                    descriptionText="Recipient signature"
                    imageType="image/png"
                    nestedScrollEnabled
                    onClear={() => setSignature(null)}
                    onEmpty={() => setActionError('The signature is blank. Ask the recipient to sign before saving.')}
                    onOK={(dataUrl) => {
                      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl;
                      setSignature({
                        base64,
                        fileName: `signature-${Date.now()}.png`,
                        mimeType: 'image/png',
                      });
                      setActionError('');
                    }}
                    onError={(signatureError) => setActionError(signatureError instanceof Error ? signatureError.message : 'Unable to capture the recipient signature.')}
                    webStyle={signatureWebStyle}
                  />
                </View>
                <Text style={styles.proofHint}>{signature ? 'Signature saved. Tap Clear in the pad to replace it.' : 'The recipient can sign with a finger, then tap Save in the pad.'}</Text>
              </>
            )}
            <Pressable accessibilityRole="button" onPress={() => capturePhoto()} style={styles.photoButton}>
              <Text style={styles.photoButtonText}>{photo ? 'Photo captured · tap to retake' : signatureException ? 'Take proof photo (required)' : 'Take proof photo (optional)'}</Text>
            </Pressable>
            <ActionButton label="Confirm delivery" loading={busy} onPress={() => submitProof()} />
          </View>
        )}

        <View style={styles.actions}>
          {assignment.status === 'pending' && (
            <>
              <ActionButton label="Accept delivery" loading={busy} onPress={() => runStatusAction('accepted')} />
              <ActionButton label="Decline" variant="secondary" disabled={busy} onPress={confirmDecline} />
            </>
          )}
          {assignment.status === 'accepted' && (
            <ActionButton label="Start delivery" loading={busy} onPress={() => runStatusAction('in_progress')} />
          )}
          {assignment.status === 'in_progress' && !showProofForm && (
            <>
              {!showExceptionForm && <ActionButton label="Complete delivery" onPress={() => setShowProofForm(true)} />}
              {!showExceptionForm && (
                <ActionButton
                  label="Report delivery issue"
                  variant="secondary"
                  onPress={() => {
                    setShowProofForm(false);
                    setShowExceptionForm(true);
                  }}
                />
              )}
            </>
          )}
          {assignment.status === 'completed' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>Delivery completed</Text>
            </View>
          )}
          {assignment.status === 'failed' && (
            <View style={styles.neutralBanner}>
              <Text style={styles.neutralText}>Delivery issue recorded. Dispatch will review this order.</Text>
            </View>
          )}
          {assignment.status === 'rejected' && (
            <View style={styles.neutralBanner}>
              <Text style={styles.neutralText}>You declined this assignment.</Text>
            </View>
          )}
          {assignment.status === 'cancelled' && (
            <View style={styles.neutralBanner}>
              <Text style={styles.neutralText}>This assignment was cancelled by dispatch.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 36,
    marginTop: -4,
  },
  headerText: {
    minWidth: 0,
    flex: 1,
  },
  headerEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  headerSpacer: {
    width: 8,
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  clientCard: {
    borderRadius: 17,
    backgroundColor: colors.navy,
    padding: 18,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 6,
  },
  phone: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAction: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    marginTop: 16,
    paddingTop: 12,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statusValue: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  section: {
    gap: 9,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 14,
  },
  locationMarker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.paleBlue,
  },
  deliveryMarker: {
    backgroundColor: colors.paleGreen,
  },
  markerPickup: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  markerDelivery: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '900',
  },
  locationText: {
    minWidth: 0,
    flex: 1,
  },
  locationLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  locationValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 29,
    marginVertical: -8,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    padding: 13,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  proofCard: {
    gap: 11,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    backgroundColor: colors.paleBlue,
    padding: 15,
  },
  exceptionCard: {
    gap: 11,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    padding: 15,
  },
  reasonOptions: {
    gap: 7,
  },
  reasonOption: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
  },
  reasonOptionSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.paleBlue,
  },
  reasonOptionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  reasonOptionTextSelected: {
    color: colors.blue,
    fontWeight: '800',
  },
  proofHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  signaturePad: {
    height: 205,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  exceptionToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    borderColor: colors.blue,
    backgroundColor: colors.blue,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  exceptionText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
  },
  notesInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  photoButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  photoButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  actions: {
    gap: 9,
    marginTop: 2,
  },
  completedBanner: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.paleGreen,
    padding: 15,
  },
  completedText: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '800',
  },
  neutralBanner: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 15,
  },
  neutralText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const signatureWebStyle = `
  .m-signature-pad { position: relative; box-shadow: none; border: 0; }
  .m-signature-pad--body { height: calc(100% - 44px); border: 0; }
  .m-signature-pad--footer {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 44px;
    margin: 0;
    padding: 0 8px;
    background: #FFFFFF;
  }
  .m-signature-pad--footer .button { border-radius: 6px; font-size: 13px; font-weight: 700; }
  body, html { width: 100%; height: 100%; margin: 0; }
`;
