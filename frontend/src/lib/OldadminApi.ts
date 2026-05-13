// // frontend/src/lib/adminApi.ts
// // Calls Express ONLY for operations that need service_role key:
// //   - Creating other users' accounts (auth.admin.createUser)
// //   - Changing other users' email/password (auth.admin.updateUserById)
// //   - Deleting auth accounts (auth.admin.deleteUser)
// //
// // Deactivate/reactivate use direct Supabase (RLS: users_admin_update_any)

// import { supabase } from '../config/supabaseClient';

// const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

// async function adminFetch(method: string, path: string, body?: any) {
//     const normalizedPath = path.startsWith('/') ? path : `/${path}`;
//     const { data: { session } } = await supabase.auth.getSession();
//     if (!session?.access_token) throw new Error('Not authenticated');

//     const isFormData = body instanceof FormData;
//     const headers: Record<string, string> = {
//         'Authorization': `Bearer ${session.access_token}`,
//     };

//     if (!isFormData) {
//         headers['Content-Type'] = 'application/json';
//     }

//     const res = await fetch(`${API_BASE}${normalizedPath}`, {
//         method,
//         headers,
//         body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
//     });

//     const json = await res.json();
//     if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
//     return json;
// }

// export const adminApi = {
//     // ── Express routes (require service_role) ──
//     createUser: (data: { email: string; password: string; role?: string; first_name?: string; last_name?: string; contact_number?: string }) =>
//         adminFetch('POST', '/api/admin/users', data),

//     updateUser: (id: string, data: { email?: string; password?: string; role?: string; first_name?: string; last_name?: string; username?: string; contact_number?: string; address?: string; is_active?: boolean }) => adminFetch('PUT', `/api/admin/users/${id}`, data),

//     deleteUser: (id: string) =>
//         adminFetch('DELETE', `/api/admin/users/${id}`),

//     uploadAttendance: (formData: FormData) =>
//         adminFetch('POST', '/api/payroll/upload-attendance', formData),

//     // ── Direct Supabase (RLS: users_admin_update_any) ──
//     async deactivateUsers(ids: string[]) {
//         const { data, error } = await supabase
//             .from('users')
//             .update({ is_active: false })
//             .in('id', ids)
//             .select('id');
//         if (error) throw error;
//         return { success: true, deactivated: data?.length || 0 };
//     },

//     async reactivateUser(id: string) {
//         const { data, error } = await supabase
//             .from('users')
//             .update({ is_active: true })
//             .eq('id', id)
//             .select()
//             .single();
//         if (error) throw error;
//         return { success: true, data };
//     },

//     async toggleSuki(id: string, isSuki: boolean) {
//         const { data, error } = await supabase
//             .from('users')
//             .update({ is_suki: isSuki })
//             .eq('id', id)
//             .select()
//             .single();
//         if (error) throw error;
//         return { success: true, data };
//     },
// };