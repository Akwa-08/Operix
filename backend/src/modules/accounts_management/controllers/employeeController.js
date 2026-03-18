// backend/src/modules/accounts_management/controllers/employeeController.js

const { supabase } = require('../../../config/supabase');
const { successResponse, errorResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class EmployeeController {
  getAllEmployees = asyncHandler(async (req, res) => {
    let query = supabase.from('employees').select('*');
    if (req.query.status === 'active') query = query.eq('is_active', true);
    else if (req.query.status === 'inactive') query = query.eq('is_active', false);
    if (req.query.query) {
      const s = req.query.query.trim();
      query = query.or(`full_name.ilike.%${s}%,employee_code.ilike.%${s}%,position.ilike.%${s}%`);
    }
    query = query.order('employee_code', { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    return successResponse(res, data, 'Employees retrieved successfully');
  });

  createEmployee = asyncHandler(async (req, res) => {
    const { employee_code, full_name, position, base_hourly_rate, holiday_rate_multiplier, overtime_rate_multiplier, hire_date } = req.body;
    if (!full_name || !position) return errorResponse(res, 'Full name and position are required.', 400);
    const { data, error } = await supabase.from('employees')
      .insert([{
        employee_code: employee_code || null,
        full_name, position,
        base_hourly_rate: base_hourly_rate || 0,
        holiday_rate_multiplier: holiday_rate_multiplier || 2.0,
        overtime_rate_multiplier: overtime_rate_multiplier || 1.5,
        hire_date: hire_date || new Date().toISOString().split('T')[0],
        is_active: true,
      }]).select().single();
    if (error) throw error;
    return successResponse(res, data, 'Employee record created', 201);
  });

  updateEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const allowed = ['employee_code','full_name','position','base_hourly_rate','holiday_rate_multiplier','overtime_rate_multiplier','hire_date','is_active'];
    const payload = {};
    for (const f of allowed) { if (req.body[f] !== undefined) payload[f] = req.body[f]; }
    if (!Object.keys(payload).length) return errorResponse(res, 'No fields to update.', 400);
    const { data, error } = await supabase.from('employees').update(payload).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return errorResponse(res, 'Employee not found.', 404);
    return successResponse(res, data, 'Employee updated');
  });

  deactivateEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('employees').update({ is_active: false }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return errorResponse(res, 'Employee not found.', 404);
    return successResponse(res, data, 'Employee deactivated');
  });
}

module.exports = new EmployeeController();