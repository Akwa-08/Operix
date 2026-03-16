// backend/src/modules/accounts_management/services/userService.js
// REFACTORED:
//   BUG FIX #1: Passwords are NO LONGER written to the users table.
//               Password updates now go through supabase.auth.admin.updateUserById()
//   BUG FIX #2: Role changes now sync to BOTH users table AND auth user_metadata
//   BUG FIX #3: createUser() no longer manually inserts into users table —
//               the DB trigger (handle_new_user) creates the profile row automatically.
//               We only verify the row was created and update username afterward.

const { supabase } = require('../../../config/supabase');
const Joi = require('joi');

// Columns to select (password column has been dropped from the table)
const USER_SAFE_COLUMNS = 'id, first_name, last_name, username, contact_number, email, address, role, is_active, created_at';

// ── Validation schemas ───────────────────────────────────────────────────────

const createUserSchema = Joi.object({
    first_name: Joi.string().optional().allow('', null),
    last_name: Joi.string().optional().allow('', null),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(8).required(),
    contact_number: Joi.string().optional().allow('', null),
    email: Joi.string().email().required(),  // Email is now required (Supabase Auth needs it)
    role: Joi.string().valid(
        'admin', 'cashier', 'designer', 'production', 'customer'
    ).optional().default('customer')
});

