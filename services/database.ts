import { supabase } from '@/lib/supabase/client';
import { CreateOrderInput } from '@/lib/validations/schemas';
import type { AssignmentStatus, DeliveryFeedback, DeliveryProof, OrderAssignment, OrderStatus, PersonnelStatus } from '@/types';

// ============== ORDER OPERATIONS ==============

export const orderService = {
  // Create a new order
  async create(orderData: CreateOrderInput) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            order_number: `ORD-${Date.now()}${Math.floor(Math.random() * 10_000)
              .toString()
              .padStart(4, '0')}`,
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
  async updateStatus(orderId: string, status: OrderStatus) {
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
        .select('*, user:users!delivery_personnel_user_id_fkey(full_name, status)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return {
        data: (data || []).map(({ user, ...driver }) => ({
          ...driver,
          full_name: user?.full_name ?? '',
          user_status: user?.status,
        })),
        error: null,
      };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  // Fetch a single driver
  async getById(driverId: string) {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*, user:users!delivery_personnel_user_id_fkey(full_name)')
        .eq('id', driverId)
        .single();

      if (error) throw error;
      const { user, ...driver } = data;
      return { data: { ...driver, full_name: user?.full_name ?? '' }, error: null };
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

  async setMyAvailability(status: Exclude<PersonnelStatus, 'on_delivery'>) {
    try {
      const { error } = await supabase.rpc('set_my_driver_availability', {
        p_status: status,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: unknown) {
      const errorRecord = error && typeof error === 'object'
        ? error as Record<string, unknown>
        : {};
      const message = typeof errorRecord.message === 'string'
        ? errorRecord.message
        : error instanceof Error
          ? error.message
          : '';
      const code = typeof errorRecord.code === 'string' ? errorRecord.code : '';
      const details = typeof errorRecord.details === 'string' ? errorRecord.details : '';
      const hint = typeof errorRecord.hint === 'string' ? errorRecord.hint : '';
      const diagnostic = [message, code ? `(${code})` : '', details, hint ? `Hint: ${hint}` : '']
        .filter(Boolean)
        .join(' ');

      return {
        error: code === 'PGRST202'
          ? `The availability update function is not installed in this Supabase database. Apply the driver availability migration. ${diagnostic}`
          : diagnostic || 'Unable to update your availability for an unknown reason.',
      };
    }
  },

  async getAvailabilityHistory(driverId: string, limit = 6) {
    try {
      const { data, error } = await supabase
        .from('driver_availability_history')
        .select('id, previous_status, new_status, changed_at')
        .eq('driver_id', driverId)
        .order('changed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data ?? [], error: null };
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error
        && typeof error.message === 'string'
        ? error.message
        : error instanceof Error ? error.message : 'Unable to load availability history';
      return { data: [], error: message };
    }
  },

  // Get driver performance stats
  async getStats(driverId: string) {
    try {
      const { data: assignments, error } = await supabase
        .from('order_assignments')
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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('You must be signed in to assign an order');

      const { data, error } = await supabase
        .from('order_assignments')
        .insert([
          {
            order_id: assignmentData.order_id,
            personnel_id: assignmentData.personnel_id,
            status: 'pending',
            assigned_by: authData.user.id,
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
    status: AssignmentStatus
  ) {
    try {
      const updateData: Partial<
        Pick<OrderAssignment, 'status' | 'updated_at' | 'accepted_at' | 'started_at' | 'completed_at'>
      > = {
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
        .from('order_assignments')
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

  async completeWithProof(input: {
    assignmentId: string;
    recipientName: string;
    notes: string;
    photo: File | null;
  }) {
    let photoPath: string | null = null;
    let preserveUploadedPhoto = false;
    try {
      if (input.photo) {
        const extensionByType: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
        };
        const extension = extensionByType[input.photo.type];
        if (!extension) throw new Error('Choose a JPG, PNG, or WebP proof photo.');
        if (input.photo.size > 8 * 1024 * 1024) throw new Error('The proof photo must be 8 MB or smaller.');

        const uploadPath = `${input.assignmentId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('delivery-proofs')
          .upload(uploadPath, input.photo, {
            cacheControl: '3600',
            contentType: input.photo.type,
            upsert: false,
          });
        if (uploadError) throw new Error(`Could not upload proof photo: ${uploadError.message}`);
        photoPath = uploadPath;
      }

      const { data, error } = await supabase.rpc('complete_assignment_with_proof', {
        p_assignment_id: input.assignmentId,
        p_recipient_name: input.recipientName.trim(),
        p_notes: input.notes.trim() || null,
        p_photo_path: photoPath,
      });
      if (error) {
        const verification = await supabase
          .from('delivery_proofs')
          .select('*')
          .eq('assignment_id', input.assignmentId)
          .maybeSingle();
        if (verification.data) return { data: verification.data as DeliveryProof, error: null };
        if (verification.error) {
          preserveUploadedPhoto = true;
          throw new Error(
            `${error.message} Delivery completion could not be verified. Refresh the assignment before retrying.${photoPath ? ' The uploaded photo has been retained.' : ''}`
          );
        }
        throw new Error(error.message);
      }
      if (!data) throw new Error('Delivery completion returned no proof record.');
      return { data: data as DeliveryProof, error: null };
    } catch (error) {
      if (photoPath && !preserveUploadedPhoto) {
        const { error: cleanupError } = await supabase.storage.from('delivery-proofs').remove([photoPath]);
        if (cleanupError) {
          console.error('Unable to remove proof photo after delivery completion failed:', cleanupError);
          const message = error instanceof Error ? error.message : 'Unable to complete delivery';
          return {
            data: null,
            error: `${message} The uploaded photo could not be removed; contact an administrator.`,
          };
        }
      }
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unable to complete delivery',
      };
    }
  },

  async getProofByAssignmentId(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as DeliveryProof | null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unable to load proof of delivery',
      };
    }
  },

  async getFeedbackByAssignmentId(assignmentId: string) {
    try {
      const { data, error } = await supabase
        .from('delivery_feedback')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as DeliveryFeedback | null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unable to load customer feedback',
      };
    }
  },

  async getAllFeedback() {
    try {
      const { data, error } = await supabase
        .from('delivery_feedback')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return { data: (data ?? []) as DeliveryFeedback[], error: null };
    } catch (error) {
      return {
        data: [] as DeliveryFeedback[],
        error: error instanceof Error ? error.message : 'Unable to load customer feedback',
      };
    }
  },

  async getAllProofs() {
    try {
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .order('delivered_at', { ascending: false });

      if (error) throw error;
      return { data: (data ?? []) as DeliveryProof[], error: null };
    } catch (error) {
      return {
        data: [] as DeliveryProof[],
        error: error instanceof Error ? error.message : 'Unable to load proof of delivery records',
      };
    }
  },

  async getProofPhotoUrl(photoPath: string) {
    try {
      const { data, error } = await supabase.storage
        .from('delivery-proofs')
        .createSignedUrl(photoPath, 60 * 60);
      if (error) throw error;
      return { data: data.signedUrl, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unable to load proof photo',
      };
    }
  },

  // Get all assignments
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('order_assignments')
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
        .from('order_assignments')
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
        .from('order_assignments')
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
