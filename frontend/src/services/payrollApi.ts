// frontend/src/services/payrollApi.ts

// API Response type wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// ── Types corresponding to Backend ────────────────────────────────────────

export interface EmployeeAttendanceSummary {
    employee_id: string;
    employee: {
        id: string;
        employee_code: string;
        full_name: string;
        position: string;
        base_hourly_rate: number;
    };
    days_present: number;
    total_hours: number;
    overtime_hours: number;
    late_count: number;
    total_tardy_minutes: number;
}

export interface AttendanceLog {
    id: string;
    employee_id: string;
    date: string;
    time_in: string | null;
    time_out: string | null;
    day_type: string;
    holiday_name: string | null;
    hours_worked: number;
    overtime_hours: number;
    tardy_minutes: number;
}

export interface SalaryComputation {
    employee_id: string;
    employee_name: string;
    department: string;
    position: string;
    daily_rate: number;
    period: { start: string; end: string };
    attendance: {
        total_hours: number;
        days_present: number;
        normal_days: number;
        regular_holiday_hours: number;
        special_holiday_hours: number;
        overtime_hours: number;
        tardy_hours: number;
        undertime_hours: number;
    };
    earnings: {
        basic_pay: number;
        regular_holiday_pay: number;
        special_holiday_pay: number;
        overtime_pay: number;
        gross_pay: number;
    };
    deductions: {
        tardy_deduction: number;
        undertime_deduction: number;
        sss: number;
        philhealth: number;
        hdmf: number;
        withholding_tax: number;
        cash_advance: number;
        total_deductions: number;
    };
    bonus: number;
    taxable_income: number;
    tax_rate_applied: string;
    net_salary: number;
}

export interface PayrollRecord {
    id: string;
    employee_id: string;
    period_start: string;
    period_end: string;
    total_hours: number;
    hourly_rate: number;
    holiday_hours: number;
    overtime_hours: number;
    cash_advance: number;
    bonus: number;
    total_salary: number;
    created_at: string;
    employees: {
        id: string;
        employee_code: string;
        full_name: string;
        position: string;
    };
}

export interface ComputeAllResponse {
    processed: number;
    failed: number;
    total: number;
    results: SalaryComputation[];
    errors?: any[];
}

// ── API Functions ─────────────────────────────────────────────────────────

class PayrollApi {
    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`/api/payroll${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'API request failed');
        }

        return result.data as T;
    }

    // 1. Get Attendance Summary for all employees
    async getAttendanceSummary(periodStart?: string, periodEnd?: string): Promise<EmployeeAttendanceSummary[]> {
        const params = new URLSearchParams();
        if (periodStart) params.append('period_start', periodStart);
        if (periodEnd) params.append('period_end', periodEnd);
        const queryString = params.toString() ? `?${params.toString()}` : '';

        return this.fetch<EmployeeAttendanceSummary[]>(`/attendance-summary${queryString}`);
    }

    // 2. Get individual employee attendance
    async getEmployeeAttendance(employeeId: string, periodStart?: string, periodEnd?: string): Promise<AttendanceLog[]> {
        const params = new URLSearchParams();
        if (periodStart) params.append('period_start', periodStart);
        if (periodEnd) params.append('period_end', periodEnd);
        const queryString = params.toString() ? `?${params.toString()}` : '';

        return this.fetch<AttendanceLog[]>(`/attendance/${employeeId}${queryString}`);
    }

    // 3. Compute payroll for all active employees
    async computeAllPayroll(periodStart: string, periodEnd: string): Promise<ComputeAllResponse> {
        return this.fetch<ComputeAllResponse>('/compute-all', {
            method: 'POST',
            body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
        });
    }

    // 4. Compute payroll for single employee
    async computePayroll(employeeId: string, periodStart: string, periodEnd: string): Promise<SalaryComputation> {
        return this.fetch<SalaryComputation>('/compute', {
            method: 'POST',
            body: JSON.stringify({ employee_id: employeeId, period_start: periodStart, period_end: periodEnd }),
        });
    }

    // 5. Get computation details for an employee
    async getComputationDetails(employeeId: string, periodStart?: string, periodEnd?: string): Promise<PayrollRecord[]> {
        const params = new URLSearchParams();
        if (periodStart) params.append('period_start', periodStart);
        if (periodEnd) params.append('period_end', periodEnd);
        const queryString = params.toString() ? `?${params.toString()}` : '';

        return this.fetch<PayrollRecord[]>(`/computation/${employeeId}${queryString}`);
    }

    // 6. Get Salary History (all payroll records grouped by period)
    async getSalaryHistory(periodStart?: string, periodEnd?: string, employeeId?: string): Promise<PayrollRecord[]> {
        const params = new URLSearchParams();
        if (periodStart) params.append('period_start', periodStart);
        if (periodEnd) params.append('period_end', periodEnd);
        if (employeeId) params.append('employee_id', employeeId);
        const queryString = params.toString() ? `?${params.toString()}` : '';

        return this.fetch<PayrollRecord[]>(`/salary-history${queryString}`);
    }
}

export const payrollApi = new PayrollApi();
