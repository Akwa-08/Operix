// backend/src/modules/payroll/controllers/payrollController.js
// Request/response handling for payroll operations

const payrollService = require('../services/payrollService');
const attendanceService = require('../services/attendanceService');
const salaryService = require('../services/salaryService');
const { successResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class PayrollController {
    // ── Attendance ───────────────────────────────────────────

    // Get attendance summary for all employees in a period
    getAttendanceSummary = asyncHandler(async (req, res) => {
        const data = await attendanceService.getAttendanceSummary(req.query);
        return successResponse(res, data, 'Attendance summary retrieved successfully');
    });

    // Get individual employee attendance with day classification
    getEmployeeAttendance = asyncHandler(async (req, res) => {
        const data = await attendanceService.getEmployeeAttendance(req.params.employeeId, req.query);
        return successResponse(res, data, 'Employee attendance retrieved successfully');
    });

    // ── Payroll Computation ──────────────────────────────────

    // Compute payroll for a single employee (RPC)
    computePayroll = asyncHandler(async (req, res) => {
        const result = await payrollService.computePayroll(req.body);
        return successResponse(res, result, 'Payroll computed successfully', 201);
    });

    // Compute payroll for all active employees (RPC batch)
    computeAllPayroll = asyncHandler(async (req, res) => {
        const result = await payrollService.computeAllPayroll(req.body);
        return successResponse(
            res,
            result,
            `Payroll computed: ${result.processed} succeeded, ${result.failed} failed`
        );
    });

    // Get computation details for an employee
    getComputationDetails = asyncHandler(async (req, res) => {
        const data = await payrollService.getComputationDetails(req.params.employeeId, req.query);
        return successResponse(res, data, 'Computation details retrieved successfully');
    });

    // ── Salary History ───────────────────────────────────────

    // Get all salary history (optionally filtered)
    getSalaryHistory = asyncHandler(async (req, res) => {
        const data = await salaryService.getSalaryHistory(req.query);
        return successResponse(res, data, 'Salary history retrieved successfully');
    });

    // Get salary history for a specific employee
    getEmployeeSalaryHistory = asyncHandler(async (req, res) => {
        const data = await salaryService.getEmployeeSalaryHistory(req.params.employeeId);
        return successResponse(res, data, 'Employee salary history retrieved successfully');
    });

    // Get a single payroll record
    getPayrollRecord = asyncHandler(async (req, res) => {
        const data = await salaryService.getPayrollRecord(req.params.id);
        return successResponse(res, data, 'Payroll record retrieved successfully');
    });
}

module.exports = new PayrollController();
