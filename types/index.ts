// User and Authentication Types
export type UserRole = 'admin' | 'supervisor' | 'delivery_personnel';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  department?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Delivery Personnel Types
export type VehicleType = 'bike' | 'auto' | 'car' | 'van' | 'truck';
export type PersonnelStatus = 'available' | 'on_delivery' | 'on_break' | 'off_duty';

export interface DeliveryPersonnel {
  id: string;
  user_id: string;
  employee_id: string;
  vehicle_type: VehicleType;
  vehicle_number: string;
  license_number?: string;
  current_status: PersonnelStatus;
  total_deliveries_completed: number;
  rating: number;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Order Types
export type OrderStatus = 
  | 'draft'
  | 'confirmed'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_time?: string;
  
  delivery_location: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  expected_delivery_time?: string;
  actual_delivery_time?: string;
  
  package_weight?: number;
  package_dimensions?: string;
  package_description?: string;
  package_value?: number;
  
  status: OrderStatus;
  priority?: string;
  special_instructions?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Order Assignment Types
export type AssignmentStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface OrderAssignment {
  id: string;
  order_id: string;
  personnel_id: string;
  assigned_by: string;
  
  status: AssignmentStatus;
  assigned_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Delivery Status History Types
export interface DeliveryStatusHistory {
  id: string;
  order_id: string;
  assignment_id?: string;
  
  previous_status?: OrderStatus;
  new_status: OrderStatus;
  
  location?: string;
  latitude?: number;
  longitude?: number;
  
  updated_by?: string;
  notes?: string;
  
  created_at: string;
}

// Reports Types
export interface Report {
  id: string;
  title: string;
  description?: string;
  report_type: string;
  
  start_date: string;
  end_date: string;
  
  data?: Record<string, any>;
  
  generated_by: string;
  
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface AnalyticsMetrics {
  id: string;
  date: string;
  
  total_orders: number;
  completed_orders: number;
  failed_orders: number;
  average_delivery_time_minutes?: number;
  
  total_personnel_active: number;
  total_revenue?: number;
  
  created_at: string;
  updated_at: string;
}

// Settings Types
export interface Setting {
  id: string;
  key: string;
  value: string;
  setting_type?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Extended types for queries with relationships
export interface OrderWithAssignment extends Order {
  assignment?: OrderAssignment;
  personnel?: DeliveryPersonnel;
  personnel_user?: User;
}

export interface DeliveryPersonnelWithUser extends DeliveryPersonnel {
  user: User;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
