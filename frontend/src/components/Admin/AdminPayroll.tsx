import { useState, useRef, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Printer,
  Mail,
  Eye,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { payrollApi } from "../../services/payrollApi";
import type {
  EmployeeAttendanceSummary,
  SalaryComputation,
  PayrollRecord
} from "../../services/payrollApi";

/* --- Original Mock Types ---
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  position: string;
  dailyRate: number;
  daysPresent: number;
  workedHrs: number;
  lateTimeslots: number;
  earlyLeaveTimeslots: number;
  overtimeHrs: number;
  businessTrip: number;
  absence: number;
  onLeave: number;
  additionalPay: number;
  deduction: number;
  actualPay: number;
}

interface SalaryComputation {
  employeeId: string;
  name: string;
  department: string;
  position: string;
  dailyRate: number;
  daysPresent: number;
  basicPay: number;
  regularHolidayPay: number;
  specialHolidayPay: number;
  regularOvertime: number;
  holidayOvertime: number;
  specialOvertime: number;
  grossIncome: number;
  tardyDeductions: number;
  undertimeDeductions: number;
  sss: number;
  philhealth: number;
  hdmf: number;
  withholdingTax: number;
  cashAdvance: number;
  totalDeductions: number;
  netPay: number;
  taxableIncome: number;
  taxRateApplied: string;
}

interface PayrollRecord {
  id: string;
  date: string;
  payDate: string;
  employees: number;
  grossIncome: number;
  deductions: number;
  netPay: number;
  status: "Complete" | "Pending" | "Processing";
}
--- End Mock Types --- */

const AdminPayroll: React.FC = () => {
  const [activePayrollTab, setActivePayrollTab] = useState("Payroll Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedPeriod, setSelectedPeriod] = useState("Current Month");
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<SalaryComputation | null>(null);
  const [editedDailyRate, setEditedDailyRate] = useState("");
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryComputation | null>(null);
  const [expandedPayrollRecords, setExpandedPayrollRecords] = useState<Set<string>>(new Set());

  // --- Live Data States ---
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendanceSummary[]>([]);
  const [salaryComputationData, setSalaryComputationData] = useState<SalaryComputation | null>(null);
  const [allComputations, setAllComputations] = useState<SalaryComputation[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed Date Strings (backend needs YYYY-MM-DD)
  const [periodStart, setPeriodStart] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [periodEnd, setPeriodEnd] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const payrollTabs = [
    "Payroll Dashboard",
    "Attendance Logs",
    "Salary Computation",
    "Salary History",
  ];

  const departments = ["All Departments", "Admin", "Staff", "Design", "Production"];
  const periods = ["Current Month", "Previous Month", "Custom Range"];

  // --- Data Fetching ---
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all needed data for the selected period
      const [attSummary, compDetails, history] = await Promise.all([
        payrollApi.getAttendanceSummary(periodStart, periodEnd),
        payrollApi.computeAllPayroll(periodStart, periodEnd).catch(e => ({ results: [] })), // Allow this to fail initially if not computed
        payrollApi.getSalaryHistory(periodStart, periodEnd)
      ]);

      setAttendanceData(attSummary);
      setAllComputations(compDetails?.results || []);

      // If we have computations, set the first one as selected
      if (compDetails?.results && compDetails.results.length > 0) {
        setSalaryComputationData(compDetails.results[0]);
      } else {
        setSalaryComputationData(null);
      }

      setPayrollHistory(history);
    } catch (err: any) {
      console.error("Error fetching payroll data:", err);
      setError(err.message || "Failed to load payroll data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // When period changes in dropdown
    const now = new Date();
    if (selectedPeriod === "Current Month") {
      setPeriodStart(format(startOfMonth(now), "yyyy-MM-dd"));
      setPeriodEnd(format(endOfMonth(now), "yyyy-MM-dd"));
    } else if (selectedPeriod === "Previous Month") {
      const prev = subDays(startOfMonth(now), 1);
      setPeriodStart(format(startOfMonth(prev), "yyyy-MM-dd"));
      setPeriodEnd(format(endOfMonth(prev), "yyyy-MM-dd"));
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [periodStart, periodEnd]);

  // --- Original Hardcoded Data (Commented Out per request) ---
  /*
  const mockAttendanceData = [ ... ];
  const mockSalaryComputationData = { ... };
  const mockPayrollHistory = [ ... ];
  const dummyPayrollBreakdown = [ ... ];
  const dummyRecentUpdates = [ ... ];
  */

  // --- Computed display values for the Dashboard based on live data
  const totalEmployees = attendanceData.length;
  const totalGrossIncome = allComputations.reduce((sum, c) => sum + (c.earnings?.gross_pay || 0), 0);
  const totalDeductionsAmount = allComputations.reduce((sum, c) => sum + (c.deductions?.total_deductions || 0), 0);
  const totalNetPay = allComputations.reduce((sum, c) => sum + (c.net_salary || 0), 0);

  const payrollBreakdown = [
    { label: "Basic Pay", amount: `₱${allComputations.reduce((s, c) => s + (c.earnings?.basic_pay || 0), 0).toLocaleString()}` },
    { label: "Holiday Pay", amount: `₱${allComputations.reduce((s, c) => s + (c.earnings?.regular_holiday_pay || 0) + (c.earnings?.special_holiday_pay || 0), 0).toLocaleString()}` },
    { label: "Overtime Pay", amount: `₱${allComputations.reduce((s, c) => s + (c.earnings?.overtime_pay || 0), 0).toLocaleString()}` },
    { label: "Bonuses", amount: `₱${allComputations.reduce((s, c) => s + (c.bonus || 0), 0).toLocaleString()}` },
    { label: "Total Deductions", amount: `-₱${totalDeductionsAmount.toLocaleString()}`, isDeduction: true },
  ];

  const recentUpdates = [
    {
      icon: Calendar,
      title: `${attendanceData.length} Attendance Records Loaded`,
      subtitle: `For period ${periodStart} to ${periodEnd}`,
      badge: "Current",
      badgeColor: "bg-blue-100 text-blue-700",
      timestamp: "Just now",
      targetTab: "Attendance Logs",
    },
    {
      icon: CheckCircle2,
      title: `Payroll Computed for ${allComputations.length} Employees`,
      subtitle: "Results ready for review",
      badge: allComputations.length > 0 ? "Ready" : "Pending",
      badgeColor: allComputations.length > 0 ? "bg-green-500 text-white" : "bg-yellow-100 text-yellow-700",
      timestamp: "Recently",
      targetTab: "Salary Computation",
    }
  ];

  // Handler functions
  const handleImportBiometrics = () => {
    console.log("Import biometrics clicked");
    alert("Import Biometrics functionality - ready for backend integration");
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportReports = () => {
    console.log("Export reports clicked");
    alert("Export Reports functionality - ready for backend integration");
  };

  const handleSendEmail = () => {
    console.log("Send email clicked");
    alert("Send to Email functionality - ready for backend integration");
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const handleExportAll = () => {
    console.log("Export all clicked");
    alert("Export All functionality - ready for backend integration");
  };

  const handleExportHistory = () => {
    console.log("Export history clicked");
    alert("Export History functionality - ready for backend integration");
  };

  const handlePrintHistory = () => {
    window.print();
  };

  const handleViewEmployeeInAttendance = (employeeId: string) => {
    console.log("Navigate to Salary Computation for employee:", employeeId);
    setActivePayrollTab("Salary Computation");
    // TODO: Load specific employee data in Salary Computation
  };

  const handleUpdateClick = (targetTab: string) => {
    setActivePayrollTab(targetTab);
  };

  const handleSaveDailyRate = () => {
    console.log("Save daily rate:", editedDailyRate, "for employee:", selectedEmployeeForEdit?.employeeId);
    // TODO: API call to update daily rate
    alert(`Daily rate updated to ₱${editedDailyRate}`);
    setSelectedEmployeeForEdit(null);
  };

  const handleViewPayslip = (employee: Employee) => {
    // Convert Employee to SalaryComputation format for display
    const payslipData: SalaryComputation = {
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      position: employee.position,
      dailyRate: employee.dailyRate,
      daysPresent: employee.daysPresent,
      basicPay: employee.dailyRate * employee.daysPresent,
      regularHolidayPay: 2800,
      specialHolidayPay: 945,
      regularOvertime: 812.5,
      holidayOvertime: 520,
      specialOvertime: 211.25,
      grossIncome: employee.actualPay * 1.3,
      tardyDeductions: 625,
      undertimeDeductions: 81.25,
      sss: 581.3,
      philhealth: 200,
      hdmf: 200,
      withholdingTax: 0,
      cashAdvance: 1300,
      totalDeductions: employee.deduction * 5,
      netPay: employee.actualPay,
      taxableIncome: employee.actualPay * 1.2,
      taxRateApplied: "0%",
    };
    setSelectedPayslip(payslipData);
    setShowPayslipModal(true);
  };

  const handleDownloadPayslip = (employee: Employee) => {
    console.log("Download payslip for:", employee.id);
    // TODO: Generate PDF and download
    alert(`Downloading payslip for ${employee.firstName} ${employee.lastName}`);
  };

  const handlePrintPayslipForEmployee = (employee: Employee) => {
    console.log("Print payslip for:", employee.id);
    // TODO: Open print dialog for specific payslip
    alert(`Printing payslip for ${employee.firstName} ${employee.lastName}`);
  };

  const togglePayrollRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedPayrollRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedPayrollRecords(newExpanded);
  };

  const filteredAttendanceData = attendanceData.filter((item) => {
    const emp = item.employee;
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      // @ts-ignore - Assuming department might be added to employee later, or using a default
      (emp.department || "Staff") === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleComputePayroll = async () => {
    setIsComputing(true);
    setError(null);
    try {
      const response = await payrollApi.computeAllPayroll(periodStart, periodEnd);
      // Refresh the data to show new computations
      await fetchDashboardData();
      alert(`Successfully processed payroll for ${response.processed} employees.`);
    } catch (err: any) {
      console.error("Compute error:", err);
      setError(err.message || "Failed to compute payroll");
      alert("Error computing payroll: " + (err.message || "Unknown error"));
    } finally {
      setIsComputing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading payroll data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-700 font-bold mb-2">Error Loading Data</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Edit Daily Rate Modal */}
      {selectedEmployeeForEdit && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEmployeeForEdit(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedEmployeeForEdit(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Employee Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Employee ID:</span>
                <span className="text-base font-bold text-gray-900">
                  {selectedEmployeeForEdit.employeeId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Name:</span>
                <span className="text-base font-bold text-gray-900">
                  {selectedEmployeeForEdit.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Department:</span>
                <span className="text-base font-bold text-gray-900">
                  {selectedEmployeeForEdit.department}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Position:</span>
                <span className="text-base font-bold text-gray-900">
                  {selectedEmployeeForEdit.position}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Daily Rate:</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">₱</span>
                  <input
                    type="number"
                    value={editedDailyRate}
                    onChange={(e) => setEditedDailyRate(e.target.value)}
                    className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-right font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">Days Present:</span>
                <span className="text-base font-bold text-gray-900">
                  {selectedEmployeeForEdit.daysPresent} days
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setSelectedEmployeeForEdit(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDailyRate}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedPayslip && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowPayslipModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Payslip Preview</h3>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Payslip Content - Receipt Style */}
            <div className="p-8 bg-gray-50" style={{ fontFamily: "Courier New, monospace" }}>
              <div className="bg-white p-8 shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-bold mb-2">
                      VTA LINK PRINTING SERVICES
                    </h2>
                    <div className="text-sm space-y-1">
                      <p className="font-bold">BILLED TO:</p>
                      <p>John Smith</p>
                      <p>Phone No.: 0909-123-4567</p>
                      <p>Cagniog, Surigao, Surigao Del Norte</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold mb-4">30 August 2025</p>
                    <div className="text-sm space-y-1">
                      <p className="font-bold">PAYABLE TO:</p>
                      <p>ABC Bank</p>
                      <p>Account Name: John Smith</p>
                      <p>Account No.: 0909-123-4567</p>
                    </div>
                  </div>
                </div>

                {/* Employee Info and Earnings */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-bold text-sm mb-3">EMPLOYEE INFORMATION</h3>
                    <div className="space-y-1 text-sm">
                      <p>Name: {selectedPayslip.employee_name}</p>
                      <p>Department: {selectedPayslip.department || "Staff"}</p>
                      <p>Position: {selectedPayslip.position}</p>
                      <p>Daily Rate: ₱{selectedPayslip.daily_rate}</p>
                      <p>Days Present: {selectedPayslip.attendance?.days_present || 0} days</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-3">EARNINGS BREAKDOWN</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Pay:</span>
                        <span>₱{selectedPayslip.earnings?.basic_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Regular Holiday Pay:</span>
                        <span>₱{selectedPayslip.earnings?.regular_holiday_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Special Holiday Pay:</span>
                        <span>₱{selectedPayslip.earnings?.special_holiday_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime Pay:</span>
                        <span>₱{selectedPayslip.earnings?.overtime_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>GROSS INCOME:</span>
                        <span>₱{selectedPayslip.earnings?.gross_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions and Pay Summary */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-sm mb-3">DEDUCTIONS BREAKDOWN</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-bold text-xs mb-1">Time-Based deductions</p>
                        <div className="flex justify-between pl-2">
                          <span>Undertime({selectedPayslip.attendance?.undertime_hours || 0}h):</span>
                          <span>₱{selectedPayslip.deductions?.undertime_deduction?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>Tardy Deduction({selectedPayslip.attendance?.tardy_hours || 0}h):</span>
                          <span>₱{selectedPayslip.deductions?.tardy_deduction?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-xs mb-1">Government Contributions:</p>
                        <div className="flex justify-between pl-2">
                          <span>SSS:</span>
                          <span>₱{selectedPayslip.deductions?.sss?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>PhilHealth:</span>
                          <span>₱{selectedPayslip.deductions?.philhealth?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>HDMF:</span>
                          <span>₱{selectedPayslip.deductions?.hdmf?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-xs mb-1">Other Deductions & Taxes</p>
                        <div className="flex justify-between pl-2">
                          <span>Cash Advance:</span>
                          <span>₱{selectedPayslip.deductions?.cash_advance?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>Withholding Tax:</span>
                          <span>₱{selectedPayslip.deductions?.withholding_tax?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>TOTAL DEDUCTIONS:</span>
                        <span>₱{selectedPayslip.deductions?.total_deductions?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-3">PAY SUMMARY</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Gross Income:</span>
                        <span className="text-green-600">
                          ₱{selectedPayslip.earnings?.gross_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Deductions:</span>
                        <span className="text-red-600">
                          -₱{selectedPayslip.deductions?.total_deductions?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus (Tax-Exempt):</span>
                        <span className="text-green-600">
                          +₱{selectedPayslip.bonus?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="bg-green-100 p-3 rounded font-bold flex justify-between mt-2">
                        <span>Net Pay</span>
                        <span className="text-green-700 text-lg">
                          ₱{selectedPayslip.net_salary?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t bg-white">
              <button
                onClick={() => handleDownloadPayslip(selectedPayslip)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                onClick={handlePrintPayslip}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage employee payroll, attendance, and salary computations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {payrollTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActivePayrollTab(tab)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${activePayrollTab === tab
              ? "bg-cyan-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PAYROLL DASHBOARD TAB */}
      {activePayrollTab === "Payroll Dashboard" && (
        <div className="space-y-6">
          {/* Payroll Overview Card with Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payroll Dashboard
              </h2>
              <p className="text-sm text-gray-700 mb-2">
                Used to manage and track employee payroll, attendance, and salary computations. Updated for every payroll period.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Top Buttons and Filters:</strong>
              </p>
              <ul className="text-xs text-gray-500 list-disc ml-5 mt-1">
                <li>Payroll Dashboard – Main overview of payroll metrics</li>
                <li>Attendance Logs – Track attendance records</li>
                <li>Salary Computation – Compute salaries for the period</li>
                <li>Salary History – View past payroll data</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-xs text-gray-400">
                  Current Period: {periodStart} to {periodEnd}
                </p>
                <p className="text-xs text-gray-400">
                  Last Updated: {format(new Date(), 'MMMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={handleExportReports}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                Export Reports
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Total Employees
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalEmployees}</p>
              <p className="text-xs text-gray-400">Active Payroll</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Gross Payroll
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱{totalGrossIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">Current Period</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Net Payroll
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱{totalNetPay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">After deductions</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Total Deductions
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱{totalDeductionsAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-400">Taxes & benefits</p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                Recent Updates
              </h3>
              <div className="space-y-4">
                {recentUpdates.map((update, index) => (
                  <button
                    key={index}
                    onClick={() => handleUpdateClick(update.targetTab)}
                    className="w-full flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded-lg transition-colors text-left"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <update.icon
                        size={20}
                        className="text-gray-600"
                        strokeWidth={2}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">
                        {update.title}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {update.subtitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${update.badgeColor}`}
                        >
                          {update.badge}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {update.timestamp}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                Payroll Breakdown
              </h3>
              <div className="space-y-3">
                {payrollBreakdown.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg ${item.label === "Net Payroll"
                      ? "bg-green-100"
                      : "bg-gray-50"
                      }`}
                  >
                    <span
                      className={`text-sm font-semibold ${item.label === "Net Payroll"
                        ? "text-green-900"
                        : "text-gray-700"
                        }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-sm font-bold ${item.label === "Net Payroll"
                        ? "text-green-900"
                        : item.isDeduction
                          ? "text-red-600"
                          : "text-gray-900"
                        }`}
                    >
                      {item.amount}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-4 rounded-lg bg-green-200 border-2 border-green-300 mt-4">
                  <span className="text-base font-bold text-green-900">
                    Net Payroll
                  </span>
                  <span className="text-lg font-black text-green-900">
                    ₱{totalNetPay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE LOGS TAB */}
      {activePayrollTab === "Attendance Logs" && (
        <div className="space-y-6">
          {/* Header Card with Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Attendance Logs
              </h2>
              <p className="text-sm text-gray-700 mb-2">
                Used to track and manage employee attendance records, updated every 15 days.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Top Buttons and Filters:</strong>
              </p>
              <ul className="text-xs text-gray-500 list-disc ml-5 mt-1">
                <li>Import Biometrics – Upload attendance logs via biometric system</li>
                <li>Search – Search by employee name or ID</li>
                <li>Select Period – Current or Previous</li>
                <li>Departments – Filters which department</li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Table Columns:</strong> First Name | Last Name | Role | Worked hrs. (Actual/Required) | Late (Times/Min) | Early Leave (Times/Min) | Overtime (Regular/Special) | Business Trip | Absence | On Leave | Additional Pay | Deduction | Actual Pay | Actions
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-xs text-gray-400">
                  Date: 2025/06/01 - 06/30
                </p>
                <p className="text-xs text-gray-400">
                  Total Records: 8 employees
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleImportBiometrics}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Upload size={16} />
                  Import Biometrics
                </button>
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Printer size={16} />
                  Print Report
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Department Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDepartmentDropdown(!showDepartmentDropdown);
                    setShowPeriodDropdown(false);
                  }}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center justify-between gap-2 min-w-[180px]"
                >
                  <span>{selectedDepartment}</span>
                  <ChevronDown size={16} />
                </button>
                {showDepartmentDropdown && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                    {departments.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setShowDepartmentDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${selectedDepartment === dept ? "bg-gray-50 font-semibold" : ""
                          }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Period Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPeriodDropdown(!showPeriodDropdown);
                    setShowDepartmentDropdown(false);
                  }}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center justify-between gap-2 min-w-[150px]"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown size={16} />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                    {periods.map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
                          }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Last Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <div>Worked hrs.</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        (Actual/Expected)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <div>Late</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        (Timeslots)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <div>Early Leave</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        (Mins)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <div>Overtime</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        (Hours)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Days Present
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendanceData.map((summary) => (
                    <tr key={summary.employee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {summary.employee.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {summary.employee.employee_code}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {summary.employee.position}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {summary.total_hours.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {summary.late_count} ({summary.total_tardy_minutes}m)
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          -
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {summary.overtime_hours.toFixed(1)}h
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {summary.days_present}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewEmployeeInAttendance(summary.employee_id)}
                          className="p-1.5 hover:bg-cyan-100 rounded-lg transition-colors"
                          title="View in Salary Computation"
                        >
                          <Eye size={18} className="text-cyan-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {attendanceData.reduce((sum, item) => sum + item.total_hours, 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Total Work Hours</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">
                {attendanceData.reduce((sum, item) => sum + item.overtime_hours, 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Total Overtime Hours</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-red-600 mb-2">
                {attendanceData.reduce((sum, item) => sum + item.late_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Late Instances</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {attendanceData.reduce((sum, item) => sum + item.days_present, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Days Present</p>
            </div>
          </div>
        </div>
      )}

      {/* SALARY COMPUTATION TAB */}
      {activePayrollTab === "Salary Computation" && (
        <div className="space-y-6">
          {/* Header Card with Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Salary Computation
              </h2>
              <p className="text-sm text-gray-700 mb-2">
                This tab is used to calculate employee salaries based on configured rules and attendance.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Export Options:</strong>
              </p>
              <ul className="text-xs text-gray-500 list-disc ml-5 mt-1">
                <li>Print Payslip</li>
                <li>Send to Employee Emails</li>
                <li>Export PDF</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-xs text-gray-400">
                  Period: June 1-15, 2025
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleComputePayroll}
                  disabled={isComputing}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 disabled:opacity-50"
                >
                  {isComputing ? (
                    <><Loader2 size={16} className="animate-spin" /> Computing...</>
                  ) : (
                    <><RefreshCw size={16} /> Compute Payroll</>
                  )}
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Mail size={16} />
                  Send to Email
                </button>
                <button
                  onClick={handlePrintPayslip}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Printer size={16} />
                  Print Payslip
                </button>
                <button
                  onClick={handleExportAll}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Download size={16} />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name or department..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center gap-2 min-w-[150px]"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown size={16} />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                    {periods.map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
                          }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Computation Details Grid */}
          {salaryComputationData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <h3 className="text-base font-bold text-gray-900">
                    EMPLOYEE INFORMATION
                  </h3>
                  {/* Optional: Add dropdown to select other employees if multiple were computed */}
                  <div className="relative inline-block text-left">
                    <select
                      className="text-sm border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 py-1 pl-2 pr-6"
                      value={salaryComputationData.employee_id}
                      onChange={(e) => {
                        const selected = allComputations.find(c => c.employee_id === e.target.value);
                        if (selected) setSalaryComputationData(selected);
                      }}
                    >
                      {allComputations.map(comp => (
                        <option key={comp.employee_id} value={comp.employee_id}>
                          {comp.employee_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Employee ID:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {salaryComputationData.employee_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {salaryComputationData.employee_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {salaryComputationData.department || "Staff"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Position:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {salaryComputationData.position}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Rate:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{salaryComputationData.daily_rate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days/Hours Present:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {salaryComputationData.attendance?.days_present || 0} Days / {salaryComputationData.attendance?.total_hours || 0} Hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b">
                  EARNINGS BREAKDOWN
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Basic Pay:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{salaryComputationData.earnings?.basic_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Regular Holiday Pay:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{salaryComputationData.earnings?.regular_holiday_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Special Holiday Pay:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{salaryComputationData.earnings?.special_holiday_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Overtime Pay:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{salaryComputationData.earnings?.overtime_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Bonus / Adjustments:
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      +₱{salaryComputationData.bonus?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-sm font-bold text-gray-900">
                      Gross Income (Excl. Bonus):
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      ₱{salaryComputationData.earnings?.gross_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b">
                  DEDUCTIONS BREAKDOWN
                </h3>
                <div className="space-y-3">
                  <div className="bg-red-50 px-3 py-2 rounded">
                    <p className="text-xs font-semibold text-red-900 mb-2">
                      Time-based Deductions
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Tardy Deduction ({salaryComputationData.attendance?.tardy_hours || 0}h):</span>
                        <span className="text-red-600 font-semibold">
                          ₱{salaryComputationData.deductions?.tardy_deduction?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Undertime ({salaryComputationData.attendance?.undertime_hours || 0}h):</span>
                        <span className="text-red-600 font-semibold">
                          ₱{salaryComputationData.deductions?.undertime_deduction?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 px-3 py-2 rounded">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      Government Contributions
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">SSS:</span>
                        <span className="text-blue-600 font-semibold">
                          ₱{salaryComputationData.deductions?.sss?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">PhilHealth:</span>
                        <span className="text-blue-600 font-semibold">
                          ₱{salaryComputationData.deductions?.philhealth?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">HDMF (Pag-IBIG):</span>
                        <span className="text-blue-600 font-semibold">
                          ₱{salaryComputationData.deductions?.hdmf?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 px-3 py-2 rounded">
                    <p className="text-xs font-semibold text-yellow-900 mb-2">
                      Tax & Other Deductions
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Withholding Tax (Rate: {salaryComputationData.tax_rate_applied || '0%'}):</span>
                        <span className="text-yellow-600 font-semibold">
                          ₱{salaryComputationData.deductions?.withholding_tax?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Cash Advance:</span>
                        <span className="text-yellow-600 font-semibold">
                          ₱{salaryComputationData.deductions?.cash_advance?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-sm font-bold text-gray-900">
                      Total Deductions:
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      -₱{salaryComputationData.deductions?.total_deductions?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pay Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b">
                  PAY SUMMARY
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Gross Income:
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      ₱{salaryComputationData.earnings?.gross_pay?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Total Deductions:
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      -₱{salaryComputationData.deductions?.total_deductions?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Bonus (Tax-Exempt):
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      +₱{salaryComputationData.bonus?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>
                  <div className="bg-green-100 px-4 py-4 rounded-lg flex justify-between items-center mt-2">
                    <span className="text-base font-bold text-green-900">
                      NET PAY:
                    </span>
                    <span className="text-xl font-black text-green-900">
                      ₱{salaryComputationData.net_salary?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Tax Information
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Taxable Income (Gross - Docs):</span>
                      <span className="text-gray-900 font-semibold">
                        ₱{salaryComputationData.taxable_income?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Tax Bracket Applied:</span>
                      <span className="text-gray-900 font-semibold">
                        {salaryComputationData.tax_rate_applied || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Computations Available</h3>
              <p className="text-gray-500 mb-4">Click "Compute Payroll" to process the selected period.</p>
              <button
                onClick={handleComputePayroll}
                disabled={isComputing || attendanceData.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50"
              >
                {isComputing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Process Now
              </button>
            </div>
          )}

          {/* Computation Formulas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              COMPUTATION FORMULAS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Earnings:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Basic Pay = Daily Rate × Days Present</li>
                  <li>Regular Holiday = Daily Rate × 200%</li>
                  <li>Special Holiday = Daily Rate × 130%</li>
                  <li>Regular Overtime = Hourly Rate × 125%</li>
                  <li>Holiday Overtime = Hourly Rate × 130%</li>
                  <li>Special Overtime = Hourly Rate × 195%</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Deductions:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Tardy/Undertime = (Daily Rate ÷ 8) × Hours</li>
                  <li>PhilHealth = ₱200 (Fixed Rate)</li>
                  <li>HDMF = ₱200 (Fixed Rate)</li>
                  <li>SSS = Based on salary bracket</li>
                  <li>Withholding Tax = Based on tax table</li>
                  <li>Cash Advance = Max ₱2,000 per period</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SALARY HISTORY TAB */}
      {activePayrollTab === "Salary History" && (
        <div className="space-y-6">
          {/* Header Card with Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Salary History
              </h2>
              <p className="text-sm text-gray-700 mb-2">
                A searchable archive of previous salary records for all employees.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-xs text-gray-400">
                  Total Periods: 3 | Total Records: 24
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Download size={16} />
                  Export History
                </button>
                <button
                  onClick={handlePrintHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Printer size={16} />
                  Print History
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center gap-2 min-w-[150px]"
                >
                  <span>{selectedPeriod}</span>
                  <ChevronDown size={16} />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute top-full mt-1 right-0 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                    {periods.map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
                          }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">
                ₱{payrollHistory.reduce((sum, r) => sum + (r.total_salary || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">Total Extrapolated Pay</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-red-600 mb-2">
                ₱{payrollHistory.reduce((sum, r) => sum + (r.total_hours || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </p>
              <p className="text-sm text-gray-600">Total Hours Worked</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">
                ₱{payrollHistory.reduce((sum, r) => sum + (r.bonus || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">Total Bonuses</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900 mb-2">{payrollHistory.length}</p>
              <p className="text-sm text-gray-600">Total Computed Records</p>
            </div>
          </div>

          {/* Payroll Records */}
          <div className="space-y-4">
            {payrollHistory.map((record) => {
              const isExpanded = expandedPayrollRecords.has(record.id);

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Period Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-gray-600" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {record.employees?.full_name || record.employee_id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Period: {record.period_start} to {record.period_end}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        {"Processed"}
                      </span>
                      <button
                        onClick={() => togglePayrollRecordExpansion(record.id)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-gray-600" />
                        ) : (
                          <Eye size={18} className="text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                        <p className="text-sm font-bold text-gray-900">
                          {record.total_hours}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Role/Position
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          {record.employees?.position || "Staff"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bonus</p>
                        <p className="text-sm font-bold text-green-600">
                          ₱{(record.bonus || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Net Pay</p>
                        <p className="text-sm font-bold text-green-600">
                          ₱{(record.total_salary || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-3 text-center text-gray-400">
                        Historical detailed breakdown relies on Salary Computations tab.
                      </h4>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
