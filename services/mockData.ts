// Mock data service for development
import type { Order, DeliveryPersonnel, Assignment } from '@/types';

export const mockOrders: Order[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    order_number: 'ORD-001234',
    client_name: 'Rajesh Kumar',
    client_phone: '9876543210',
    client_email: 'rajesh@example.com',
    pickup_location: 'Warehouse A, Mumbai',
    pickup_latitude: 19.0760,
    pickup_longitude: 72.8777,
    delivery_location: 'Bandra, Mumbai',
    delivery_latitude: 19.0596,
    delivery_longitude: 72.8295,
    package_description: 'Electronics - Laptop',
    package_weight: 2.5,
    package_value: 75000,
    status: 'in_transit',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    order_number: 'ORD-001235',
    client_name: 'Priya Sharma',
    client_phone: '9876543211',
    client_email: 'priya@example.com',
    pickup_location: 'Downtown Hub',
    pickup_latitude: 19.0176,
    pickup_longitude: 72.8479,
    delivery_location: 'Airport Road, Mumbai',
    delivery_latitude: 19.1136,
    delivery_longitude: 72.8697,
    package_description: 'Documents & Files',
    package_weight: 0.5,
    package_value: 5000,
    status: 'delivered',
    priority: 'normal',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    order_number: 'ORD-001236',
    client_name: 'Amit Patel',
    client_phone: '9876543212',
    client_email: 'amit@example.com',
    pickup_location: 'East Gate Warehouse',
    pickup_latitude: 19.1136,
    pickup_longitude: 72.8697,
    delivery_location: 'Malad, Mumbai',
    delivery_latitude: 19.1797,
    delivery_longitude: 72.8353,
    package_description: 'Fragile Items - Glass',
    package_weight: 3.2,
    package_value: 25000,
    status: 'confirmed',
    priority: 'urgent',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    order_number: 'ORD-001237',
    client_name: 'Neha Gupta',
    client_phone: '9876543213',
    client_email: 'neha@example.com',
    pickup_location: 'Central Post Office',
    pickup_latitude: 19.0176,
    pickup_longitude: 72.8479,
    delivery_location: 'Thane, Mumbai',
    delivery_latitude: 19.2183,
    delivery_longitude: 72.9781,
    package_description: 'Clothing & Accessories',
    package_weight: 1.8,
    package_value: 8500,
    status: 'picked_up',
    priority: 'normal',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockDrivers: DeliveryPersonnel[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440101',
    employee_id: 'EMP001',
    vehicle_type: 'bike',
    vehicle_number: 'MH02AB1234',
    license_number: 'DL5820240123456',
    current_status: 'on_delivery',
    total_deliveries_completed: 342,
    rating: 4.8,
    phone_verified: true,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440102',
    employee_id: 'EMP002',
    vehicle_type: 'auto',
    vehicle_number: 'MH02CD5678',
    license_number: 'DL5820240234567',
    current_status: 'available',
    total_deliveries_completed: 287,
    rating: 4.6,
    phone_verified: true,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    user_id: '550e8400-e29b-41d4-a716-446655440103',
    employee_id: 'EMP003',
    vehicle_type: 'van',
    vehicle_number: 'MH02EF9012',
    license_number: 'DL5820240345678',
    current_status: 'available',
    total_deliveries_completed: 156,
    rating: 4.7,
    phone_verified: true,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    order_id: '550e8400-e29b-41d4-a716-446655440001',
    personnel_id: '660e8400-e29b-41d4-a716-446655440001',
    assigned_by: '550e8400-e29b-41d4-a716-446655440201',
    status: 'in_progress',
    assigned_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    estimated_duration_minutes: 45,
    notes: 'Customer not available, will retry in 10 mins',
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    order_id: '550e8400-e29b-41d4-a716-446655440003',
    personnel_id: '660e8400-e29b-41d4-a716-446655440002',
    assigned_by: '550e8400-e29b-41d4-a716-446655440201',
    status: 'pending',
    assigned_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    estimated_duration_minutes: 35,
    notes: 'High priority - ASAP delivery needed',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useMockOrders() {
  return {
    orders: mockOrders,
    getOrderById: (id: string) => mockOrders.find((o) => o.id === id),
    getOrdersByStatus: (status: string) => mockOrders.filter((o) => o.status === status),
  };
}

export function useMockDrivers() {
  return {
    drivers: mockDrivers,
    getDriverById: (id: string) => mockDrivers.find((d) => d.id === id),
    getAvailableDrivers: () => mockDrivers.filter((d) => d.current_status === 'available'),
  };
}

export function useMockAssignments() {
  return {
    assignments: mockAssignments,
    getAssignmentsByOrder: (orderId: string) =>
      mockAssignments.find((a) => a.order_id === orderId),
    getAssignmentsByDriver: (driverId: string) =>
      mockAssignments.filter((a) => a.personnel_id === driverId),
  };
}
