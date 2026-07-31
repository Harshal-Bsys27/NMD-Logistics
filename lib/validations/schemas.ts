import { z } from 'zod';

// Auth Schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// User Schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
  role: z.enum(['admin', 'supervisor', 'delivery_personnel']),
  department: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Order Schemas
export const createOrderSchema = z.object({
  client_name: z.string().min(2, 'Client name must be at least 2 characters'),
  client_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  client_email: z.string().email('Invalid email address').optional(),
  
  pickup_location: z.string().min(5, 'Pickup location is required'),
  pickup_time: z.string().datetime().optional(),
  
  delivery_location: z.string().min(5, 'Delivery location is required'),
  expected_delivery_time: z.string().datetime().optional(),
  
  package_description: z.string().min(5, 'Package description is required'),
  package_weight: z.number().positive('Package weight must be positive').optional(),
  package_value: z.number().nonnegative('Package value cannot be negative').optional(),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  special_instructions: z.string().optional(),
});

export const updateOrderSchema = createOrderSchema.partial();

// Delivery Personnel Schemas
export const createDeliveryPersonnelSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  employee_id: z.string().min(3, 'Employee ID is required'),
  vehicle_type: z.enum(['bike', 'auto', 'car', 'van', 'truck']),
  vehicle_number: z.string().min(3, 'Vehicle number is required'),
  license_number: z.string().optional(),
});

export const updateDeliveryPersonnelSchema = createDeliveryPersonnelSchema.partial();

export const updatePersonnelStatusSchema = z.object({
  status: z.enum(['available', 'on_delivery', 'on_break', 'off_duty']),
});

// Order Assignment Schemas
export const createAssignmentSchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
  personnel_id: z.string().uuid('Invalid personnel ID'),
  estimated_duration_minutes: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

// Delivery Status Schemas
export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled']),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

// Report Schemas
export const createReportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  report_type: z.string().min(2, 'Report type is required'),
  start_date: z.string().date(),
  end_date: z.string().date(),
}).refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// Settings Schemas
export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type CreateDeliveryPersonnelInput = z.infer<typeof createDeliveryPersonnelSchema>;
export type UpdateDeliveryPersonnelInput = z.infer<typeof updateDeliveryPersonnelSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
