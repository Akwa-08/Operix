// frontend/src/services/authService.ts
// Centralized auth service — all Supabase Auth calls in one place

import { supabase } from '../config/supabaseClient';
import type { UserRole } from '../context/AuthContext';

interface LoginResult {
  success: boolean;
  user: { id: string; email: string; role: UserRole; firstName: string | null; lastName: string | null; } | null;
  error: string | null;
}

interface RegisterResult { success: boolean; needsEmailConfirm: boolean; error: string | null; }
interface GenericResult { success: boolean; error: string | null; }

/** Sign in any user (customer or staff). Role routing handled by caller. */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (error) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Incorrect email or password.';
      else if (msg.includes('Email not confirmed')) msg = 'Please confirm your email before logging in.';
      return { success: false, user: null, error: msg };
    }
    const u = data.user;
    return {
      success: true, error: null,
      user: {
        id: u.id, email: u.email ?? '',
        role: (u.user_metadata?.role as UserRole) || 'customer',
        firstName: u.user_metadata?.first_name ?? null,
        lastName: u.user_metadata?.last_name ?? null,
      },
    };
  } catch (err: any) {
    return { success: false, user: null, error: err.message || 'Login failed.' };
  }
}

/** Register a CUSTOMER. Employees are created by admin via backend /api/users. */
export async function register(params: {
  email: string; password: string; firstName: string; lastName: string; contactNumber: string;
}): Promise<RegisterResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim().toLowerCase(), password: params.password,
      options: { data: { role: 'customer', first_name: params.firstName, last_name: params.lastName, contact_number: params.contactNumber } },
    });
    if (error) {
      const msg = error.message.includes('already registered') ? 'An account with this email already exists.' : error.message;
      return { success: false, needsEmailConfirm: false, error: msg };
    }
    return { success: true, needsEmailConfirm: !data.session, error: null };
  } catch (err: any) {
    return { success: false, needsEmailConfirm: false, error: err.message || 'Registration failed.' };
  }
}

/** Sign out current user. */
export async function logout(): Promise<GenericResult> {
  try {
    const { error } = await supabase.auth.signOut();
    return error ? { success: false, error: error.message } : { success: true, error: null };
  } catch (err: any) { return { success: false, error: err.message }; }
}

/** Send password reset email. Always returns success (security). */
export async function forgotPassword(email: string): Promise<GenericResult> {
  try {
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { success: true, error: null };
  } catch (err: any) { return { success: false, error: err.message }; }
}

/** Update password after reset link. User must have valid session. */
export async function updatePassword(newPassword: string): Promise<GenericResult> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? { success: false, error: error.message } : { success: true, error: null };
  } catch (err: any) { return { success: false, error: err.message }; }
}

const authService = { login, register, logout, forgotPassword, updatePassword };
export default authService;