'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { assignmentService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useAuth } from '@/hooks/auth';
import SignatureCapture from '@/components/forms/SignatureCapture';
import { formatDate } from '@/utils/helpers';
import { getDriverRating } from '@/utils/driver-ratings';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Star,
  AlertTriangle,
  Camera,
  UserRound,
} from 'lucide-react';

import type { AssignmentStatus, DeliveryFeedback, DeliveryProof } from '@/types';

const vehicleEmojis: Record<string, string> = {
  bike: '🏍️',
  auto: '🛵',
  car: '🚗',
  van: '🚐',
  truck: '🚚',
};

function signatureDataUrlToFile(dataUrl: string) {
  const encoded = dataUrl.split(',')[1];
  if (!encoded) throw new Error('The recipient signature could not be read. Ask them to sign again.');
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], 'recipient-signature.png', { type: 'image/png' });
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const {
    assignments,
    orders,
    drivers,
    customerFeedback: allCustomerFeedback,
    isLoading,
    error,
    refresh,
  } = useOperationsData();
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [proof, setProof] = useState<DeliveryProof | null>(null);
  const [assignmentFeedback, setAssignmentFeedback] = useState<DeliveryFeedback | null>(null);
  const [feedbackLoadError, setFeedbackLoadError] = useState('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [proofSignatureUrl, setProofSignatureUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofLoadingError, setProofLoadingError] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);
  const [signatureException, setSignatureException] = useState(false);
  const [signatureExceptionReason, setSignatureExceptionReason] = useState('');
  const [proofSubmitLoading, setProofSubmitLoading] = useState(false);
  const [proofSubmitError, setProofSubmitError] = useState('');

  const assignment = assignments.find((a) => a.id === resolvedParams.id);
  const order = assignment ? orders.find((o) => o.id === assignment.order_id) : null;
  const driver = assignment ? drivers.find((d) => d.id === assignment.personnel_id) : null;
  const assignmentId = assignment?.id;

  useEffect(() => {
    let active = true;
    setProof(null);
    setProofPhotoUrl(null);
    setProofSignatureUrl(null);
    setAssignmentFeedback(null);
    setFeedbackLoadError('');
    if (!assignmentId) return () => { active = false; };

    const loadProof = async () => {
      setProofLoading(true);
      setProofLoadingError('');
      const result = await assignmentService.getProofByAssignmentId(assignmentId);
      if (!active) return;
      if (result.error) {
        setProofLoadingError(result.error);
        setProof(null);
        setProofPhotoUrl(null);
      } else {
        setProof(result.data);
        if (result.data?.photo_path) {
          const photoResult = await assignmentService.getProofPhotoUrl(result.data.photo_path);
          if (!active) return;
          if (photoResult.error) setProofLoadingError(photoResult.error);
          else setProofPhotoUrl(photoResult.data);
        } else {
          setProofPhotoUrl(null);
        }
        if (result.data?.recipient_signature_path) {
          const signatureResult = await assignmentService.getProofPhotoUrl(result.data.recipient_signature_path);
          if (!active) return;
          if (signatureResult.error) setProofLoadingError(signatureResult.error);
          else setProofSignatureUrl(signatureResult.data);
        } else {
          setProofSignatureUrl(null);
        }
        if (result.data) {
          const feedbackResult = await assignmentService.getFeedbackByAssignmentId(assignmentId);
          if (!active) return;
          if (feedbackResult.error) setFeedbackLoadError(feedbackResult.error);
          else setAssignmentFeedback(feedbackResult.data);
        } else {
          setAssignmentFeedback(null);
          setFeedbackLoadError('');
        }
      }
      setProofLoading(false);
    };

    void loadProof();
    return () => { active = false; };
  }, [assignmentId]);

  if (isLoading) {
    return (
      <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-10 w-32 rounded-md bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!assignment || !order || !driver || error) {
    return (
      <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="surface-glass rounded-lg border border-danger/30 bg-danger p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-danger-foreground" />
            <h1 className="mt-4 text-2xl font-bold text-danger-foreground">Assignment Not Found</h1>
            <p className="mt-2 text-danger-foreground">{error || "The assignment you're looking for doesn't exist."}</p>
            <Link
              href="/assignments"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<AssignmentStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-warning', text: 'text-warning-foreground', label: 'Pending' },
    accepted: { bg: 'bg-info', text: 'text-info-foreground', label: 'Accepted' },
    rejected: { bg: 'bg-danger', text: 'text-danger-foreground', label: 'Rejected' },
    in_progress: { bg: 'bg-info', text: 'text-info-foreground', label: 'In Progress' },
    completed: { bg: 'bg-success', text: 'text-success-foreground', label: 'Completed' },
    cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Cancelled' },
  };

  const handleStatusUpdate = async (newStatus: AssignmentStatus) => {
    setActionLoading(true);
    setActionError('');
    try {
      const result = await assignmentService.updateStatus(assignment.id, newStatus);
      if (result.error) throw new Error(result.error);
      await refresh(true);
      setActionMessage(`Assignment ${statusColors[newStatus].label}`);
      setTimeout(() => setActionMessage(null), 2500);
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Unable to update assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteWithProof = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProofSubmitError('');
    if (!recipientName.trim()) {
      setProofSubmitError('Enter the name of the person who received the delivery.');
      return;
    }
    if (recipientName.trim().length > 120 || deliveryNotes.length > 1000) {
      setProofSubmitError('Recipient name must be 120 characters or fewer and notes must be 1000 characters or fewer.');
      return;
    }
    if (!signatureException && !recipientSignature) {
      setProofSubmitError('Ask the recipient to sign, or select the no-signature exception and provide a reason with a proof photo.');
      return;
    }
    if (signatureException && (!proofPhoto || signatureExceptionReason.trim().length < 10)) {
      setProofSubmitError('A proof photo and a reason of at least 10 characters are required when the recipient cannot sign.');
      return;
    }
    if (signatureExceptionReason.trim().length > 300) {
      setProofSubmitError('The no-signature reason must be 300 characters or fewer.');
      return;
    }

    setProofSubmitLoading(true);
    try {
      const signatureFile = recipientSignature ? signatureDataUrlToFile(recipientSignature) : null;
      const result = await assignmentService.completeWithProof({
        assignmentId: assignment.id,
        recipientName,
        notes: deliveryNotes,
        photo: proofPhoto,
        signature: signatureFile,
        signatureExceptionReason: signatureException ? signatureExceptionReason : '',
      });
      if (result.error || !result.data) throw new Error(result.error || 'Unable to save proof of delivery.');
      setProof(result.data);
      if (result.data.photo_path) {
        const photoResult = await assignmentService.getProofPhotoUrl(result.data.photo_path);
        if (photoResult.error) setProofLoadingError(`Delivery completed, but proof photo could not be displayed: ${photoResult.error}`);
        else setProofPhotoUrl(photoResult.data);
      }
      if (result.data.recipient_signature_path) {
        const signatureResult = await assignmentService.getProofPhotoUrl(result.data.recipient_signature_path);
        if (signatureResult.error) setProofLoadingError(`Delivery completed, but recipient signature could not be displayed: ${signatureResult.error}`);
        else setProofSignatureUrl(signatureResult.data);
      }
      setProofPhoto(null);
      setRecipientSignature(null);
      setActionMessage(result.notificationStatus === 'sent'
        ? 'Delivery completed and customer email sent.'
        : result.notificationStatus === 'skipped'
          ? 'Delivery completed. No customer email was sent because consent or an email address is missing.'
          : 'Delivery completed. The customer email needs administrator attention.');
      if (result.notificationStatus === 'failed') {
        setActionError(result.notificationError || 'Customer email failed. An administrator can retry it from Customer Feedback.');
      }
      await refresh(true);
    } catch (submitError) {
      setProofSubmitError(submitError instanceof Error ? submitError.message : 'Unable to complete delivery.');
    } finally {
      setProofSubmitLoading(false);
    }
  };

  const isAssignedDriver = user?.role === 'delivery_personnel' && driver?.user_id === user.id;
  const canAccept = isAssignedDriver && assignment.status === 'pending';
  const canReject = isAssignedDriver && (assignment.status === 'pending' || assignment.status === 'accepted');
  const canStart = isAssignedDriver && assignment.status === 'accepted';
  const canComplete = isAssignedDriver && assignment.status === 'in_progress';
  const eta = assignment.started_at
    ? new Date(new Date(assignment.started_at).getTime() + (assignment.estimated_duration_minutes || 45) * 60 * 1000)
    : null;

  return (
    <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm uppercase tracking-widest text-muted-foreground">Assignment ID: {assignment.id.slice(0, 8)}</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">
                {order.order_number} → {driver.full_name || driver.employee_id}
              </h1>
              <p className="mt-2 text-muted-foreground">Assigned {formatDate(assignment.assigned_at)}</p>
            </div>
            <div className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-center font-semibold ${statusColors[assignment.status].bg} ${statusColors[assignment.status].text}`}>
              {statusColors[assignment.status].label}
            </div>
          </div>
        </div>

        {actionError && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">{actionError}</p>
          </div>
        )}

        {/* Status Timeline */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Assignment Timeline</h2>
          <div className="space-y-4">
            {/* Assigned */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="my-2 h-8 w-0.5 bg-border" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Assignment Created</h4>
                <p className="text-sm text-muted-foreground">{formatDate(assignment.assigned_at)}</p>
              </div>
            </div>

            {proofLoading && (
              <div className="surface-glass rounded-lg p-4 text-sm text-muted-foreground" role="status">
                Loading proof of delivery…
              </div>
            )}

            {proofLoadingError && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger-foreground" role="alert">
                Could not load proof of delivery: {proofLoadingError}
              </div>
            )}

            {proof && (
              <section className="surface-glass rounded-xl border border-success/30 p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Proof of Delivery</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Delivered {formatDate(proof.delivered_at)}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Received by</p>
                    <p className="mt-1 font-semibold text-foreground">{proof.recipient_name}</p>
                  </div>
                  {proof.notes && (
                    <div className="rounded-lg border border-border bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery notes</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{proof.notes}</p>
                    </div>
                  )}
                  {proof.signature_exception_reason && (
                    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-warning-foreground">No-signature exception</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{proof.signature_exception_reason}</p>
                    </div>
                  )}
                </div>
                {proofSignatureUrl && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipient acknowledgement</p>
                    <div className="inline-block overflow-hidden rounded-lg border border-border bg-white p-2">
                      <Image src={proofSignatureUrl} alt={`Recipient signature for ${order.order_number}`} width={600} height={180} unoptimized className="max-h-40 w-auto object-contain" />
                    </div>
                  </div>
                )}
                {proof.photo_path && proofPhotoUrl && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery photo</p>
                    <a href={proofPhotoUrl} target="_blank" rel="noreferrer" className="inline-block overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Image src={proofPhotoUrl} alt={`Proof of delivery for ${order.order_number}`} width={800} height={600} unoptimized className="max-h-80 w-auto object-contain" />
                    </a>
                  </div>
                )}
                {assignmentFeedback && (
                  <div className="mt-5 border-t border-border pt-5">
                    <h3 className="font-semibold text-foreground">Customer rating</h3>
                    <div className="mt-2 flex items-center gap-1" aria-label={`${assignmentFeedback.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`h-5 w-5 ${value <= assignmentFeedback.rating ? 'fill-warning-foreground text-warning-foreground' : 'text-muted-foreground/40'}`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-foreground">{assignmentFeedback.rating}/5</span>
                      <span className="ml-1 text-xs text-muted-foreground">· {formatDate(assignmentFeedback.submitted_at)}</span>
                    </div>
                    {assignmentFeedback.review && (
                      <blockquote className="mt-3 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-foreground">
                        “{assignmentFeedback.review}”
                      </blockquote>
                    )}
                  </div>
                )}
                {feedbackLoadError && (
                  <p role="alert" className="mt-4 text-sm text-danger-foreground">Could not load customer feedback: {feedbackLoadError}</p>
                )}
              </section>
            )}

            {/* Accepted */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${assignment.accepted_at ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                {assignment.started_at && <div className="my-2 h-8 w-0.5 bg-border" />}
              </div>
              <div>
                <h4 className={`font-semibold ${assignment.accepted_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Driver Accepted
                </h4>
                <p className="text-sm text-muted-foreground">
                  {assignment.accepted_at ? formatDate(assignment.accepted_at) : 'Pending'}
                </p>
              </div>
            </div>

            {/* In Progress */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${assignment.started_at ? 'bg-info text-info-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h4 className={`font-semibold ${assignment.started_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                  In Progress
                </h4>
                <p className="text-sm text-muted-foreground">
                  {assignment.started_at ? formatDate(assignment.started_at) : 'Not started'}
                </p>
                {eta && <p className="mt-1 text-sm text-info-foreground">ETA: {formatDate(eta.toISOString())}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Order Details</h2>

          {/* Quick Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="mt-1 font-bold text-foreground">{order.order_number}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Package Value</p>
              <p className="mt-1 text-right font-bold tabular-nums text-foreground">₹{(order.package_value || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="mt-1 font-bold uppercase text-foreground">{order.priority}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="mt-1 font-bold tabular-nums text-foreground">{order.package_weight} kg</p>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <div className="flex gap-4 rounded-md bg-info p-4 text-info-foreground">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Pickup Location</p>
                <p className="mt-1 text-foreground">{order.pickup_location}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-md bg-success p-4 text-success-foreground">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Delivery Location</p>
                <p className="mt-1 text-foreground">{order.delivery_location}</p>
              </div>
            </div>
          </div>

          {/* Package Description */}
          <div className="mt-4 rounded-md bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Package Description</p>
            <p className="mt-2 text-foreground">{order.package_description}</p>
          </div>

          {/* Customer Info */}
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Customer</p>
              <p className="font-semibold text-foreground">{order.client_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Phone</p>
              <a href={`tel:${order.client_phone}`} className="font-semibold text-primary hover:underline">
                {order.client_phone}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Email</p>
              <a href={`mailto:${order.client_email}`} className="font-semibold text-primary hover:underline">
                {order.client_email}
              </a>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Driver Information</h2>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-info text-3xl text-info-foreground">
              {vehicleEmojis[driver.vehicle_type] || '🚗'}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Employee ID</p>
                <p className="font-semibold text-foreground">{driver.full_name || driver.employee_id}</p>
                {driver.full_name && <p className="text-xs text-muted-foreground">ID: {driver.employee_id}</p>}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Vehicle</p>
                <p className="font-semibold text-foreground">{driver.vehicle_type.toUpperCase()}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-foreground">{getDriverRating(driver.id, allCustomerFeedback, driver.rating).average.toFixed(1)}</span>
                  <Star className="h-4 w-4 fill-warning-foreground text-warning-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Driver Stats */}
          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Deliveries Completed</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{driver.total_deliveries_completed}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Phone Verified</p>
              <p className="mt-1 text-lg font-bold text-success-foreground">
                {driver.phone_verified ? '✓ Verified' : '✗ Not Verified'}
              </p>
            </div>
          </div>

        </div>

        {/* Notes */}
        {assignment.notes && (
          <div className="surface-glass rounded-lg border border-warning/30 bg-warning p-6 text-warning-foreground">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p className="mt-2">{assignment.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">{isAssignedDriver ? 'Your delivery response' : 'Assignment status'}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {canAccept && (
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md bg-success px-4 py-2.5 font-semibold text-success-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Accepting...' : '✓ Accept Assignment'}
              </button>
            )}

            {canStart && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Starting...' : '🚀 Start Delivery'}
              </button>
            )}

            {canReject && (
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md border border-danger/40 bg-danger px-4 py-2.5 font-semibold text-danger-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : '✕ Reject'}
              </button>
            )}
          </div>

          {!isAssignedDriver && assignment.status === 'pending' && (
            <p className="rounded-lg border border-warning/25 bg-warning/10 p-3 text-sm text-warning-foreground">
              Waiting for the assigned driver to accept or decline this delivery.
            </p>
          )}
          {!isAssignedDriver && assignment.status === 'accepted' && (
            <p className="rounded-lg border border-info/25 bg-info/10 p-3 text-sm text-info-foreground">
              The driver accepted this delivery. The assigned driver will start it when ready.
            </p>
          )}
          {!isAssignedDriver && assignment.status === 'in_progress' && !proof && (
            <p className="rounded-lg border border-info/25 bg-info/10 p-3 text-sm text-info-foreground">
              Delivery is in progress. Only the assigned driver can submit proof of delivery and complete it.
            </p>
          )}

          {canComplete && !proof && (
            <form onSubmit={handleCompleteWithProof} className="mt-5 space-y-4 rounded-xl border border-success/25 bg-success/[0.05] p-4 sm:p-5">
              <div>
                <h3 className="font-semibold text-foreground">Complete delivery with proof</h3>
                <p className="mt-1 text-sm text-muted-foreground">Record who received the package and ask them to sign for the delivery.</p>
              </div>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  Recipient name <span className="text-danger-foreground">*</span>
                </span>
                <input
                  required
                  maxLength={120}
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Name of the person who received the delivery"
                />
              </label>
              <label className="flex min-h-11 items-start gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={signatureException}
                  onChange={(event) => {
                    setSignatureException(event.target.checked);
                    setRecipientSignature(null);
                    setSignatureExceptionReason('');
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span>Recipient is unable or unwilling to sign</span>
              </label>
              {signatureException ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-foreground">Reason for no signature <span className="text-danger-foreground">*</span></span>
                  <textarea
                    required
                    minLength={10}
                    maxLength={300}
                    rows={3}
                    value={signatureExceptionReason}
                    onChange={(event) => setSignatureExceptionReason(event.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    placeholder="Explain why the recipient could not sign"
                  />
                </label>
              ) : (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-foreground">Recipient signature <span className="text-danger-foreground">*</span></span>
                  <SignatureCapture onChange={setRecipientSignature} />
                </div>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Delivery notes <span className="font-normal text-muted-foreground">(optional)</span></span>
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={deliveryNotes}
                  onChange={(event) => setDeliveryNotes(event.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Add relevant handover details"
                />
                <span className="mt-1 block text-right text-xs text-muted-foreground">{deliveryNotes.length}/1000</span>
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Delivery photo <span className="font-normal text-muted-foreground">({signatureException ? 'required' : 'optional'}, JPG/PNG/WebP up to 8 MB)</span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={signatureException}
                  onChange={(event) => setProofPhoto(event.currentTarget.files?.[0] ?? null)}
                  className="block min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground"
                />
                {proofPhoto && <span className="mt-1 block text-xs text-muted-foreground">{proofPhoto.name} · {(proofPhoto.size / (1024 * 1024)).toFixed(1)} MB</span>}
              </label>
              {proofSubmitError && (
                <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger-foreground">
                  {proofSubmitError}
                </div>
              )}
              <button
                type="submit"
                disabled={proofSubmitLoading}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 font-semibold text-success-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" />
                {proofSubmitLoading ? 'Saving proof…' : 'Save proof & complete delivery'}
              </button>
            </form>
          )}

          {actionMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-success/30 bg-success px-4 py-3 text-success-foreground" role="status">
              <CheckCircle2 className="h-5 w-5" />
              {actionMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
