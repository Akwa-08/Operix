// backend/src/modules/accounts_management/services/userService.js
// Business logic for user/employee account management

const { supabase } = require('../../../config/supabase');
const Joi = require('joi');

// Columns to select (explicitly excludes password)
const USER_SAFE_COLUMNS = 'id, first_name, last_name, username, contact_number, email, role, is_active, created_at';

// Validation schemas
const createUserSchema = Joi.object({
    first_name: Joi.string().optional().allow('', null),
    last_name: Joi.string().optional().allow('', null),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(8).required(),
    contact_number: Joi.string().optional().allow('', null),
    email: Joi.string().email().optional().allow('', null),
    role: Joi.string().optional().default('Employee')
});

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

        // Filter by role (e.g. ?role=Employee for Employee List view)
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
            // Only include UUID match if search looks like a valid UUID
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
     * Create a new user account
     * Validates uniqueness of username and email before insertion
     * NOTE: Password is stored as plain text for now (no hashing)
     */
    async createUser(userData) {
        // Validate input
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

        // Check username uniqueness
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

        // Check email uniqueness (only if provided)
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

        // Insert user (password stored as plain text for now)
        const { data, error } = await supabase
            .from('users')
            .insert([{
                first_name: value.first_name || null,
                last_name: value.last_name || null,
                username: value.username,
                password: value.password,
                contact_number: value.contact_number || null,
                email: value.email || null,
                role: value.role
            }])
            .select(USER_SAFE_COLUMNS)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Bulk deactivate users by setting is_active = false
     * Accepts an array of UUIDs
     */
    async bulkDeactivate(body) {
        // Validate input
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
     * Accepts an array of UUIDs
     */
    async bulkReactivate(body) {
        // Validate input
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
}

module.exports = new UserService();
