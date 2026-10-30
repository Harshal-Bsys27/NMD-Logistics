// Mock data service for development
import { useCallback, useState } from 'react';
import type { Order, DeliveryPersonnel, Assignment } from '@/types';

const ORDER_STORAGE_KEY = 'nmd-mock-orders';

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

const readStoredOrders = (): Order[] => {
  if (typeof window === 'undefined') {
    return mockOrders;
  }

  const saved = window.localStorage.getItem(ORDER_STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(mockOrders));
    return mockOrders;
  }

  try {
    const parsed = JSON.parse(saved) as Order[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : mockOrders;
  } catch {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(mockOrders));
    return mockOrders;
  }
};

const persistOrders = (orders: Order[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  }
};

export function useMockOrders() {
  const [orders, setOrders] = useState<Order[]>(() => readStoredOrders());

  const createOrder = useCallback((input: Partial<Order> & Pick<Order, 'client_name' | 'client_phone' | 'pickup_location' | 'delivery_location' | 'package_description'>) => {
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: input.id ?? crypto.randomUUID(),
      order_number: input.order_number ?? `ORD-${Math.floor(Date.now() / 1000)}`,
      client_name: input.client_name,
      client_phone: input.client_phone,
      client_email: input.client_email,
      pickup_location: input.pickup_location,
      pickup_latitude: input.pickup_latitude,
      pickup_longitude: input.pickup_longitude,
      delivery_location: input.delivery_location,
      delivery_latitude: input.delivery_latitude,
      delivery_longitude: input.delivery_longitude,
      package_description: input.package_description,
      package_weight: input.package_weight ?? 0,
      package_value: input.package_value ?? 0,
      status: input.status ?? 'draft',
      priority: input.priority ?? 'normal',
      special_instructions: input.special_instructions,
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
    };

    setOrders((current) => {
      const next = [newOrder, ...current];
      persistOrders(next);
      return next;
    });

    return newOrder;
  }, []);

  const updateOrder = useCallback((orderId: string, updates: Partial<Order>) => {
    let result: Order | null = null;

    setOrders((current) => {
      const next = current.map((order) => {
        if (order.id !== orderId) return order;
        const updated = { ...order, ...updates, updated_at: new Date().toISOString() };
        result = updated;
        return updated;
      });

      persistOrders(next);
      return next;
    });

    return result;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    let result: Order | null = null;

    setOrders((current) => {
      const next = current.map((order) => {
        if (order.id !== orderId) return order;
        const updated = { ...order, status, updated_at: new Date().toISOString() };
        result = updated;
        return updated;
      });

      persistOrders(next);
      return next;
    });

    return result;
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((current) => {
      const next = current.filter((order) => order.id !== orderId);
      persistOrders(next);
      return next;
    });
  }, []);

  return {
    orders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderById: (id: string) => orders.find((o) => o.id === id),
    getOrdersByStatus: (status: string) => orders.filter((o) => o.status === status),
  };
}

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

const DRIVER_STORAGE_KEY = 'nmd-mock-drivers';
const ASSIGNMENT_STORAGE_KEY = 'nmd-mock-assignments';

const readStoredDrivers = (): DeliveryPersonnel[] => {
  if (typeof window === 'undefined') {
    return mockDrivers;
  }

  const saved = window.localStorage.getItem(DRIVER_STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(mockDrivers));
    return mockDrivers;
  }

  try {
    const parsed = JSON.parse(saved) as DeliveryPersonnel[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : mockDrivers;
  } catch {
    window.localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(mockDrivers));
    return mockDrivers;
  }
};

const persistDrivers = (drivers: DeliveryPersonnel[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(drivers));
  }
};

const readStoredAssignments = (): Assignment[] => {
  if (typeof window === 'undefined') {
    return mockAssignments;
  }

  const saved = window.localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(mockAssignments));
    return mockAssignments;
  }

  try {
    const parsed = JSON.parse(saved) as Assignment[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : mockAssignments;
  } catch {
    window.localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(mockAssignments));
    return mockAssignments;
  }
};

const persistAssignments = (assignments: Assignment[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments));
  }
};

export function useMockDrivers() {
  const [drivers, setDrivers] = useState<DeliveryPersonnel[]>(() => readStoredDrivers());

  const updateDriverStatus = (driverId: string, status: DeliveryPersonnel['current_status']) => {
    let result: DeliveryPersonnel | null = null;

    setDrivers((current) => {
      const next = current.map((driver) => {
        if (driver.id !== driverId) return driver;
        const updated = { ...driver, current_status: status, updated_at: new Date().toISOString() };
        result = updated;
        return updated;
      });

      persistDrivers(next);
      return next;
    });

    return result;
  };

  return {
    drivers,
    updateDriverStatus,
    getDriverById: (id: string) => drivers.find((d) => d.id === id),
    getAvailableDrivers: () => drivers.filter((d) => d.current_status === 'available'),
  };
}

export function useMockAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => readStoredAssignments());

  const createAssignment = (input: Partial<Assignment> & Pick<Assignment, 'order_id' | 'personnel_id' | 'assigned_by'>) => {
    const now = new Date().toISOString();
    const newAssignment: Assignment = {
      id: input.id ?? crypto.randomUUID(),
      order_id: input.order_id,
      personnel_id: input.personnel_id,
      assigned_by: input.assigned_by,
      status: input.status ?? 'pending',
      assigned_at: input.assigned_at ?? now,
      accepted_at: input.accepted_at,
      started_at: input.started_at,
      completed_at: input.completed_at,
      estimated_duration_minutes: input.estimated_duration_minutes ?? 45,
      actual_duration_minutes: input.actual_duration_minutes,
      notes: input.notes,
      created_at: input.created_at ?? now,
      updated_at: input.updated_at ?? now,
    };

    setAssignments((current) => {
      const next = [newAssignment, ...current];
      persistAssignments(next);
      return next;
    });

    return newAssignment;
  };

  const updateAssignmentStatus = (assignmentId: string, status: Assignment['status']) => {
    let result: Assignment | null = null;

    setAssignments((current) => {
      const next = current.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;

        const updated: Assignment = {
          ...assignment,
          status,
          updated_at: new Date().toISOString(),
          accepted_at: status === 'accepted' ? assignment.accepted_at ?? new Date().toISOString() : assignment.accepted_at,
          started_at: status === 'in_progress' ? assignment.started_at ?? new Date().toISOString() : assignment.started_at,
          completed_at: status === 'completed' ? assignment.completed_at ?? new Date().toISOString() : assignment.completed_at,
        };

        result = updated;
        return updated;
      });

      persistAssignments(next);
      return next;
    });

    return result;
  };

  return {
    assignments,
    createAssignment,
    updateAssignmentStatus,
    getAssignmentsByOrder: (orderId: string) => assignments.find((a) => a.order_id === orderId),
    getAssignmentsByDriver: (driverId: string) => assignments.filter((a) => a.personnel_id === driverId),
  };
}
