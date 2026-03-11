// backend/src/modules/accounts_management/services/supplierService.js
// Business logic for account-scoped supplier management

const { supabase } = require('../../../config/supabase');
const Joi = require('joi');

// Validation schemas
const createSupplierSchema = Joi.object({
    name: Joi.string().min(2).required(),
    phone: Joi.string().optional().allow('', null),
    email: Joi.string().email().optional().allow('', null)
});

const flagSupplierSchema = Joi.object({
    is_flagged: Joi.boolean().required(),
    flag_reason: Joi.string().optional().allow('', null)
});

const bulkDeactivateSchema = Joi.object({
    ids: Joi.array().items(Joi.string().uuid()).min(1).required()
});

class SupplierService {
    /**
     * Get all suppliers with optional filters
     * Default: only active suppliers are returned
     */
    async getAllSuppliers(filters = {}) {
        let query = supabase
            .from('suppliers')
            .select('*');

        // Default to active only; support inactive and all
        const status = filters.status || 'active';
        if (status === 'active') {
            query = query.eq('is_active', true);
        } else if (status === 'inactive') {
            query = query.eq('is_active', false);
        }
        // status === 'all' → no filter

        // Filter by flagged state
        if (filters.flagged !== undefined) {
            query = query.eq('is_flagged', filters.flagged === 'true');
        }

        // Search by name or id
        if (filters.query) {
            const search = filters.query.trim();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUUID = uuidRegex.test(search);

            if (isUUID) {
                query = query.or(
                    `name.ilike.%${search}%,id.eq.${search}`
                );
            } else {
                query = query.or(
                    `name.ilike.%${search}%`
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
     * Create a new supplier
     */
    async createSupplier(supplierData) {
        // Validate input
        const { error: validationError, value } = createSupplierSchema.validate(supplierData, {
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

        const { data, error } = await supabase
            .from('suppliers')
            .insert([{
                name: value.name,
                phone: value.phone || null,
                email: value.email || null,
                is_active: true,
                is_flagged: false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Flag or unflag a supplier
     * Clears flag_reason when unflagging
     */
    async flagSupplier(id, body) {
        // Validate input
        const { error: validationError, value } = flagSupplierSchema.validate(body, {
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

        const updatePayload = {
            is_flagged: value.is_flagged,
            flag_reason: value.is_flagged ? (value.flag_reason || null) : null
        };

        const { data, error } = await supabase
            .from('suppliers')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            const notFoundError = new Error('Supplier not found');
            notFoundError.name = 'NotFoundError';
            throw notFoundError;
        }

        return data;
    }

    /**
     * Bulk deactivate suppliers by setting is_active = false
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
            .from('suppliers')
            .update({ is_active: false })
            .in('id', ids)
            .select();

        if (error) throw error;

        return {
            deactivated_count: data.length,
            deactivated_ids: data.map(s => s.id)
        };
    }
    /**
     * Reactivate a single supplier by ID
     */
    async reactivateSupplier(id) {
        const { data, error } = await supabase
            .from('suppliers')
            .update({ is_active: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            const notFoundError = new Error('Supplier not found');
            notFoundError.name = 'NotFoundError';
            throw notFoundError;
        }

        return data;
    }

    /**
     * Bulk reactivate suppliers by setting is_active = true
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
            .from('suppliers')
            .update({ is_active: true })
            .in('id', ids)
            .select();

        if (error) throw error;

        return {
            reactivated_count: data.length,
            reactivated_ids: data.map(s => s.id)
        };
    }
}

module.exports = new SupplierService();
