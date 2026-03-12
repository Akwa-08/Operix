// backend/src/modules/payroll/services/payrollService.js
// Core payroll computation — all logic in JS, no RPC needed

const { supabase } = require('../../../config/supabase');
const Joi = require('joi');

// Validation — use string pattern to keep dates as YYYY-MM-DD (avoids timezone issues)
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const computeSchema = Joi.object({
    employee_id: Joi.string().uuid().required(),
    period_start: Joi.string().pattern(datePattern).required().messages({ 'string.pattern.base': 'period_start must be YYYY-MM-DD' }),
    period_end: Joi.string().pattern(datePattern).required().messages({ 'string.pattern.base': 'period_end must be YYYY-MM-DD' })
});

const computeAllSchema = Joi.object({
    period_start: Joi.string().pattern(datePattern).required().messages({ 'string.pattern.base': 'period_start must be YYYY-MM-DD' }),
    period_end: Joi.string().pattern(datePattern).required().messages({ 'string.pattern.base': 'period_end must be YYYY-MM-DD' })
});

// Constants
const GOV_DEDUCTIONS = { SSS: 581.3, PHILHEALTH: 260, HDMF: 200 };
const STANDARD_HOURS = 8;
const WORK_START_MINUTES = 8 * 60;   // 08:00
const WORK_END_MINUTES = 17 * 60;    // 17:00

class PayrollService {
    /**
     * Compute payroll for a single employee — full 4-phase workflow in JS
     */
    async computePayroll(body) {
        const { error: validationError, value } = computeSchema.validate(body, {
            abortEarly: false, stripUnknown: true
        });
        if (validationError) {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';
            err.details = validationError.details.map(d => ({ field: d.path.join('.'), message: d.message }));
            throw err;
        }

        const result = await this._computeForEmployee(value.employee_id, value.period_start, value.period_end);
        return result;
    }

