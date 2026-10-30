import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/client';
import type { User, UserRole, UserStatus } from '@/types';

// Authentication Functions
export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in with Google OAuth
  async signInWithGoogle(redirectTo: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getGoogleProviderStatus(): Promise<{ enabled: boolean; message: string | null }> {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: supabaseAnonKey },
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          enabled: false,
          message: 'Google sign-in availability could not be checked. Contact your administrator.',
        };
      }

      const settings: unknown = await response.json();
      if (!settings || typeof settings !== 'object' || !('external' in settings)) {
        return {
          enabled: false,
          message: 'Google sign-in availability could not be checked. Contact your administrator.',
        };
      }

      const external = settings.external;
      if (!external || typeof external !== 'object' || !('google' in external)) {
        return {
          enabled: false,
          message: 'Google sign-in is not enabled for this workspace. Configure Google under Supabase Authentication providers.',
        };
      }

      const enabled = external.google === true;
      return {
        enabled,
        message: enabled
          ? null
          : 'Google sign-in is not enabled for this workspace. Configure Google under Supabase Authentication providers.',
      };
    } catch {
      return {
        enabled: false,
        message: 'Google sign-in availability could not be checked. Contact your administrator.',
      };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current session
  async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async refreshSession() {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unable to refresh your session.') };
    }
  },
};

// User Management Functions
export const userService = {
  // Get user by ID
  async getUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get all users (admin only)
  async getAllUsers(
    role?: UserRole,
    status?: UserStatus,
    limit = 50,
    offset = 0
  ) {
    try {
      let query = supabase.from('users').select('*', { count: 'exact' });

      if (role) {
        query = query.eq('role', role);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, total: count || 0, error: null };
    } catch (error) {
      return { data: null, total: 0, error };
    }
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete user (soft delete)
  async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Search users
  async searchUsers(query: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(20);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
