// backend/src/modules/payroll/routes/payrollRoutes.js
// Route definitions for the Payroll module

const express = require('express');
const router = express.Router();

const payrollController = require('../controllers/payrollController');

// ──── ATTENDANCE ROUTES ─────────────────────────────────────
// Summary for all employees, individual logs per employee

router.get('/attendance-summary', payrollController.getAttendanceSummary);
router.get('/attendance/:employeeId', payrollController.getEmployeeAttendance);

// ──── PAYROLL COMPUTATION ROUTES ────────────────────────────
// Bulk must come before :id routes

router.post('/compute', payrollController.computePayroll);
router.post('/compute-all', payrollController.computeAllPayroll);
router.get('/computation/:employeeId', payrollController.getComputationDetails);

// ──── SALARY HISTORY ROUTES ─────────────────────────────────

router.get('/salary-history', payrollController.getSalaryHistory);
router.get('/salary-history/:employeeId', payrollController.getEmployeeSalaryHistory);
router.get('/record/:id', payrollController.getPayrollRecord);

module.exports = router;
