import { decode } from 'base64-arraybuffer';
import Config from 'react-native-config';
import { supabase } from '../lib/supabase';
import type {
  DriverAssignment,
  DriverAvailability,
  DriverAvailabilityHistory,
  DriverDeliveryProof,
  DriverFeedback,
  DriverProfile,
  ProofPhoto,
} from '../types';

export async function getDriverProfile(userId: string): Promise<DriverProfile> {
  const { data: account, error: accountError } = await supabase
    .from('users')
    .select('role, status, full_name, email, phone, avatar_url')
    .eq('id', userId)
    .single();

  if (accountError || !account) {
    throw new Error(`Could not verify your account: ${accountError?.message ?? 'Account not found.'}`);
  }
  if (account.role !== 'delivery_personnel') {
    await supabase.auth.signOut();
    throw new Error('This app is for NMD delivery personnel. Sign in with your driver account.');
  }
  if (account.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Your account is not active. Contact your NMD administrator.');
  }

  const { data: driver, error: driverError } = await supabase
    .from('delivery_personnel')
    .select('id, employee_id, current_status, vehicle_type, vehicle_number, total_deliveries_completed, rating')
    .eq('user_id', userId)
    .single();

  if (driverError || !driver) {
    throw new Error(`Could not load your driver profile: ${driverError?.message ?? 'Driver profile not found.'}`);
  }

  return {
    ...driver,
    full_name: account.full_name ?? '',
    email: account.email,
    phone: account.phone,
    avatar_url: account.avatar_url,
  };
}

export async function setDriverAvailability(status: Exclude<DriverAvailability, 'on_delivery'>): Promise<void> {
  const { error } = await supabase.rpc('set_my_driver_availability', { p_status: status });
  if (error) {
    throw new Error(error.code === 'PGRST202'
      ? `Availability updates are not enabled in the connected Supabase project. Apply the driver availability migration. ${error.message}`
      : error.message);
  }
}

async function requestCustomerFeedbackEmail(
  assignmentId: string,
): Promise<{ status: 'sent' | 'skipped' | 'failed'; error: string | null }> {
  const appUrl = Config.NMD_WEB_APP_URL?.trim();
  if (!appUrl) {
    return { status: 'failed', error: 'NMD_WEB_APP_URL is not configured in the driver app.' };
  }

  let endpoint: URL;
  try {
    endpoint = new URL('/api/customer-feedback/notifications', appUrl);
  } catch {
    return { status: 'failed', error: 'NMD_WEB_APP_URL must be a valid absolute HTTP or HTTPS URL.' };
  }
  if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
    return { status: 'failed', error: 'NMD_WEB_APP_URL must use HTTP or HTTPS.' };
  }

  try {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { status: 'failed', error: `Could not verify your sign-in: ${sessionError.message}` };
    const accessToken = data.session?.access_token;
    if (!accessToken) return { status: 'failed', error: 'Your sign-in expired; the customer email needs to be retried.' };

    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignment_id: assignmentId }),
    });

    let result: { status?: unknown; error?: unknown };
    try {
      result = await response.json() as typeof result;
    } catch {
      return { status: 'failed', error: `The notification service returned an invalid response (HTTP ${response.status}).` };
    }
    if (!response.ok && result.status !== 'skipped') {
      return {
        status: 'failed',
        error: typeof result.error === 'string' ? result.error : 'The customer email could not be sent.',
      };
    }
    if (result.status !== 'sent' && result.status !== 'skipped') {
      return { status: 'failed', error: 'The notification service returned an unknown status.' };
    }
    return { status: result.status, error: null };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'The customer email could not be sent.',
    };
  }
}

export async function getDriverAvailabilityHistory(driverId: string): Promise<DriverAvailabilityHistory[]> {
  const { data, error } = await supabase
    .from('driver_availability_history')
    .select('id, previous_status, new_status, changed_at')
    .eq('driver_id', driverId)
    .order('changed_at', { ascending: false })
    .limit(6);

  if (error) throw new Error(`Could not load availability history: ${error.message}`);
  return data ?? [];
}

