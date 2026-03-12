// backend/src/modules/payroll/services/salaryService.js
// Salary history queries for the payroll module

const { supabase } = require('../../../config/supabase');

class SalaryService {
    /**
     * Get salary history — all payroll records grouped by period
     * Supports optional employee_id filter
     */
    async getSalaryHistory(filters = {}) {
        let query = supabase
            .from('payroll_records')
            .select(`
                *,
                employees (id, employee_code, full_name, position)
            `);

        if (filters.employee_id) {
            query = query.eq('employee_id', filters.employee_id);
        }

        if (filters.period_start) {
            query = query.gte('period_start', filters.period_start);
        }

        if (filters.period_end) {
            query = query.lte('period_end', filters.period_end);
        }

        query = query.order('period_start', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get salary history for a specific employee
     */
    async getEmployeeSalaryHistory(employeeId) {
        const { data, error } = await supabase
            .from('payroll_records')
            .select('*')
            .eq('employee_id', employeeId)
            .order('period_start', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get a single payroll record by ID
     */
    async getPayrollRecord(id) {
        const { data, error } = await supabase
            .from('payroll_records')
            .select(`
                *,
                employees (id, employee_code, full_name, position, base_hourly_rate)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            const notFoundError = new Error('Payroll record not found');
            notFoundError.name = 'NotFoundError';
            throw notFoundError;
        }

        return data;
    }
}

module.exports = new SalaryService();
