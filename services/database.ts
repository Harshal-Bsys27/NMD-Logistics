import { supabase } from '@/lib/supabase/client';
import { CreateOrderInput } from '@/lib/validations/schemas';

// ============== ORDER OPERATIONS ==============

export const orderService = {
  // Create a new order
  async create(orderData: CreateOrderInput) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            order_number: `ORD-${Date.now().toString().slice(-6)}`,
            client_name: orderData.client_name,
            client_phone: orderData.client_phone,
            client_email: orderData.client_email,
            pickup_location: orderData.pickup_location,
            delivery_location: orderData.delivery_location,
            package_description: orderData.package_description,
            package_weight: orderData.package_weight,
            package_value: orderData.package_value,
            status: 'draft',
            priority: orderData.priority || 'normal',
            special_instructions: orderData.special_instructions,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Update an existing order
  async update(orderId: string, orderData: Partial<CreateOrderInput>) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          client_name: orderData.client_name,
          client_phone: orderData.client_phone,
          client_email: orderData.client_email,
          pickup_location: orderData.pickup_location,
          delivery_location: orderData.delivery_location,
          package_description: orderData.package_description,
          package_weight: orderData.package_weight,
          package_value: orderData.package_value,
          priority: orderData.priority,
          special_instructions: orderData.special_instructions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Fetch a single order
  async getById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Fetch all orders
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  // Delete an order
  async delete(orderId: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Update order status
  async updateStatus(orderId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};

// ============== DRIVER OPERATIONS ==============

export const driverService = {
  // Get all drivers
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  // Fetch a single driver
  async getById(driverId: string) {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Update driver status
  async updateStatus(driverId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .update({
          current_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Get driver performance stats
  async getStats(driverId: string) {
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('status, estimated_duration_minutes')
        .eq('personnel_id', driverId);

      if (error) throw error;

      const stats = {
        total_assignments: assignments?.length || 0,
        completed: assignments?.filter((a) => a.status === 'completed').length || 0,
        pending: assignments?.filter((a) => a.status === 'pending').length || 0,
        in_progress: assignments?.filter((a) => a.status === 'in_progress').length || 0,
      };

      return { data: stats, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};

// ============== ASSIGNMENT OPERATIONS ==============

export const assignmentService = {
  // Create a new assignment
  async create(assignmentData: {
    order_id: string;
    personnel_id: string;
    estimated_duration_minutes: number;
    notes?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            order_id: assignmentData.order_id,
            personnel_id: assignmentData.personnel_id,
            status: 'pending',
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
            estimated_duration_minutes: assignmentData.estimated_duration_minutes,
            notes: assignmentData.notes,
            assigned_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Update assignment status
  async updateStatus(
    assignmentId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
  ) {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Add timestamp based on status
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Get all assignments
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  // Fetch a single assignment
  async getById(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Get assignments by status
  async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', status)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
};

// ============== BULK OPERATIONS ==============

export const bulkService = {
  // Bulk import orders from CSV data
  async importOrders(orders: CreateOrderInput[]) {
    try {
      const ordersToInsert = orders.map((order) => ({
        order_number: `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 9)}`,
        client_name: order.client_name,
        client_phone: order.client_phone,
        client_email: order.client_email,
        pickup_location: order.pickup_location,
        delivery_location: order.delivery_location,
        package_description: order.package_description,
        package_weight: order.package_weight,
        package_value: order.package_value,
        status: 'draft',
        priority: order.priority || 'normal',
        special_instructions: order.special_instructions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert(ordersToInsert)
        .select();

      if (error) throw error;
      return { data: data || [], error: null, count: data?.length || 0 };
    } catch (error: any) {
      return { data: [], error: error.message, count: 0 };
    }
  },
};