    /**
     * Compute payroll for ALL active employees in a period
     */
    async computeAllPayroll(body) {
        const { error: validationError, value } = computeAllSchema.validate(body, {
            abortEarly: false, stripUnknown: true
        });
        if (validationError) {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';
            err.details = validationError.details.map(d => ({ field: d.path.join('.'), message: d.message }));
            throw err;
        }

        // Get all active employees
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('id, full_name')
            .eq('is_active', true);

        if (empError) throw empError;
        if (!employees || employees.length === 0) {
            const err = new Error('No active employees found');
            err.statusCode = 404;
            throw err;
        }

        const results = [];
        const errors = [];

        for (const emp of employees) {
            try {
                const result = await this._computeForEmployee(emp.id, value.period_start, value.period_end);
                results.push(result);
            } catch (err) {
                errors.push({ employee_id: emp.id, name: emp.full_name, error: err.message });
            }
        }

        return {
            processed: results.length,
            failed: errors.length,
            total: employees.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * Internal: 4-phase payroll engine for one employee
     */
    async _computeForEmployee(employeeId, periodStart, periodEnd) {
        // ── Phase 1: Filter ─────────────────────────────────
        // Get employee info
        const { data: employee, error: empErr } = await supabase
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .eq('is_active', true)
            .single();

        if (empErr || !employee) {
            const err = new Error('Employee not found or inactive');
            err.statusCode = 400;
            throw err;
        }

        // Get attendance logs for the period
        const { data: logs, error: logsErr } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('date', periodStart)
            .lte('date', periodEnd)
            .not('time_in', 'is', null)
            .order('date', { ascending: true });

        if (logsErr) throw logsErr;

        // Get holidays in the period
        const { data: holidays, error: holErr } = await supabase
            .from('holidays')
            .select('*');

        if (holErr) throw holErr;

        // Build holiday lookup (including recurring holidays)
        const holidayMap = {};
        for (const h of (holidays || [])) {
            holidayMap[h.holiday_date] = h;
        }

        // ── Phase 2 & 3: Classify + Calculate ───────────────
        let totalNormalDays = 0;
        let totalRegularHolidayHours = 0;
        let totalSpecialHolidayHours = 0;
        let totalOvertimeHours = 0;
        let totalTardyHours = 0;
        let totalHours = 0;

        for (const log of (logs || [])) {
            // Classify the day
            let dayType = 'Normal';
            const directHoliday = holidayMap[log.date];

            if (directHoliday) {
                dayType = directHoliday.type; // 'Regular' or 'Special'
            } else {
                // Check recurring holidays (match month + day)
                const logDate = new Date(log.date);
                const logMonth = logDate.getMonth() + 1;
                const logDay = logDate.getDate();

                for (const h of (holidays || [])) {
                    if (h.is_recurring) {
                        const hDate = new Date(h.holiday_date);
                        if ((hDate.getMonth() + 1) === logMonth && hDate.getDate() === logDay) {
                            dayType = h.type;
                            break;
                        }
                    }
                }
            }

            // Calculate hours worked
            let hoursWorked = 0;
            if (log.time_out) {
                hoursWorked = (new Date(log.time_out) - new Date(log.time_in)) / 3600000;
            }

            // Split into regular + OT
            let regularHours = Math.min(hoursWorked, STANDARD_HOURS);
            let otHours = Math.max(0, hoursWorked - STANDARD_HOURS);

            // Calculate tardy (late arrival + early departure)
            let tardyMinutes = 0;
            const timeIn = new Date(log.time_in);
            const minutesIn = timeIn.getHours() * 60 + timeIn.getMinutes();
            if (minutesIn > WORK_START_MINUTES) {
                tardyMinutes += (minutesIn - WORK_START_MINUTES);
            }

            if (log.time_out) {
                const timeOut = new Date(log.time_out);
                const minutesOut = timeOut.getHours() * 60 + timeOut.getMinutes();
                if (minutesOut < WORK_END_MINUTES) {
                    tardyMinutes += (WORK_END_MINUTES - minutesOut);
                }
            }

            totalTardyHours += tardyMinutes / 60;

            // Accumulate by day type
            if (dayType === 'Normal') {
                totalNormalDays += 1;
                totalOvertimeHours += otHours;
            } else if (dayType === 'Regular') {
                totalRegularHolidayHours += regularHours;
            } else if (dayType === 'Special') {
                totalSpecialHolidayHours += regularHours;
            }

            totalHours += hoursWorked;
        }

        // ── Phase 3: Compute pay ────────────────────────────
        const rate = employee.base_hourly_rate || 0;
        const holidayMultiplier = employee.holiday_rate_multiplier || 2.0;
        const otMultiplier = employee.overtime_rate_multiplier || 1.25;

        const basicPay = totalNormalDays * STANDARD_HOURS * rate;
        const regularHolidayPay = totalRegularHolidayHours * (rate * holidayMultiplier);
        const specialHolidayPay = totalSpecialHolidayHours * (rate * 1.3);
        const overtimePay = totalOvertimeHours * (rate * otMultiplier);
        const grossPay = basicPay + regularHolidayPay + specialHolidayPay + overtimePay;

        // Deductions
        const tardyDeduction = totalTardyHours * rate;
        const govDeductions = GOV_DEDUCTIONS.SSS + GOV_DEDUCTIONS.PHILHEALTH + GOV_DEDUCTIONS.HDMF;

        // Cash advance: check if there's already a record with cash_advance set
        let cashAdvance = 0;
        const { data: existingRecord } = await supabase
            .from('payroll_records')
            .select('cash_advance')
            .eq('employee_id', employeeId)
            .eq('period_start', periodStart)
            .eq('period_end', periodEnd)
            .maybeSingle();

        if (existingRecord && existingRecord.cash_advance) {
            cashAdvance = parseFloat(existingRecord.cash_advance) || 0;
        }

        const totalDeductions = tardyDeduction + govDeductions + cashAdvance;
        const netSalary = grossPay - totalDeductions;

        // ── Phase 4: Persist ────────────────────────────────
        const payrollData = {
            employee_id: employeeId,
            period_start: periodStart,
            period_end: periodEnd,
            total_hours: round2(totalHours),
            hourly_rate: rate,
            holiday_hours: round2(totalRegularHolidayHours + totalSpecialHolidayHours),
            overtime_hours: round2(totalOvertimeHours),
            cash_advance: cashAdvance,
            bonus: existingRecord?.bonus || 0,
            total_salary: round2(netSalary)
        };

        // Upsert: if a record exists for this employee+period, update; otherwise insert
        if (existingRecord) {
            const { error: updateErr } = await supabase
                .from('payroll_records')
                .update(payrollData)
                .eq('employee_id', employeeId)
                .eq('period_start', periodStart)
                .eq('period_end', periodEnd);

            if (updateErr) throw updateErr;
        } else {
            const { error: insertErr } = await supabase
                .from('payroll_records')
                .insert([payrollData]);

            if (insertErr) throw insertErr;
        }

        // Return full breakdown
        return {
            employee_id: employeeId,
            employee_name: employee.full_name,
            period: { start: periodStart, end: periodEnd },
            attendance: {
                total_hours: round2(totalHours),
                normal_days: totalNormalDays,
                regular_holiday_hours: round2(totalRegularHolidayHours),
                special_holiday_hours: round2(totalSpecialHolidayHours),
                overtime_hours: round2(totalOvertimeHours),
                tardy_hours: round2(totalTardyHours)
            },
            earnings: {
                basic_pay: round2(basicPay),
                regular_holiday_pay: round2(regularHolidayPay),
                special_holiday_pay: round2(specialHolidayPay),
                overtime_pay: round2(overtimePay),
                gross_pay: round2(grossPay)
            },
            deductions: {
                tardy_deduction: round2(tardyDeduction),
                sss: GOV_DEDUCTIONS.SSS,
                philhealth: GOV_DEDUCTIONS.PHILHEALTH,
                hdmf: GOV_DEDUCTIONS.HDMF,
                cash_advance: cashAdvance,
                total_deductions: round2(totalDeductions)
            },
            net_salary: round2(netSalary)
        };
    }

    /**
     * Get computation details for a specific employee and period
     */
    async getComputationDetails(employeeId, filters = {}) {
        let query = supabase
            .from('payroll_records')
            .select(`
                *,
                employees (
                    id, employee_code, full_name, position,
                    base_hourly_rate, holiday_rate_multiplier, overtime_rate_multiplier
                )
            `)
            .eq('employee_id', employeeId);

        if (filters.period_start) {
            query = query.eq('period_start', filters.period_start);
        }
        if (filters.period_end) {
            query = query.eq('period_end', filters.period_end);
        }

        query = query.order('period_start', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
}

// Helper: round to 2 decimal places
function round2(val) {
    return Math.round((val || 0) * 100) / 100;
}

module.exports = new PayrollService();
