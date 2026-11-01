export type AssignmentStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type DriverAvailability = 'available' | 'on_delivery' | 'on_break' | 'off_duty';

export interface DriverProfile {
  id: string;
  employee_id: string;
  current_status: DriverAvailability;
  vehicle_type: string;
  vehicle_number: string;
  total_deliveries_completed: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  rating: number;
}

export interface DriverAssignment {
  id: string;
  order_id: string;
  personnel_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  accepted_at: string | null;
  started_at: string | null;
  estimated_duration_minutes: number | null;
  notes: string | null;
  order: {
    id: string;
    order_number: string;
    client_name: string;
    client_phone: string;
    pickup_location: string;
    delivery_location: string;
    package_description: string | null;
    package_weight: number | null;
    special_instructions: string | null;
  };
}

export interface ProofPhoto {
  base64: string;
  fileName: string;
  mimeType: string;
}

export interface DriverAvailabilityHistory {
  id: string;
  previous_status: DriverAvailability;
  new_status: DriverAvailability;
  changed_at: string;
}

export interface DriverDeliveryProof {
  id: string;
  assignment_id: string;
  order_id: string;
  recipient_name: string;
  notes: string | null;
  photo_url: string | null;
  signature_url: string | null;
  signature_exception_reason: string | null;
  delivered_at: string;
  order_number: string;
  client_name: string;
}

export interface DriverFeedback {
  id: string;
  order_id: string;
  assignment_id: string;
  rating: number;
  review: string | null;
  submitted_at: string;
  order_number: string;
}