export async function getDriverFeedback(driverId: string): Promise<DriverFeedback[]> {
  const { data, error } = await supabase
    .from('delivery_feedback')
    .select('id, order_id, assignment_id, rating, review, submitted_at, order:orders(order_number)')
    .eq('personnel_id', driverId)
    .order('submitted_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Could not load customer feedback: ${error.message}`);
  return (data ?? []).map((row) => {
    const order = Array.isArray(row.order) ? row.order[0] : row.order;
    return {
      id: row.id,
      order_id: row.order_id,
      assignment_id: row.assignment_id,
      rating: row.rating,
      review: row.review,
      submitted_at: row.submitted_at,
      order_number: order?.order_number ?? 'Delivery',
    };
  });
}

export async function getDriverDeliveryProofs(driverId: string): Promise<DriverDeliveryProof[]> {
  const { data, error } = await supabase
    .from('delivery_proofs')
    .select('id, assignment_id, order_id, recipient_name, notes, photo_path, recipient_signature_path, signature_exception_reason, delivered_at, order:orders(order_number, client_name)')
    .eq('personnel_id', driverId)
    .order('delivered_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Could not load delivery proofs: ${error.message}`);

  return Promise.all((data ?? []).map(async (row) => {
    let photoUrl: string | null = null;
    let signatureUrl: string | null = null;
    if (row.photo_path) {
      const { data: signedPhoto, error: photoError } = await supabase.storage
        .from('delivery-proofs')
        .createSignedUrl(row.photo_path, 60 * 60);
      if (photoError) throw new Error(`Could not open proof photo for ${row.order_id}: ${photoError.message}`);
      photoUrl = signedPhoto.signedUrl;
    }
    if (row.recipient_signature_path) {
      const { data: signedSignature, error: signatureError } = await supabase.storage
        .from('delivery-proofs')
        .createSignedUrl(row.recipient_signature_path, 60 * 60);
      if (signatureError) throw new Error(`Could not open recipient signature for ${row.order_id}: ${signatureError.message}`);
      signatureUrl = signedSignature.signedUrl;
    }

    const order = Array.isArray(row.order) ? row.order[0] : row.order;
    return {
      id: row.id,
      assignment_id: row.assignment_id,
      order_id: row.order_id,
      recipient_name: row.recipient_name,
      notes: row.notes,
      photo_url: photoUrl,
      signature_url: signatureUrl,
      signature_exception_reason: row.signature_exception_reason,
      delivered_at: row.delivered_at,
      order_number: order?.order_number ?? 'Delivery',
      client_name: order?.client_name ?? 'Client',
    };
  }));
}

export async function updateDriverAvatar(
  userId: string,
  previousAvatarUrl: string | null,
  photo: ProofPhoto,
): Promise<{ avatarUrl: string; warning: string | null }> {
  const supportedTypes: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = supportedTypes[photo.mimeType];
  if (!extension) throw new Error('Choose a JPG, PNG, or WebP profile photo.');
  if (photo.base64.length * 0.75 > 5 * 1024 * 1024) {
    throw new Error('The profile photo must be 5 MB or smaller.');
  }

  const objectPath = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('profile-avatars')
    .upload(objectPath, decode(photo.base64), {
      cacheControl: '3600',
      contentType: photo.mimeType,
      upsert: false,
    });
  if (uploadError) throw new Error(`Could not upload profile photo: ${uploadError.message}`);

  const avatarUrl = `${supabase.storage.from('profile-avatars').getPublicUrl(objectPath).data.publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id')
    .single();

  if (updateError) {
    const { error: cleanupError } = await supabase.storage.from('profile-avatars').remove([objectPath]);
    if (cleanupError) {
      throw new Error(`Could not save your profile photo: ${updateError.message}. The new upload could not be removed: ${cleanupError.message}`);
    }
    throw new Error(`Could not save your profile photo: ${updateError.message}`);
  }

  const previousObjectPath = getOwnedAvatarPath(previousAvatarUrl, userId);
  let warning: string | null = null;
  if (previousObjectPath && previousObjectPath !== objectPath) {
    const { error: cleanupError } = await supabase.storage
      .from('profile-avatars')
      .remove([previousObjectPath]);
    if (cleanupError) {
      warning = `Photo updated, but the previous photo could not be removed: ${cleanupError.message}`;
    }
  }

  return { avatarUrl, warning };
}

function getOwnedAvatarPath(avatarUrl: string | null, userId: string): string | null {
  if (!avatarUrl) return null;
  try {
    const avatar = new URL(avatarUrl);
    const project = new URL(supabase.storage.from('profile-avatars').getPublicUrl('').data.publicUrl);
    const prefix = '/storage/v1/object/public/profile-avatars/';
    if (avatar.origin !== project.origin || !avatar.pathname.startsWith(prefix)) return null;
    const objectPath = decodeURIComponent(avatar.pathname.slice(prefix.length));
    return objectPath.startsWith(`${userId}/`) ? objectPath : null;
  } catch {
    return null;
  }
}

async function requestCustomerTrackingNotification(
  orderId: string,
  event: 'in_transit',
): Promise<string | null> {
  const appUrl = Config.NMD_WEB_APP_URL?.trim();
  if (!appUrl) return 'NMD_WEB_APP_URL is not configured in the driver app.';

  let endpoint: URL;
  try {
    endpoint = new URL('/api/customer-tracking/notifications', appUrl);
  } catch {
    return 'NMD_WEB_APP_URL must be a valid absolute HTTP or HTTPS URL.';
  }
  if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
    return 'NMD_WEB_APP_URL must use HTTP or HTTPS.';
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return `Could not verify your sign-in: ${error.message}`;
    const accessToken = data.session?.access_token;
    if (!accessToken) return 'Your sign-in expired; the customer update could not be sent.';

    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId, event }),
    });
    const result = await response.json() as { status?: unknown; error?: unknown };
    if (response.ok && ['sent', 'already_sent', 'skipped'].includes(String(result.status))) return null;
    return typeof result.error === 'string'
      ? result.error
      : `The customer update could not be sent (HTTP ${response.status}).`;
  } catch (error) {
    return error instanceof Error ? error.message : 'The customer update could not be sent.';
  }
}

export async function getDriverAssignments(driverId: string): Promise<DriverAssignment[]> {
  const { data, error } = await supabase
    .from('order_assignments')
    .select(`
      id,
      order_id,
      personnel_id,
      status,
      assigned_at,
      accepted_at,
      started_at,
      estimated_duration_minutes,
      notes,
      order:orders (
        id,
        order_number,
        client_name,
        client_phone,
        pickup_location,
        delivery_location,
        package_description,
        package_weight,
        special_instructions
      )
    `)
    .eq('personnel_id', driverId)
    .order('assigned_at', { ascending: false });

  if (error) throw new Error(`Could not load your assignments: ${error.message}`);

  return (data ?? []).flatMap((row) => {
    const order = Array.isArray(row.order) ? row.order[0] : row.order;
    return order ? [{ ...row, order }] : [];
  });
}

export async function updateAssignmentStatus(
  assignment: DriverAssignment,
  nextStatus: 'accepted' | 'rejected' | 'in_progress',
): Promise<string | null> {
  const now = new Date().toISOString();
  const update: Record<string, string> = {
    status: nextStatus,
    updated_at: now,
  };
  if (nextStatus === 'accepted') update.accepted_at = now;
  if (nextStatus === 'in_progress') update.started_at = now;

  const { error } = await supabase
    .from('order_assignments')
    .update(update)
    .eq('id', assignment.id)
    .select('id')
    .single();

  if (error) throw new Error(`Could not update this assignment: ${error.message}`);
  if (nextStatus === 'in_progress') {
    return requestCustomerTrackingNotification(assignment.order_id, 'in_transit');
  }
  return null;
}

export async function completeAssignment(input: {
  assignment: DriverAssignment;
  recipientName: string;
  notes: string;
  photo: ProofPhoto | null;
  signature: ProofPhoto | null;
  signatureExceptionReason: string;
}): Promise<{ notificationStatus: 'sent' | 'skipped' | 'failed'; notificationError: string | null }> {
  let photoPath: string | null = null;
  let signaturePath: string | null = null;
  let keepUploads = false;
  let completionConfirmed = false;

  try {
    const uploadProofFile = async (file: ProofPhoto, path: string, acceptedTypes: string[]) => {
      if (!acceptedTypes.includes(file.mimeType)) throw new Error('Choose a JPG, PNG, or WebP proof image.');
      if (file.base64.length * 0.75 > 8 * 1024 * 1024) throw new Error('The proof image must be 8 MB or smaller.');
      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(path, decode(file.base64), {
          contentType: file.mimeType,
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) throw new Error(`Could not upload proof image: ${uploadError.message}`);
    };

    if (input.photo) {
      const extension = input.photo.mimeType === 'image/png' ? 'png' : input.photo.mimeType === 'image/webp' ? 'webp' : 'jpg';
      photoPath = `${input.assignment.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      await uploadProofFile(input.photo, photoPath, ['image/jpeg', 'image/png', 'image/webp']);
    }
    if (input.signature) {
      if (input.signature.mimeType !== 'image/png') throw new Error('The recipient signature must be a PNG image.');
      signaturePath = `${input.assignment.id}/signature-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      await uploadProofFile(input.signature, signaturePath, ['image/png']);
    }

    const { data, error } = await supabase.rpc('complete_assignment_with_proof', {
      p_assignment_id: input.assignment.id,
      p_recipient_name: input.recipientName.trim(),
      p_notes: input.notes.trim() || null,
      p_photo_path: photoPath,
      p_recipient_signature_path: signaturePath,
      p_signature_exception_reason: input.signatureExceptionReason.trim() || null,
    });

    if (error || !data) {
      const { data: existingProof, error: verifyError } = await supabase
        .from('delivery_proofs')
        .select('id, photo_path, recipient_signature_path')
        .eq('assignment_id', input.assignment.id)
        .maybeSingle();

      if (existingProof) {
        completionConfirmed = true;
        keepUploads = (photoPath !== null && existingProof.photo_path === photoPath)
          || (signaturePath !== null && existingProof.recipient_signature_path === signaturePath);
      }
      if (verifyError) {
        keepUploads = true;
        throw new Error(`Completion could not be verified. Refresh before retrying.${photoPath || signaturePath ? ' Uploaded proof files have been retained.' : ''}`);
      }
      if (!existingProof) {
        if (error) throw new Error(error.message);
        throw new Error('Delivery completion returned no proof record.');
      }
    } else {
      completionConfirmed = true;
    }

    const notification = await requestCustomerFeedbackEmail(input.assignment.id);
    return {
      notificationStatus: notification.status,
      notificationError: notification.error,
    };
  } catch (error) {
    const uploadedPaths = [photoPath, signaturePath].filter((path): path is string => !!path);
    if (uploadedPaths.length && !keepUploads && !completionConfirmed) {
      const { error: cleanupError } = await supabase.storage.from('delivery-proofs').remove(uploadedPaths);
      if (cleanupError) {
        const message = error instanceof Error ? error.message : 'Unable to complete delivery.';
        throw new Error(`${message} Uploaded proof files could not be removed; contact an administrator.`);
      }
    }
    throw error;
  }
}
