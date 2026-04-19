import {useState, useRef} from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Printer,
  Eye,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Edit2,
  RefreshCw,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import {supabase} from "../../config/supabaseClient";
import {
  usePayrollData,
  useEmployees,
  usePendingCashAdvances,
  type AttendanceLog,
  type PayrollRecord,
  type PayrollPeriod,
  type PendingCashAdvance,
} from "../../hooks/useSupabase";

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

const periodLabel = (p: PayrollPeriod) => {
  const s = new Date(p.periodStart).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
  const e = new Date(p.periodEnd).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${s} – ${e}`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color = "text-gray-900",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      <p className={`text-3xl font-bold mb-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Create Period Modal ──────────────────────────────────────────────────────
function CreatePeriodModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (d: {
    period_start: string;
    period_end: string;
    pay_date?: string;
  }) => Promise<any>;
}) {
  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
    pay_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.period_start || !form.period_end) {
      setErr("Start and end date required.");
      return;
    }
    setSaving(true);
    const r = await onCreate({...form, pay_date: form.pay_date || undefined});
    if (!r.success) setErr(r.error || "Failed");
    else onClose();
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          New Payroll Period
        </h3>
        <div className="space-y-4">
          {[
            {label: "Period Start", key: "period_start"},
            {label: "Period End", key: "period_end"},
            {label: "Pay Date (optional)", key: "pay_date"},
          ].map(({label, key}) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="date"
                value={(form as any)[key]}
                onChange={(e) =>
                  setForm((f) => ({...f, [key]: e.target.value}))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          ))}
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50">
            {saving ? "Creating…" : "Create Period"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Edit Modal ────────────────────────────────────────────────────
function AttendanceEditModal({
  log,
  periodId,
  onClose,
  onSave,
}: {
  log: AttendanceLog;
  periodId: string;
  onClose: () => void;
  onSave: (d: any) => Promise<any>;
}) {
  const [form, setForm] = useState({
    worked_hours: log.workedHours,
    late_timeslots: log.lateTimeslots,
    early_leave_timeslots: log.earlyLeaveTimeslots,
    regular_overtime_hours: log.regularOvertimeHours,
    holiday_overtime_hours: log.holidayOvertimeHours,
    special_overtime_hours: log.specialOvertimeHours,
    business_trip_days: log.businessTripDays,
    absences: log.absences,
    on_leave_days: log.onLeaveDays,
    additional_pay: log.additionalPay,
    deduction_amount: log.deductionAmount,
  });
  const [saving, setSaving] = useState(false);

  const field = (label: string, key: keyof typeof form, step = 1) => (
    <div key={key} className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type="number"
        step={step}
        value={(form as any)[key]}
        onChange={(e) =>
          setForm((f) => ({...f, [key]: parseFloat(e.target.value) || 0}))
        }
        className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      employee_id: log.employeeId,
      payroll_period_id: periodId,
      ...form,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 my-8 relative"
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Edit Attendance
        </h3>
        <p className="text-sm text-gray-500 mb-6">{log.fullName}</p>
        <div className="space-y-3">
          {field("Worked Hours", "worked_hours", 0.5)}
          {field("Late (timeslots × 30min)", "late_timeslots")}
          {field("Early Leave (timeslots × 30min)", "early_leave_timeslots")}
          {field("Regular OT Hours", "regular_overtime_hours", 0.5)}
          {field("Holiday OT Hours", "holiday_overtime_hours", 0.5)}
          {field("Special OT Hours", "special_overtime_hours", 0.5)}
          {field("Business Trip Days", "business_trip_days")}
          {field("Absences", "absences")}
          {field("On Leave Days", "on_leave_days")}
          {field("Additional Pay (₱)", "additional_pay", 0.01)}
          {field("Cash Advance / Deductions (₱)", "deduction_amount", 0.01)}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payslip Modal ────────────────────────────────────────────────────────────
function PayslipModal({
  record,
  onClose,
}: {
  record: PayrollRecord;
  onClose: () => void;
}) {
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document
      .write(`<!DOCTYPE html><html><head><title>Payslip — ${record.employeeName}</title>
    <style>
      body { font-family: 'Courier New', monospace; padding: 24px; font-size: 12px; color: #111; }
      h2 { font-size: 15px; font-weight: bold; margin: 0 0 4px; }
      .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
      h3 { font-size: 11px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 1px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .row span:last-child { font-weight: 600; }
      .total-row { display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 6px; }
      .net-box { background: #d1fae5; padding: 10px 14px; border-radius: 4px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; }
      .red { color: #dc2626; } .blue { color: #2563eb; } .green { color: #16a34a; }
    </style></head><body>
    <div class="header">
      <div>
        <h2>VTA LINK PRINTING SERVICES</h2>
        <p style="margin:2px 0"><b>BILLED TO:</b> ${record.employeeName}</p>
        <p style="margin:2px 0">Code: ${record.employeeCode}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:13px;font-weight:bold">${new Date().toLocaleDateString("en-PH", {day: "numeric", month: "long", year: "numeric"})}</p>
        <p><b>Position:</b> ${record.position}</p>
      </div>
    </div>
    <div class="grid2">
      <div>
        <h3>EMPLOYEE INFORMATION</h3>
        <div class="row"><span>Name:</span><span>${record.employeeName}</span></div>
        <div class="row"><span>Position:</span><span>${record.position}</span></div>
        <div class="row"><span>Daily Rate:</span><span>${fmt(record.dailyRate)}</span></div>
        <div class="row"><span>Days Present:</span><span>${record.daysPresent}</span></div>
      </div>
      <div>
        <h3>EARNINGS BREAKDOWN</h3>
        <div class="row"><span>Basic Pay:</span><span>${fmt(record.basicPay)}</span></div>
        <div class="row"><span>Regular Holiday Pay:</span><span>${fmt(record.regularHolidayPay)}</span></div>
        <div class="row"><span>Special Holiday Pay:</span><span>${fmt(record.specialHolidayPay)}</span></div>
        <div class="row"><span>Regular OT:</span><span>${fmt(record.regularOvertime)}</span></div>
        <div class="row"><span>Holiday OT:</span><span>${fmt(record.holidayOvertime)}</span></div>
        <div class="row"><span>Special OT:</span><span>${fmt(record.specialOvertime)}</span></div>
        <div class="total-row"><span>GROSS INCOME:</span><span>${fmt(record.grossIncome)}</span></div>
      </div>
    </div>
    <div class="grid2">
      <div>
        <h3>DEDUCTIONS</h3>
        <div class="row"><span>Tardy Deductions:</span><span class="red">${fmt(record.tardyDeductions)}</span></div>
        <div class="row"><span>Undertime Deductions:</span><span class="red">${fmt(record.undertimeDeductions)}</span></div>
        <div class="row"><span>PhilHealth:</span><span class="blue">${fmt(record.philhealth)}</span></div>
        <div class="row"><span>HDMF (Pag-IBIG):</span><span class="blue">${fmt(record.hdmf)}</span></div>
        <div class="row"><span>Withholding Tax:</span><span>${fmt(record.withholdingTax)}</span></div>
        <div class="row"><span>Cash Advance:</span><span class="red">${fmt(record.cashAdvance)}</span></div>
        <div class="total-row"><span>TOTAL DEDUCTIONS:</span><span class="red">-${fmt(record.totalDeductions)}</span></div>
      </div>
      <div>
        <h3>PAY SUMMARY</h3>
        <div class="row"><span>Gross Income:</span><span class="green">${fmt(record.grossIncome)}</span></div>
        <div class="row"><span>Total Deductions:</span><span class="red">-${fmt(record.totalDeductions)}</span></div>
        <div class="net-box"><span>NET PAY</span><span class="green">${fmt(record.netPay)}</span></div>
        <div style="margin-top:8px;font-size:10px;color:#666">
          <div class="row"><span>Taxable Income:</span><span>${fmt(record.taxableIncome)}</span></div>
          <div class="row"><span>Tax Rate:</span><span>0%</span></div>
        </div>
      </div>
    </div>
    </body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
      w.close();
    }, 400);
  };

  const rows = (label: string, val: number, color = "text-gray-900") => (
    <div key={label} className="flex justify-between text-sm py-0.5">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${color}`}>{fmt(val)}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Payslip Preview</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-gray-50">
          <div
            className="bg-white p-6 shadow-sm border rounded-lg"
            style={{fontFamily: "Courier New, monospace"}}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-base font-bold mb-1">
                  VTA LINK PRINTING SERVICES
                </h2>
                <p className="text-xs font-bold">BILLED TO:</p>
                <p className="text-xs">{record.employeeName}</p>
                <p className="text-xs text-gray-500">
                  Code: {record.employeeCode}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="text-sm font-bold">
                  {new Date().toLocaleDateString("en-PH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="font-bold mt-1">Position:</p>
                <p>{record.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-xs font-bold tracking-widest mb-2 pb-1 border-b border-gray-300">
                  EMPLOYEE INFORMATION
                </h3>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-semibold">{record.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span className="font-semibold">{record.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span className="font-semibold">
                      {fmt(record.dailyRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Present:</span>
                    <span className="font-semibold">{record.daysPresent}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-widest mb-2 pb-1 border-b border-gray-300">
                  EARNINGS BREAKDOWN
                </h3>
                <div className="space-y-0.5 text-xs">
                  {rows("Basic Pay", record.basicPay)}
                  {rows("Regular Holiday Pay", record.regularHolidayPay)}
                  {rows("Special Holiday Pay", record.specialHolidayPay)}
                  {rows("Regular OT", record.regularOvertime)}
                  {rows("Holiday OT", record.holidayOvertime)}
                  {rows("Special OT", record.specialOvertime)}
                  <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1 text-xs">
                    <span>GROSS INCOME:</span>
                    <span>{fmt(record.grossIncome)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold tracking-widest mb-2 pb-1 border-b border-gray-300">
                  DEDUCTIONS
                </h3>
                <div className="space-y-0.5 text-xs">
                  {rows(
                    "Tardy Deductions",
                    record.tardyDeductions,
                    "text-red-600",
                  )}
                  {rows(
                    "Undertime Deductions",
                    record.undertimeDeductions,
                    "text-red-600",
                  )}
                  {rows("PhilHealth", record.philhealth, "text-blue-600")}
                  {rows("HDMF (Pag-IBIG)", record.hdmf, "text-blue-600")}
                  {rows(
                    "Withholding Tax",
                    record.withholdingTax,
                    "text-gray-500",
                  )}
                  {rows("Cash Advance", record.cashAdvance, "text-red-600")}
                  <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1 text-xs">
                    <span>TOTAL DEDUCTIONS:</span>
                    <span className="text-red-600">
                      -{fmt(record.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-widest mb-2 pb-1 border-b border-gray-300">
                  PAY SUMMARY
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Gross Income:</span>
                    <span className="text-green-600 font-semibold">
                      {fmt(record.grossIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Deductions:</span>
                    <span className="text-red-600 font-semibold">
                      -{fmt(record.totalDeductions)}
                    </span>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded font-bold flex justify-between mt-2">
                    <span>Net Pay</span>
                    <span className="text-green-700">{fmt(record.netPay)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-0.5 text-[10px] text-gray-400">
                    <div className="flex justify-between">
                      <span>Taxable Income:</span>
                      <span>{fmt(record.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Rate:</span>
                      <span>0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t bg-white">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <X size={16} /> Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cash Advance Modal ───────────────────────────────────────────────────────
function CashAdvanceModal({
  employees,
  onClose,
  onCreate,
}: {
  employees: any[];
  onClose: () => void;
  onCreate: (d: {
    employee_id: string;
    amount: number;
    date_issued?: string;
    reason?: string;
  }) => Promise<any>;
}) {
  const [form, setForm] = useState({
    employee_id: "",
    amount: "",
    date_issued: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!form.employee_id) {
      setErr("Select an employee.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setErr("Enter a valid amount.");
      return;
    }
    setSaving(true);
    const r = await onCreate({
      employee_id: form.employee_id,
      amount: Number(form.amount),
      date_issued: form.date_issued,
      reason: form.reason || undefined,
    });
    if (!r.success) setErr(r.error || "Failed");
    else onClose();
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Record Cash Advance
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Employee *
            </label>
            <select
              value={form.employee_id}
              onChange={(e) =>
                setForm((f) => ({...f, employee_id: e.target.value}))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select employee…</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} — {emp.employee_code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Amount (₱) *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({...f, amount: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Date Issued
            </label>
            <input
              type="date"
              value={form.date_issued}
              onChange={(e) =>
                setForm((f) => ({...f, date_issued: e.target.value}))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({...f, reason: e.target.value}))}
              rows={3}
              placeholder="e.g. Medical emergency, personal loan…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50">
            {saving ? "Saving…" : "Record Advance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Decline Reason Modal ─────────────────────────────────────────────────────
function DeclineReasonModal({
  advance,
  onClose,
  onDecline,
}: {
  advance: PendingCashAdvance;
  onClose: () => void;
  onDecline: (id: string, reason: string) => Promise<any>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleDecline = async () => {
    if (!reason.trim()) {
      setErr("Please provide a reason for declining.");
      return;
    }
    setSaving(true);
    const r = await onDecline(advance.id, reason.trim());
    if (!r.success) setErr(r.error || "Failed to decline");
    else onClose();
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ThumbsDown size={18} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Decline Cash Advance
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Declining <strong>{fmt(advance.amount)}</strong> request from{" "}
          <strong>{advance.employeeName}</strong>.
        </p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErr("");
            }}
            rows={4}
            placeholder="e.g. Already has a pending advance, exceeds allowable limit…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            autoFocus
          />
          {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={saving}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
            {saving ? "Declining…" : "Confirm Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cash Advance Approval Panel ──────────────────────────────────────────────
function CashAdvanceApprovalPanel() {
  const {pendingAdvances, loading, refresh, approveAdvance, declineAdvance} =
    usePendingCashAdvances();
  const [decliningAdvance, setDecliningAdvance] =
    useState<PendingCashAdvance | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [flashResult, setFlashResult] = useState<{
    id: string;
    type: "approved" | "declined";
  } | null>(null);

  const handleApprove = async (adv: PendingCashAdvance) => {
    setApprovingId(adv.id);
    const r = await approveAdvance(adv.id);
    if (r.success) {
      setFlashResult({id: adv.id, type: "approved"});
      setTimeout(() => setFlashResult(null), 2000);
    }
    setApprovingId(null);
  };

  const handleDeclineSubmit = async (id: string, reason: string) => {
    const r = await declineAdvance(id, reason);
    if (r.success) {
      setFlashResult({id, type: "declined"});
      setTimeout(() => setFlashResult(null), 2000);
    }
    return r;
  };

  const exceedsLimit = (adv: PendingCashAdvance) =>
    adv.amount > adv.remainingAllowed;

  return (
    <>
      {decliningAdvance && (
        <DeclineReasonModal
          advance={decliningAdvance}
          onClose={() => setDecliningAdvance(null)}
          onDecline={handleDeclineSubmit}
        />
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50">
          <div className="flex items-center gap-2">
            <Banknote size={18} className="text-amber-600" />
            <h3 className="text-base font-bold text-gray-900">
              Cash Advance Requests
            </h3>
            {pendingAdvances.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                {pendingAdvances.length}
              </span>
            )}
          </div>
          <button
            onClick={refresh}
            className="p-1.5 hover:bg-amber-100 rounded-lg">
            <RefreshCw
              size={15}
              className={`text-amber-600 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {!loading && pendingAdvances.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <CheckCircle2 size={32} className="mb-2 text-green-400" />
            <p className="text-sm font-medium text-gray-500">
              No pending cash advance requests
            </p>
          </div>
        )}

        {!loading && pendingAdvances.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "ID / Employee",
                    "Position",
                    "Reason",
                    "Requested",
                    "Allowed Limit",
                    "Remaining",
                    "Requested By",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingAdvances.map((adv) => {
                  const over = exceedsLimit(adv);
                  const isApproving = approvingId === adv.id;
                  const justActed = flashResult?.id === adv.id;
                  return (
                    <tr
                      key={adv.id}
                      className={`transition-colors ${justActed ? (flashResult?.type === "approved" ? "bg-green-50" : "bg-red-50") : over ? "bg-orange-50" : "hover:bg-gray-50"}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-gray-900">
                          {adv.employeeName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {adv.employeeCode}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {adv.employeePosition}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-xs text-gray-600 truncate">
                          {adv.reason || (
                            <span className="italic text-gray-300">
                              No reason
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${over ? "text-orange-600" : "text-gray-900"}`}>
                          {fmt(adv.amount)}
                        </span>
                        {over && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertTriangle
                              size={11}
                              className="text-orange-500"
                            />
                            <span className="text-[10px] text-orange-500 font-semibold">
                              Exceeds limit
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-700">
                          {fmt(adv.allowedLimit)}
                        </span>
                        <p className="text-[10px] text-gray-400">
                          50% of semi-monthly pay
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-sm font-bold ${adv.remainingAllowed <= 0 ? "text-red-600" : "text-green-700"}`}>
                          {fmt(adv.remainingAllowed)}
                        </span>
                        {adv.pendingTotal > 0 && (
                          <p className="text-[10px] text-gray-400">
                            {fmt(adv.pendingTotal)} already pending
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs text-gray-600">
                          {adv.issuedByName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {adv.dateIssued}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {justActed ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${flashResult?.type === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            <CheckCircle2 size={12} />
                            {flashResult?.type === "approved"
                              ? "Approved"
                              : "Declined"}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(adv)}
                              disabled={isApproving}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg">
                              <ThumbsUp size={13} />
                              {isApproving ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => setDecliningAdvance(adv)}
                              disabled={isApproving}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-600 text-xs font-semibold rounded-lg">
                              <ThumbsDown size={13} />
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pendingAdvances.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-6 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-200 inline-block" />
              Exceeds allowed limit
            </span>
            <span>
              Allowed limit = 50% of 13-day semi-monthly gross pay (restraints
              TBA)
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Biometrics Upload Button ─────────────────────────────────────────────────
function BiometricsUploadButton({onSuccess}: {onSuccess: () => void}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
      setErr("Only .xls or .xlsx files accepted.");
      return;
    }

    setUploading(true);
    setErr("");
    setResult(null);
    try {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("attendance_file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/payroll/upload-attendance`,
        {
          method: "POST",
          headers: {Authorization: `Bearer ${session.access_token}`},
          body: formData,
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setResult(json);
      onSuccess();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
        <Upload size={16} className={uploading ? "animate-bounce" : ""} />
        {uploading ? "Importing…" : "Import Biometrics (.xls)"}
      </button>
      {err && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </p>
      )}
      {result && (
        <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 space-y-1">
          <p className="font-bold">
            ✓ Import complete — {result.period?.start} to {result.period?.end}
          </p>
          <p>
            {result.summary?.matched} employees matched ·{" "}
            {result.summary?.syncedToAttendance} synced to payroll
          </p>
          {result.summary?.unmatched > 0 && (
            <p className="text-orange-600 font-semibold">
              ⚠ {result.summary.unmatched} unmatched employee numbers:{" "}
              {result.summary.unmatchedEmployeeNos?.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const AdminPayroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Payroll Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPeriodDrop, setShowPeriodDrop] = useState(false);
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(
    null,
  );
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(
    new Set(),
  );

  const tabs = [
    "Payroll Dashboard",
    "Attendance Logs",
    "Salary Computation",
    "Salary History",
  ];

  const {
    periods,
    currentPeriod,
    activePeriodId,
    setSelectedPeriodId,
    attendanceLogs,
    payrollRecords,
    dashboardStats,
    loading,
    error,
    computing,
    refresh,
    createPeriod,
    updateAttendanceLog,
    computePayroll,
    updatePayrollRecord,
    markPeriodComplete,
    markAllPaid,
  } = usePayrollData();

  const {employees: rawEmployees} = useEmployees();

  const filteredLogs = attendanceLogs.filter(
    (l) =>
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredRecords = payrollRecords.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleExpand = (id: string) => {
    const s = new Set(expandedPeriods);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedPeriods(s);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && periods.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading payroll data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Modals ── */}
      {showCreatePeriod && (
        <CreatePeriodModal
          onClose={() => setShowCreatePeriod(false)}
          onCreate={createPeriod}
        />
      )}
      {editingLog && activePeriodId && (
        <AttendanceEditModal
          log={editingLog}
          periodId={activePeriodId}
          onClose={() => setEditingLog(null)}
          onSave={async (d) => {
            const r = await updateAttendanceLog(d);
            return r;
          }}
        />
      )}
      {viewingRecord && (
        <PayslipModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee payroll, attendance, and salary computations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh">
            <RefreshCw
              size={18}
              className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setShowCreatePeriod(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold shadow-sm">
            <Plus size={16} /> New Period
          </button>
        </div>
      </div>

      {/* ── Period Selector ── */}
      {periods.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            Active Period:
          </span>
          <div className="relative">
            <button
              onClick={() => setShowPeriodDrop((v) => !v)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center gap-2 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-[240px]">
              {currentPeriod ? periodLabel(currentPeriod) : "Select a period"}
              <ChevronDown size={16} className="ml-auto" />
            </button>
            {showPeriodDrop && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-20 overflow-hidden">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPeriodId(p.id);
                      setShowPeriodDrop(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${p.id === activePeriodId ? "bg-cyan-50 font-semibold text-cyan-700" : ""}`}>
                    {periodLabel(p)}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.status === "complete" ? "bg-green-100 text-green-700" : p.status === "processing" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentPeriod && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${currentPeriod.status === "complete" ? "bg-green-100 text-green-700" : currentPeriod.status === "processing" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
              {currentPeriod.status.charAt(0).toUpperCase() +
                currentPeriod.status.slice(1)}
            </span>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {periods.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-4">
            No payroll periods yet
          </p>
          <button
            onClick={() => setShowCreatePeriod(true)}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold">
            Create First Period
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-none bg-gray-100 rounded-xl p-1 w-fit max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: PAYROLL DASHBOARD
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Payroll Dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Employees"
              value={String(dashboardStats.totalEmployees)}
              sub="In this period"
            />
            <StatCard
              label="Gross Payroll"
              value={fmt(dashboardStats.grossPayroll)}
              sub="Current period"
              color="text-blue-600"
            />
            <StatCard
              label="Net Payroll"
              value={fmt(dashboardStats.netPayroll)}
              sub="After deductions"
              color="text-green-600"
            />
            <StatCard
              label="Total Deductions"
              value={fmt(dashboardStats.totalDeductions)}
              sub="Taxes & benefits"
              color="text-red-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payroll Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                Payroll Breakdown
              </h3>
              {payrollRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-3">
                    No payroll computed yet for this period.
                  </p>
                  {attendanceLogs.length > 0 && (
                    <button
                      onClick={() =>
                        activePeriodId && computePayroll(activePeriodId)
                      }
                      disabled={computing}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                      {computing ? "Computing…" : "Compute Payroll"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      label: "Basic Pay",
                      val: payrollRecords.reduce((s, r) => s + r.basicPay, 0),
                    },
                    {
                      label: "OT & Holiday Pay",
                      val: payrollRecords.reduce(
                        (s, r) =>
                          s +
                          r.regularOvertime +
                          r.holidayOvertime +
                          r.specialOvertime,
                        0,
                      ),
                    },
                    {
                      label: "Total Deductions",
                      val: payrollRecords.reduce(
                        (s, r) => s + r.totalDeductions,
                        0,
                      ),
                      isDeduction: true,
                    },
                  ].map(({label, val, isDeduction}) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50">
                      <span className="text-sm font-semibold text-gray-700">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-bold ${isDeduction ? "text-red-600" : "text-gray-900"}`}>
                        {isDeduction ? "-" : ""}
                        {fmt(val)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-green-200 border-2 border-green-300">
                    <span className="text-base font-bold text-green-900">
                      Net Payroll
                    </span>
                    <span className="text-lg font-black text-green-900">
                      {fmt(dashboardStats.netPayroll)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: RefreshCw,
                    color: "text-blue-600",
                    bg: "hover:bg-blue-50 hover:border-blue-300",
                    label: "Compute Payroll",
                    sub: "Auto-calculate salaries from attendance logs",
                    action: () =>
                      activePeriodId && computePayroll(activePeriodId),
                    disabled:
                      !activePeriodId ||
                      computing ||
                      attendanceLogs.length === 0,
                  },
                  {
                    icon: CheckCircle2,
                    color: "text-green-600",
                    bg: "hover:bg-green-50 hover:border-green-300",
                    label: "Mark All as Paid",
                    sub: "Mark all payroll records as disbursed",
                    action: () => activePeriodId && markAllPaid(activePeriodId),
                    disabled: !activePeriodId || payrollRecords.length === 0,
                  },
                  {
                    icon: Calendar,
                    color: "text-purple-600",
                    bg: "hover:bg-purple-50 hover:border-purple-300",
                    label: "Close Period",
                    sub: "Mark this payroll period as complete",
                    action: () =>
                      activePeriodId && markPeriodComplete(activePeriodId),
                    disabled:
                      !activePeriodId || currentPeriod?.status === "complete",
                  },
                ].map(
                  ({icon: Icon, color, bg, label, sub, action, disabled}) => (
                    <button
                      key={label}
                      onClick={action}
                      disabled={disabled}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 ${bg} transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed`}>
                      <Icon size={18} className={color} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* ── Cash Advance Approval Panel ── */}
          <CashAdvanceApprovalPanel />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: ATTENDANCE LOGS
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Attendance Logs" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <BiometricsUploadButton onSuccess={refresh} />
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Printer size={16} /> Print
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Employee",
                      "Position",
                      "Worked Hrs",
                      "Daily Rate",
                      "Late",
                      "Early Leave",
                      "OT (R/H/S)",
                      "Biz Trip",
                      "Absent",
                      "On Leave",
                      "Add. Pay",
                      "Deduction",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="text-center py-12 text-gray-400 text-sm">
                        {attendanceLogs.length === 0
                          ? "No data yet. Import a biometrics .xls file to populate attendance."
                          : "No results match your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {log.fullName}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {log.position}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold">
                            {log.workedHours}
                          </span>
                          <span className="text-xs text-gray-400 block">
                            {log.requiredHours}h req.
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          {fmt(log.dailyRate)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.lateTimeslots}
                          <span className="text-xs text-gray-400 block">
                            ×30m
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.earlyLeaveTimeslots}
                          <span className="text-xs text-gray-400 block">
                            ×30m
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
                          {log.regularOvertimeHours}h /{" "}
                          {log.holidayOvertimeHours}h /{" "}
                          {log.specialOvertimeHours}h
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.businessTripDays}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.absences}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.onLeaveDays}
                        </td>
                        <td className="px-4 py-3 text-center text-green-700 text-xs">
                          {fmt(log.additionalPay)}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 text-xs">
                          {fmt(log.deductionAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setEditingLog(log)}
                            className="p-1.5 hover:bg-cyan-100 rounded-lg"
                            title="Edit">
                            <Edit2 size={16} className="text-cyan-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Work Hours"
              value={String(dashboardStats.totalWorkHours)}
              color="text-blue-600"
            />
            <StatCard
              label="Total OT Hours"
              value={String(dashboardStats.totalOvertimeHours)}
              color="text-green-600"
            />
            <StatCard
              label="Total Absences"
              value={String(dashboardStats.totalAbsences)}
              color="text-red-500"
            />
            <StatCard
              label="Employees Tracked"
              value={String(attendanceLogs.length)}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: SALARY COMPUTATION
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Salary Computation" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search employee…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <button
                onClick={() => activePeriodId && computePayroll(activePeriodId)}
                disabled={
                  computing || attendanceLogs.length === 0 || !activePeriodId
                }
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                <RefreshCw
                  size={16}
                  className={computing ? "animate-spin" : ""}
                />
                {computing ? "Computing…" : "Recompute All"}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Printer size={16} /> Print All
              </button>
            </div>
          </div>

          {payrollRecords.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <AlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium mb-1">
                No payroll computed yet
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Add employees with attendance logs first, then compute.
              </p>
              <button
                onClick={() => activePeriodId && computePayroll(activePeriodId)}
                disabled={computing || attendanceLogs.length === 0}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {computing ? "Computing…" : "Compute Payroll Now"}
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          "Employee",
                          "Position",
                          "Daily Rate",
                          "Days",
                          "Basic Pay",
                          "OT Pay",
                          "Gross",
                          "Deductions",
                          "Net Pay",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {rec.employeeName}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {rec.position}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {fmt(rec.dailyRate)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {rec.daysPresent}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {fmt(rec.basicPay)}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {fmt(
                              rec.regularOvertime +
                                rec.holidayOvertime +
                                rec.specialOvertime,
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-700 text-xs">
                            {fmt(rec.grossIncome)}
                          </td>
                          <td className="px-4 py-3 text-red-600 text-xs">
                            -{fmt(rec.totalDeductions)}
                          </td>
                          <td className="px-4 py-3 font-bold text-green-700 text-xs">
                            {fmt(rec.netPay)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${rec.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {rec.status === "paid" ? "Paid" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingRecord(rec)}
                                className="p-1.5 hover:bg-cyan-100 rounded-lg"
                                title="View payslip">
                                <Eye size={15} className="text-cyan-600" />
                              </button>
                              {rec.status !== "paid" && (
                                <button
                                  onClick={() =>
                                    updatePayrollRecord(rec.id, {
                                      status: "paid",
                                    })
                                  }
                                  className="p-1.5 hover:bg-green-100 rounded-lg"
                                  title="Mark paid">
                                  <CheckCircle2
                                    size={15}
                                    className="text-green-600"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Formula reference */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Computation Formulas
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      VTA Link Printing Services Payroll Register — 15-day
                      period
                    </p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ── EARNINGS ── */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      📊 Earnings
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          step: 1,
                          label: "Daily Rate",
                          formula: "from Employee profile (stored directly)",
                          note: "Set in Management → Employee List → Hourly Rate field",
                          color: "bg-gray-50 border-gray-200",
                        },
                        {
                          step: 2,
                          label: "Days Present",
                          formula: "XLS Attend Actual field",
                          note: 'e.g. "22/16" → 16 days attended',
                          color: "bg-gray-50 border-gray-200",
                        },
                        {
                          step: 3,
                          label: "Basic Pay",
                          formula: "Daily Rate × Days Present",
                          note: "Core salary for the period",
                          color: "bg-blue-50 border-blue-200",
                        },
                        {
                          step: 4,
                          label: "Regular Holiday Pay",
                          formula: "Daily Rate × 2.00",
                          note: "+100% extra on holiday worked",
                          color: "bg-indigo-50 border-indigo-200",
                        },
                        {
                          step: 5,
                          label: "Special Holiday Pay",
                          formula: "Daily Rate × 1.30",
                          note: "+30% extra on special holiday",
                          color: "bg-indigo-50 border-indigo-200",
                        },
                        {
                          step: 6,
                          label: "Regular OT",
                          formula: "(Daily Rate ÷ 8) × 1.25 × OT hours",
                          note: "Source: XLS Overtime Regular column",
                          color: "bg-green-50 border-green-200",
                        },
                        {
                          step: 7,
                          label: "Regular Holiday OT",
                          formula: "(Daily Rate ÷ 8) × 1.60 × OT hours",
                          note: "",
                          color: "bg-green-50 border-green-200",
                        },
                        {
                          step: 8,
                          label: "Special Holiday OT",
                          formula: "(Daily Rate ÷ 8) × 1.30 × OT hours",
                          note: "Source: XLS Overtime Special column",
                          color: "bg-green-50 border-green-200",
                        },
                      ].map(({step, label, formula, note, color}) => (
                        <div
                          key={step}
                          className={`flex gap-3 p-3 rounded-lg border ${color}`}>
                          <div className="w-6 h-6 rounded-full bg-gray-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {step}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800">
                              {label}
                            </p>
                            <p className="text-xs font-mono text-gray-700 mt-0.5">
                              = {formula}
                            </p>
                            {note && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-3 p-3 rounded-lg border-2 border-gray-400 bg-gray-100">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            GROSS INCOME
                          </p>
                          <p className="text-xs font-mono text-gray-700 mt-0.5">
                            = Basic Pay + Holiday Pay + OT Pay + Additional Pay
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── DEDUCTIONS ── */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                      📉 Deductions
                    </p>
                    <div className="space-y-3">
                      {[
                        {
                          step: 9,
                          label: "Tardy / Undertime",
                          formula: "(Daily Rate ÷ 8) × 0.5 × Timeslots",
                          note: "1 timeslot = 30 min late/early. Source: XLS Late Times column",
                          color: "bg-red-50 border-red-200",
                        },
                        {
                          step: 10,
                          label: "PhilHealth",
                          formula: "(Daily Rate × 26) × 3% ÷ 2",
                          note: "Employee share only, rounded to ₱5. e.g. ₱635/day → ₱250",
                          color: "bg-orange-50 border-orange-200",
                        },
                        {
                          step: 11,
                          label: "HDMF (Pag-IBIG)",
                          formula: "₱200.00 fixed per period",
                          note: "Constant deduction every 15 days",
                          color: "bg-orange-50 border-orange-200",
                        },
                        {
                          step: 12,
                          label: "Withholding Tax",
                          formula: "₱0.00 (below threshold)",
                          note: "BIR applies when monthly income > ₱20,833",
                          color: "bg-yellow-50 border-yellow-200",
                        },
                        {
                          step: 13,
                          label: "Cash Advance",
                          formula: "Sum of all Approved advances",
                          note: "Admin approves → deducted NEXT payroll. Limit: TBA",
                          color: "bg-amber-50 border-amber-200",
                        },
                      ].map(({step, label, formula, note, color}) => (
                        <div
                          key={step}
                          className={`flex gap-3 p-3 rounded-lg border ${color}`}>
                          <div className="w-6 h-6 rounded-full bg-gray-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {step}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800">
                              {label}
                            </p>
                            <p className="text-xs font-mono text-gray-700 mt-0.5">
                              = {formula}
                            </p>
                            {note && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-3 p-3 rounded-lg border-2 border-gray-400 bg-gray-100">
                        <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            NET PAY
                          </p>
                          <p className="text-xs font-mono text-gray-700 mt-0.5">
                            = Gross Income − Total Deductions
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            SSS excluded — not in VTA Link payroll format
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data sources */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-[10px] font-bold text-blue-700 mb-2 uppercase tracking-wide">
                        📁 XLS Data Sources (Summary Tab)
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-blue-700">
                        {[
                          ["Work Hrs. Actual", "Worked hours"],
                          ["Attend Actual", "Days present"],
                          ["Late Times / Min", "Tardy timeslots"],
                          ["Overtime Regular", "Regular OT hrs"],
                          ["Overtime Special", "Special OT hrs"],
                          ["Absence", "Absent days"],
                        ].map(([col, desc]) => (
                          <span key={col}>
                            <span className="font-mono bg-blue-100 px-1 rounded">
                              {col}
                            </span>{" "}
                            → {desc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>{" "}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: SALARY HISTORY
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "Salary History" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {periods.length} payroll period{periods.length !== 1 ? "s" : ""}{" "}
              total
            </p>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Printer size={16} /> Print History
            </button>
          </div>

          {periods.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Clock size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No payroll periods found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {periods.map((period) => {
                const isExpanded = expandedPeriods.has(period.id);
                // Get records for this specific period from the currently loaded ones
                // (full history would need a separate query — shown as period summary)
                return (
                  <div
                    key={period.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {periodLabel(period)}
                          </p>
                          {period.payDate && (
                            <p className="text-xs text-gray-500">
                              Pay Date:{" "}
                              {new Date(period.payDate).toLocaleDateString(
                                "en-PH",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Created: {period.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${period.status === "complete" ? "bg-green-100 text-green-700" : period.status === "processing" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                          {period.status.charAt(0).toUpperCase() +
                            period.status.slice(1)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedPeriodId(period.id);
                            setActiveTab("Salary Computation");
                          }}
                          className="p-1.5 hover:bg-cyan-100 rounded-lg"
                          title="View computation">
                          <Eye size={18} className="text-cyan-600" />
                        </button>
                        <button
                          onClick={() => toggleExpand(period.id)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg">
                          {isExpanded ? (
                            <ChevronUp size={18} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded &&
                      period.id === activePeriodId &&
                      payrollRecords.length > 0 && (
                        <div className="p-6">
                          <h4 className="text-sm font-bold text-gray-900 mb-3">
                            Employee Payslips — {periodLabel(period)}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  {[
                                    "Employee",
                                    "Position",
                                    "Gross Income",
                                    "Deductions",
                                    "Net Pay",
                                    "Status",
                                    "Actions",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      className="px-3 py-2 text-left font-semibold text-gray-700">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {payrollRecords.map((rec) => (
                                  <tr key={rec.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">
                                      {rec.employeeName}
                                    </td>
                                    <td className="px-3 py-2 text-gray-500">
                                      {rec.position}
                                    </td>
                                    <td className="px-3 py-2 text-blue-600 font-semibold">
                                      {fmt(rec.grossIncome)}
                                    </td>
                                    <td className="px-3 py-2 text-red-600 font-semibold">
                                      -{fmt(rec.totalDeductions)}
                                    </td>
                                    <td className="px-3 py-2 text-green-600 font-semibold">
                                      {fmt(rec.netPay)}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${rec.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        {rec.status === "paid"
                                          ? "Paid"
                                          : "Pending"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <button
                                        onClick={() => setViewingRecord(rec)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                        title="View payslip">
                                        <Eye
                                          size={14}
                                          className="text-gray-600"
                                        />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    {isExpanded && period.id !== activePeriodId && (
                      <div className="p-6 text-center">
                        <p className="text-sm text-gray-400 mb-3">
                          Switch to this period to view detailed records.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedPeriodId(period.id);
                            setActiveTab("Salary Computation");
                          }}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold">
                          View This Period
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
