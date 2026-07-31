// Application constants and configuration

export const APP_NAME = 'NMD Logistics';
export const APP_DESCRIPTION = 'Logistics Management System';
export const APP_VERSION = '1.0.0';

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  DASHBOARD: '/dashboard',
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders/create',
    DETAIL: (id: string) => `/orders/${id}`,
    EDIT: (id: string) => `/orders/${id}/edit`,
  },
  PERSONNEL: {
    LIST: '/personnel',
    CREATE: '/personnel/create',
    DETAIL: (id: string) => `/personnel/${id}`,
    EDIT: (id: string) => `/personnel/${id}/edit`,
  },
  ASSIGNMENTS: {
    LIST: '/assignments',
    CREATE: '/assignments/create',
    DETAIL: (id: string) => `/assignments/${id}`,
  },
  REPORTS: {
    LIST: '/reports',
    DETAIL: (id: string) => `/reports/${id}`,
  },
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  DELIVERY_PERSONNEL: 'delivery_personnel',
} as const;

// Order statuses
export const ORDER_STATUSES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Order status colors for UI
export const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-800',
};

// Assignment statuses
export const ASSIGNMENT_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Personnel status
export const PERSONNEL_STATUSES = {
  AVAILABLE: 'available',
  ON_DELIVERY: 'on_delivery',
  ON_BREAK: 'on_break',
  OFF_DUTY: 'off_duty',
} as const;

// Vehicle types
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  AUTO: 'auto',
  CAR: 'car',
  VAN: 'van',
  TRUCK: 'truck',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'MMMM dd, yyyy hh:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  USERS: '/api/users',
  ORDERS: '/api/orders',
  PERSONNEL: '/api/personnel',
  ASSIGNMENTS: '/api/assignments',
  REPORTS: '/api/reports',
  ANALYTICS: '/api/analytics',
  AUTH: '/api/auth',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_NOT_FOUND: 'User not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An error occurred. Please try again later.',
  DUPLICATE_EMAIL: 'Email already exists.',
  DUPLICATE_ORDER: 'Order already exists.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  SIGNIN_SUCCESS: 'Signed in successfully.',
  SIGNUP_SUCCESS: 'Account created successfully.',
  UPDATE_SUCCESS: 'Updated successfully.',
  DELETE_SUCCESS: 'Deleted successfully.',
  ORDER_CREATED: 'Order created successfully.',
  ORDER_UPDATED: 'Order updated successfully.',
  ORDER_DELETED: 'Order deleted successfully.',
  ASSIGNMENT_CREATED: 'Assignment created successfully.',
};

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 500,
  LOADING_DELAY: 300,
} as const;

// Report types
export const REPORT_TYPES = {
  DELIVERY_PERFORMANCE: 'delivery_performance',
  PERSONNEL_PERFORMANCE: 'personnel_performance',
  REVENUE: 'revenue',
  OPERATIONAL: 'operational',
} as const;

// Analytics time ranges
export const TIME_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  CUSTOM: 'custom',
} as const;
