// backend/src/modules/payroll/services/attendanceService.js
// Attendance queries for the payroll module

const { supabase } = require('../../../config/supabase');

class AttendanceService {
    /**
     * Get attendance summary for all employees in a date range
     * Returns: worked hours, late count, OT hours per person
     */
    async getAttendanceSummary(filters = {}) {
        const { period_start, period_end } = filters;

        // Fetch all attendance logs in the period
        let logsQuery = supabase
            .from('attendance_logs')
            .select(`
                id, employee_id, date, time_in, time_out, created_at,
                employees (id, employee_code, full_name, position, base_hourly_rate)
            `);

        if (period_start) {
            logsQuery = logsQuery.gte('date', period_start);
        }
        if (period_end) {
            logsQuery = logsQuery.lte('date', period_end);
        }

        logsQuery = logsQuery.order('date', { ascending: false });

        const { data: logs, error } = await logsQuery;
        if (error) throw error;

        // Aggregate per employee
        const summary = {};
        const STANDARD_HOURS = 8;
        const WORK_START = 8 * 60; // 8:00 AM in minutes

        for (const log of logs) {
            const empId = log.employee_id;
            if (!summary[empId]) {
                summary[empId] = {
                    employee_id: empId,
                    employee: log.employees,
                    days_present: 0,
                    total_hours: 0,
                    overtime_hours: 0,
                    late_count: 0,
                    total_tardy_minutes: 0
                };
            }

            const s = summary[empId];
            s.days_present++;

            if (log.time_in && log.time_out) {
                const hoursWorked = (new Date(log.time_out) - new Date(log.time_in)) / 3600000;
                s.total_hours += hoursWorked;

                if (hoursWorked > STANDARD_HOURS) {
                    s.overtime_hours += hoursWorked - STANDARD_HOURS;
                }
            }

            // Check if late (arrived after 8:00 AM)
            if (log.time_in) {
                const timeIn = new Date(log.time_in);
                const minutesIn = timeIn.getHours() * 60 + timeIn.getMinutes();
                if (minutesIn > WORK_START) {
                    s.late_count++;
                    s.total_tardy_minutes += (minutesIn - WORK_START);
                }
            }
        }

        // Convert to array and round values
        return Object.values(summary).map(s => ({
            ...s,
            total_hours: Math.round(s.total_hours * 100) / 100,
            overtime_hours: Math.round(s.overtime_hours * 100) / 100,
            total_tardy_minutes: Math.round(s.total_tardy_minutes)
        }));
    }

    /**
     * Get individual employee attendance logs with day classification
     */
    async getEmployeeAttendance(employeeId, filters = {}) {
        const { period_start, period_end } = filters;

        // Fetch logs
        let logsQuery = supabase
            .from('attendance_logs')
            .select('*')
            .eq('employee_id', employeeId);

        if (period_start) {
            logsQuery = logsQuery.gte('date', period_start);
        }
        if (period_end) {
            logsQuery = logsQuery.lte('date', period_end);
        }

        logsQuery = logsQuery.order('date', { ascending: true });

        const { data: logs, error: logsError } = await logsQuery;
        if (logsError) throw logsError;

        // Fetch holidays in the range for classification
        let holidayQuery = supabase.from('holidays').select('*');
        if (period_start) {
            holidayQuery = holidayQuery.gte('holiday_date', period_start);
        }
        if (period_end) {
            holidayQuery = holidayQuery.lte('holiday_date', period_end);
        }

        const { data: holidays, error: holError } = await holidayQuery;
        if (holError) throw holError;

        // Build a lookup map for holidays
        const holidayMap = {};
        for (const h of (holidays || [])) {
            holidayMap[h.holiday_date] = h;
        }

        // Classify each log
        const STANDARD_HOURS = 8;
        const WORK_START_MINUTES = 8 * 60;

        return logs.map(log => {
            const holiday = holidayMap[log.date];
            const dayType = holiday ? holiday.type : 'Normal';
            const holidayName = holiday ? holiday.name : null;

            let hoursWorked = 0;
            let overtimeHours = 0;
            let tardyMinutes = 0;

            if (log.time_in && log.time_out) {
                hoursWorked = (new Date(log.time_out) - new Date(log.time_in)) / 3600000;
                if (hoursWorked > STANDARD_HOURS) {
                    overtimeHours = hoursWorked - STANDARD_HOURS;
                }
            }

            if (log.time_in) {
                const timeIn = new Date(log.time_in);
                const minutesIn = timeIn.getHours() * 60 + timeIn.getMinutes();
                if (minutesIn > WORK_START_MINUTES) {
                    tardyMinutes = minutesIn - WORK_START_MINUTES;
                }
            }

            return {
                ...log,
                day_type: dayType,
                holiday_name: holidayName,
                hours_worked: Math.round(hoursWorked * 100) / 100,
                overtime_hours: Math.round(overtimeHours * 100) / 100,
                tardy_minutes: tardyMinutes
            };
        });
    }
}

module.exports = new AttendanceService();