const updateUserSchema = Joi.object({
    first_name: Joi.string().optional().allow('', null),
    last_name: Joi.string().optional().allow('', null),
    email: Joi.string().email().optional().allow('', null),
    contact_number: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
    role: Joi.string().valid(
        'admin', 'cashier', 'designer', 'production', 'customer'
    ).optional(),
    password: Joi.string().min(8).optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

const bulkDeactivateSchema = Joi.object({
    ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

class UserService {
    /**
     * Get all users with optional filters
     * Supports: role, status (active/inactive), query (search)
     */
    async getAllUsers(filters = {}) {
        let query = supabase
            .from('users')
            .select(USER_SAFE_COLUMNS);

        // Filter by role
        if (filters.role) {
            query = query.eq('role', filters.role);
        }

        // Filter by active status
        if (filters.status) {
            if (filters.status === 'active') {
                query = query.eq('is_active', true);
            } else if (filters.status === 'inactive') {
                query = query.eq('is_active', false);
            }
        }

        // Search by first_name, last_name, or id
        if (filters.query) {
            const search = filters.query.trim();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUUID = uuidRegex.test(search);

            if (isUUID) {
                query = query.or(
                    `first_name.ilike.%${search}%,last_name.ilike.%${search}%,id.eq.${search}`
                );
            } else {
                query = query.or(
                    `first_name.ilike.%${search}%,last_name.ilike.%${search}%`
                );
            }
        }

        // Order by newest first
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Create a new user account (admin creating an employee)
     *
     * FLOW:
     * 1. Validate input with Joi
     * 2. Check username uniqueness in users table
     * 3. Check email uniqueness in users table
     * 4. Create Supabase Auth user via admin.createUser() (hashes password, stores in auth.users)
     * 5. The DB trigger (handle_new_user) auto-creates the public.users row
     * 6. Update the public.users row with username (trigger doesn't set username)
     */
    async createUser(userData) {
        // Step 1: Validate input
        const { error: validationError, value } = createUserSchema.validate(userData, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationError) {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';
            err.details = validationError.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            throw err;
        }

        // Step 2: Check username uniqueness
        const { data: existingUsername } = await supabase
            .from('users')
            .select('id')
            .eq('username', value.username)
            .limit(1)
            .maybeSingle();

        if (existingUsername) {
            const err = new Error('Username already exists');
            err.statusCode = 409;
            throw err;
        }

        // Step 3: Check email uniqueness
        if (value.email) {
            const { data: existingEmail } = await supabase
                .from('users')
                .select('id')
                .eq('email', value.email)
                .limit(1)
                .maybeSingle();

            if (existingEmail) {
                const err = new Error('Email already exists');
                err.statusCode = 409;
                throw err;
            }
        }

        // Step 4: Create Supabase Auth user
        // Passwords are hashed by Supabase — NEVER stored in our users table
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: value.email,
            password: value.password,
            email_confirm: true,   // Employees skip email confirmation
            user_metadata: {
                role: value.role.toLowerCase(),
                first_name: value.first_name || '',
                last_name: value.last_name || '',
                contact_number: value.contact_number || '',
            }
        });

        if (authError) {
            if (authError.message.includes('already been registered')) {
                const err = new Error('An account with this email already exists.');
                err.statusCode = 409;
                throw err;
            }
            throw authError;
        }

        // Step 5: The DB trigger (handle_new_user) has already inserted the public.users row
        // Step 6: Update the row with username (which the trigger doesn't set)
        // Also ensure role matches exactly what we want (trigger uses metadata)
        const { data, error } = await supabase
            .from('users')
            .update({
                username: value.username,
                role: value.role.toLowerCase(),
                contact_number: value.contact_number || null,
            })
            .eq('id', authData.user.id)
            .select(USER_SAFE_COLUMNS)
            .single();

        if (error) {
            // Clean up the auth user to avoid orphaned accounts
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw error;
        }

        return data;
    }

    /**
     * Bulk deactivate users by setting is_active = false
     */
    async bulkDeactivate(body) {
        const { error: validationError, value } = bulkDeactivateSchema.validate(body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationError) {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';
            err.details = validationError.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            throw err;
        }

        const { ids } = value;

        const { data, error } = await supabase
            .from('users')
            .update({ is_active: false })
            .in('id', ids)
            .select(USER_SAFE_COLUMNS);

        if (error) throw error;

        return {
            deactivated_count: data.length,
            deactivated_ids: data.map(u => u.id)
        };
    }

    /**
     * Reactivate a single user by ID
     */
    async reactivateUser(id) {
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: true })
            .eq('id', id)
            .select(USER_SAFE_COLUMNS)
            .single();

        if (error) throw error;

        if (!data) {
            const notFoundError = new Error('User not found');
            notFoundError.name = 'NotFoundError';
            throw notFoundError;
        }

        return data;
    }

    /**
     * Bulk reactivate users by setting is_active = true
     */
    async bulkReactivate(body) {
        const { error: validationError, value } = bulkDeactivateSchema.validate(body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationError) {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';
            err.details = validationError.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            throw err;
        }

        const { ids } = value;

        const { data, error } = await supabase
            .from('users')
            .update({ is_active: true })
            .in('id', ids)
            .select(USER_SAFE_COLUMNS);

        if (error) throw error;

        return {
            reactivated_count: data.length,
            reactivated_ids: data.map(u => u.id)
        };
    }

    /**
     * Update a user's profile fields
     *
     * REFACTORED:
     *   - Password changes go through Supabase Auth (admin.updateUserById), NOT the users table
     *   - Role changes sync to BOTH users table AND auth user_metadata
     *   - Email changes sync to BOTH users table AND auth user
     */
    async updateUser(id, userData) {
        // Validate input
        const { error: validationError, value } = updateUserSchema.validate(userData, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationError) {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';
            err.details = validationError.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            throw err;
        }

        // Check email uniqueness if email is being changed
        if (value.email) {
            const { data: existingEmail } = await supabase
                .from('users')
                .select('id')
                .eq('email', value.email)
                .neq('id', id)
                .limit(1)
                .maybeSingle();

            if (existingEmail) {
                const err = new Error('Email already in use by another account');
                err.statusCode = 409;
                throw err;
            }
        }

        // ── Sync changes to Supabase Auth ────────────────────────────────────
        // Build the auth update payload for things that live in auth.users
        const authUpdate = {};
        const metadataUpdate = {};

        if (value.password !== undefined) {
            // FIX: Password is now updated via Supabase Auth, NOT written to users table
            authUpdate.password = value.password;
        }

        if (value.email !== undefined) {
            authUpdate.email = value.email;
        }

        if (value.role !== undefined) {
            // FIX: Sync role to user_metadata so frontend AuthContext reads the correct role
            metadataUpdate.role = value.role.toLowerCase();
        }

        if (value.first_name !== undefined) {
            metadataUpdate.first_name = value.first_name || '';
        }

        if (value.last_name !== undefined) {
            metadataUpdate.last_name = value.last_name || '';
        }

        // Only call admin.updateUserById if there's something to sync
        if (Object.keys(authUpdate).length > 0 || Object.keys(metadataUpdate).length > 0) {
            const authPayload = { ...authUpdate };
            if (Object.keys(metadataUpdate).length > 0) {
                authPayload.user_metadata = metadataUpdate;
            }

            const { error: authSyncError } = await supabase.auth.admin.updateUserById(
                id,
                authPayload
            );

            if (authSyncError) {
                console.error('Failed to sync changes to Supabase Auth:', authSyncError.message);
                const err = new Error('Failed to update authentication data. Please try again.');
                err.statusCode = 500;
                throw err;
            }
        }

        // ── Update the public.users table ────────────────────────────────────
        // Build update payload (only include fields that belong in the users table)
        const updatePayload = {};
        if (value.first_name !== undefined) updatePayload.first_name = value.first_name || null;
        if (value.last_name !== undefined) updatePayload.last_name = value.last_name || null;
        if (value.email !== undefined) updatePayload.email = value.email || null;
        if (value.contact_number !== undefined) updatePayload.contact_number = value.contact_number || null;
        if (value.address !== undefined) updatePayload.address = value.address || null;
        if (value.role !== undefined) updatePayload.role = value.role.toLowerCase();
        // NOTE: password is deliberately NOT included — it only lives in auth.users

        // Only update if there are fields to update in the users table
        if (Object.keys(updatePayload).length === 0) {
            // Password-only update — no users table changes needed
            // Return the current user data
            const { data, error } = await supabase
                .from('users')
                .select(USER_SAFE_COLUMNS)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) {
                const notFoundError = new Error('User not found');
                notFoundError.name = 'NotFoundError';
                throw notFoundError;
            }
            return data;
        }

        const { data, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', id)
            .select(USER_SAFE_COLUMNS)
            .single();

        if (error) throw error;

        if (!data) {
            const notFoundError = new Error('User not found');
            notFoundError.name = 'NotFoundError';
            throw notFoundError;
        }

        return data;
    }
}

module.exports = new UserService();