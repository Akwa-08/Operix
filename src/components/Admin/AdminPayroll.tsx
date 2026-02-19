import { useState } from "react";
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
  Edit2,
} from "lucide-react";

// Types for backend integration
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

const AdminPayroll: React.FC = () => {
  const [activePayrollTab, setActivePayrollTab] = useState("Payroll Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedPeriod, setSelectedPeriod] = useState("Current");
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<SalaryComputation | null>(null);
  const [editedDailyRate, setEditedDailyRate] = useState("");
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<SalaryComputation | null>(null);
  const [expandedPayrollRecords, setExpandedPayrollRecords] = useState<Set<string>>(new Set());
  
  const payrollTabs = [
    "Payroll Dashboard",
    "Attendance Logs",
    "Salary Computation",
    "Salary History",
  ];

  const departments = ["All Departments", "Admin", "Staff", "Design", "Production"];
  const periods = ["Current", "Previous"];

  // DUMMY DATA
  const attendanceData: Employee[] = [
    {
      id: "E001",
      firstName: "Cen",
      lastName: "Tino",
      role: "Admin",
      department: "Admin",
      position: "Admin",
      dailyRate: 650,
      daysPresent: 22,
      workedHrs: 159,
      lateTimeslots: 2,
      earlyLeaveTimeslots: 1,
      overtimeHrs: 8,
      businessTrip: 0,
      absence: 1,
      onLeave: 0,
      additionalPay: 1000,
      deduction: 500,
      actualPay: 15750,
    },
    {
      id: "E002",
      firstName: "Mary Jane",
      lastName: "Centino",
      role: "Admin",
      department: "Admin",
      position: "Admin",
      dailyRate: 680,
      daysPresent: 22,
      workedHrs: 162,
      lateTimeslots: 0,
      earlyLeaveTimeslots: 0,
      overtimeHrs: 12,
      businessTrip: 2,
      absence: 0,
      onLeave: 0,
      additionalPay: 1500,
      deduction: 200,
      actualPay: 18300,
    },
    {
      id: "E003",
      firstName: "Cache",
      lastName: "Yir",
      role: "Cashier",
      department: "Staff",
      position: "Cashier",
      dailyRate: 550,
      daysPresent: 22,
      workedHrs: 155,
      lateTimeslots: 3,
      earlyLeaveTimeslots: 2,
      overtimeHrs: 6,
      businessTrip: 0,
      absence: 2,
      onLeave: 1,
      additionalPay: 800,
      deduction: 750,
      actualPay: 14200,
    },
    {
      id: "E004",
      firstName: "Des",
      lastName: "Igner",
      role: "Designer",
      department: "Design",
      position: "Designer",
      dailyRate: 720,
      daysPresent: 22,
      workedHrs: 164,
      lateTimeslots: 1,
      earlyLeaveTimeslots: 0,
      overtimeHrs: 16,
      businessTrip: 1,
      absence: 0,
      onLeave: 0,
      additionalPay: 2000,
      deduction: 300,
      actualPay: 19500,
    },
    {
      id: "E005",
      firstName: "Del",
      lastName: "Sayner",
      role: "Designer",
      department: "Design",
      position: "Designer",
      dailyRate: 700,
      daysPresent: 22,
      workedHrs: 159,
      lateTimeslots: 0,
      earlyLeaveTimeslots: 1,
      overtimeHrs: 10,
      businessTrip: 0,
      absence: 0,
      onLeave: 1,
      additionalPay: 1200,
      deduction: 400,
      actualPay: 16800,
    },
    {
      id: "E006",
      firstName: "John",
      lastName: "Doe",
      role: "Production",
      department: "Production",
      position: "Production",
      dailyRate: 580,
      daysPresent: 22,
      workedHrs: 160,
      lateTimeslots: 2,
      earlyLeaveTimeslots: 0,
      overtimeHrs: 8,
      businessTrip: 0,
      absence: 0,
      onLeave: 0,
      additionalPay: 1000,
      deduction: 250,
      actualPay: 16750,
    },
    {
      id: "E007",
      firstName: "John",
      lastName: "Cena",
      role: "Production",
      department: "Production",
      position: "Production",
      dailyRate: 590,
      daysPresent: 22,
      workedHrs: 161,
      lateTimeslots: 0,
      earlyLeaveTimeslots: 1,
      overtimeHrs: 5,
      businessTrip: 0,
      absence: 1,
      onLeave: 0,
      additionalPay: 600,
      deduction: 500,
      actualPay: 14100,
    },
  ];

  const salaryComputationData: SalaryComputation = {
    employeeId: "MJ001",
    name: "Mary Jane",
    department: "Staff",
    position: "Cashier",
    dailyRate: 650,
    daysPresent: 22,
    basicPay: 14300,
    regularHolidayPay: 2800,
    specialHolidayPay: 945,
    regularOvertime: 812.5,
    holidayOvertime: 520,
    specialOvertime: 211.25,
    grossIncome: 19288.75,
    tardyDeductions: 10625,
    undertimeDeductions: 81.25,
    sss: 581.3,
    philhealth: 200,
    hdmf: 200,
    withholdingTax: 0,
    cashAdvance: 1300,
    totalDeductions: 2663.175,
    netPay: 16625.575,
    taxableIncome: 18247.45,
    taxRateApplied: "0%",
  };

  const payrollHistory: PayrollRecord[] = [
    {
      id: "PR001",
      date: "June 1-15, 2025",
      payDate: "June 16, 2025",
      employees: 8,
      grossIncome: 125450,
      deductions: 26690,
      netPay: 98760,
      status: "Complete",
    },
    {
      id: "PR002",
      date: "May 16-31, 2025",
      payDate: "June 1, 2025",
      employees: 8,
      grossIncome: 118750,
      deductions: 24890,
      netPay: 93860,
      status: "Complete",
    },
    {
      id: "PR003",
      date: "May 1-15, 2025",
      payDate: "May 16, 2025",
      employees: 8,
      grossIncome: 122300,
      deductions: 25680,
      netPay: 96620,
      status: "Complete",
    },
  ];

  const payrollBreakdown = [
    { label: "Basic Pay", amount: "₱89,600" },
    { label: "Holiday Pay", amount: "₱12,450" },
    { label: "Overtime Pay", amount: "₱18,200" },
    { label: "Bonuses", amount: "₱5,200" },
    { label: "Total Deductions", amount: "-₱26,690", isDeduction: true },
  ];

  const recentUpdates = [
    {
      icon: Calendar,
      title: "3 new Attendance Records added",
      subtitle: "Mary Jane, VC, Junny - June 15, 2025",
      badge: "New",
      badgeColor: "bg-green-100 text-green-700",
      timestamp: "2 hours ago",
      targetTab: "Attendance Logs",
    },
    {
      icon: CheckCircle2,
      title: "Payroll Computed for 8 Employees",
      subtitle: "All salary computations completed for current period",
      badge: "Complete",
      badgeColor: "bg-green-500 text-white",
      timestamp: "1 day ago",
      targetTab: "Salary Computation",
    },
    {
      icon: Clock,
      title: "Updated Salary History for June 2025",
      subtitle: "Historical records updated with latest payroll data",
      badge: "Updated",
      badgeColor: "bg-purple-200 text-purple-700",
      timestamp: "1 day ago",
      targetTab: "Salary History",
    },
    {
      icon: AlertCircle,
      title: "2 Overtime Records Pending Review",
      subtitle: "Nathaniel and Des - Special holiday overtime",
      badge: "Pending",
      badgeColor: "bg-yellow-100 text-yellow-700",
      timestamp: "1 day ago",
      targetTab: "Attendance Logs",
    },
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

  const handleEditDailyRate = (employee: SalaryComputation) => {
    setSelectedEmployeeForEdit(employee);
    setEditedDailyRate(employee.dailyRate.toString());
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

  const filteredAttendanceData = attendanceData.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

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
                      <p>Name: {selectedPayslip.name}</p>
                      <p>Department: {selectedPayslip.department}</p>
                      <p>Position: {selectedPayslip.position}</p>
                      <p>Daily Rate: ₱{selectedPayslip.dailyRate}</p>
                      <p>Days Present: {selectedPayslip.daysPresent} days</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-3">EARNINGS BREAKDOWN</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Pay:</span>
                        <span>₱{selectedPayslip.basicPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Regular Holiday Pay:</span>
                        <span>₱{selectedPayslip.regularHolidayPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Special Holiday Pay:</span>
                        <span>₱{selectedPayslip.specialHolidayPay.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Regular OT:</span>
                        <span>₱{selectedPayslip.regularOvertime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Holiday OT:</span>
                        <span>₱{selectedPayslip.holidayOvertime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Special Holiday OT:</span>
                        <span>₱{selectedPayslip.specialOvertime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>GROSS INCOME:</span>
                        <span>₱{selectedPayslip.grossIncome.toLocaleString()}</span>
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
                          <span>Undertime(1h):</span>
                          <span>₱{selectedPayslip.undertimeDeductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>Tardy Deduction(0.5h):</span>
                          <span>₱{selectedPayslip.tardyDeductions.toLocaleString()}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-xs mb-1">Government Contributions:</p>
                        <div className="flex justify-between pl-2">
                          <span>PhilHealth:</span>
                          <span>₱{selectedPayslip.philhealth.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>HDMF:</span>
                          <span>₱{selectedPayslip.hdmf.toLocaleString()}</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-xs mb-1">Other Deductions</p>
                        <div className="flex justify-between pl-2">
                          <span>Cash Advance:</span>
                          <span>₱{selectedPayslip.cashAdvance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>Withholding Tax:</span>
                          <span>₱{selectedPayslip.withholdingTax.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1 mt-1">
                        <span>GROSS INCOME:</span>
                        <span>₱{selectedPayslip.totalDeductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-3">PAY SUMMARY</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Gross Income:</span>
                        <span className="text-green-600">
                          ₱{selectedPayslip.grossIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Deductions:</span>
                        <span className="text-red-600">
                          -₱{selectedPayslip.totalDeductions.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-green-100 p-3 rounded font-bold flex justify-between">
                        <span>Net Pay</span>
                        <span className="text-green-700">
                          ₱{selectedPayslip.netPay.toLocaleString()}
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
                onClick={() => handleDownloadPayslip({ id: selectedPayslip.employeeId } as Employee)}
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
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${
              activePayrollTab === tab
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
          {/* Payroll Overview Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Payroll Overview
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Current Period: June 1-15, 2025
                </p>
                <p className="text-xs text-gray-400">
                  Last Updated: September 5, 2025
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
              <p className="text-3xl font-bold text-gray-900 mb-1">8</p>
              <p className="text-xs text-gray-400">Active Payroll</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Gross Payroll
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱125,450</p>
              <p className="text-xs text-gray-400">Current Period</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Net Payroll
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱98,760</p>
              <p className="text-xs text-gray-400">After deductions</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Total Deductions
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱26,690</p>
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
                    className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                      item.label === "Net Payroll"
                        ? "bg-green-100"
                        : "bg-gray-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        item.label === "Net Payroll"
                          ? "text-green-900"
                          : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        item.label === "Net Payroll"
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
                    ₱98,760
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
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Attendance Summary
                </h2>
                <p className="text-xs text-gray-400 mt-1">
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                          selectedDepartment === dept ? "bg-gray-50 font-semibold" : ""
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                          selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
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
                        (Timeslots)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      <div>Overtime</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        (Regular/Holiday)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Business Trip
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Absence
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      On Leave
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Additional Pay
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Deduction
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Actual Pay
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendanceData.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {employee.firstName}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {employee.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {employee.role}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {employee.workedHrs}
                        </div>
                        <div className="text-[10px] text-gray-500">160h</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {employee.lateTimeslots}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {employee.lateTimeslots > 0 ? "x30m" : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {employee.earlyLeaveTimeslots}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {employee.earlyLeaveTimeslots > 0 ? "x30m" : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-900">
                          {employee.overtimeHrs}h
                        </div>
                        <div className="text-[10px] text-gray-500">8h / 0h</div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {employee.businessTrip}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {employee.absence}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {employee.onLeave}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        ₱{employee.additionalPay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900">
                        {employee.deduction}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        ₱{employee.actualPay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewEmployeeInAttendance(employee.id)}
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
              <p className="text-3xl font-bold text-blue-600 mb-2">1276</p>
              <p className="text-sm text-gray-600">Total Work Hours</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">108</p>
              <p className="text-sm text-gray-600">Total Overtime Hours</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-red-600 mb-2">4</p>
              <p className="text-sm text-gray-600">Total Absences</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900 mb-2">
                ₱132,650
              </p>
              <p className="text-sm text-gray-600">Total Actual Pay</p>
            </div>
          </div>
        </div>
      )}

      {/* SALARY COMPUTATION TAB */}
      {activePayrollTab === "Salary Computation" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Salary Computation
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Detailed payslip computation for payroll period
                </p>
                <p className="text-xs text-gray-400">
                  Period: June 1-15, 2025
                </p>
              </div>
              <div className="flex gap-2">
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
                  Export All
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                          selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h3 className="text-base font-bold text-gray-900">
                  EMPLOYEE INFORMATION
                </h3>
                <button
                  onClick={() => handleEditDailyRate(salaryComputationData)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Daily Rate"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Employee ID:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {salaryComputationData.employeeId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {salaryComputationData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Department:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {salaryComputationData.department}
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
                    ₱{salaryComputationData.dailyRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days Present:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {salaryComputationData.daysPresent} Days
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
                    ₱{salaryComputationData.basicPay.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Regular Holiday Pay:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{salaryComputationData.regularHolidayPay.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Special Holiday Pay:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{salaryComputationData.specialHolidayPay.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Regular Overtime:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{salaryComputationData.regularOvertime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Holiday Overtime:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{salaryComputationData.holidayOvertime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Special Overtime:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{salaryComputationData.specialOvertime.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-sm font-bold text-gray-900">
                    Gross Income:
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ₱{salaryComputationData.grossIncome.toLocaleString()}
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
                      <span className="text-gray-600">Tardy to Work (1h):</span>
                      <span className="text-red-600 font-semibold">
                        ₱{salaryComputationData.tardyDeductions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Under time (1h):</span>
                      <span className="text-red-600 font-semibold">
                        ₱
                        {salaryComputationData.undertimeDeductions.toLocaleString()}
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
                        ₱{salaryComputationData.sss.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">PhilHealth:</span>
                      <span className="text-blue-600 font-semibold">
                        ₱{salaryComputationData.philhealth.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">HDMF (Pag-IBIG):</span>
                      <span className="text-blue-600 font-semibold">
                        ₱{salaryComputationData.hdmf.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 px-3 py-2 rounded">
                  <p className="text-xs font-semibold text-yellow-900 mb-2">
                    Other Deductions
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Withholding Tax:</span>
                      <span className="text-yellow-600 font-semibold">₱0</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Cash Advance:</span>
                      <span className="text-yellow-600 font-semibold">
                        ₱{salaryComputationData.cashAdvance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t">
                  <span className="text-sm font-bold text-gray-900">
                    Total Deductions:
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    -₱{salaryComputationData.totalDeductions.toLocaleString()}
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
                    ₱{salaryComputationData.grossIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    Total Deductions:
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    -₱{salaryComputationData.totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="bg-green-100 px-4 py-4 rounded-lg flex justify-between items-center">
                  <span className="text-base font-bold text-green-900">
                    NET PAY:
                  </span>
                  <span className="text-xl font-black text-green-900">
                    ₱{salaryComputationData.netPay.toLocaleString()}
                  </span>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Tax Information
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Taxable Income:</span>
                    <span className="text-gray-900 font-semibold">
                      ₱{salaryComputationData.taxableIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tax Rate Applied:</span>
                    <span className="text-gray-900 font-semibold">
                      {salaryComputationData.taxRateApplied}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Salary History
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Historical payroll records and employee payslips
                </p>
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                          selectedPeriod === period ? "bg-gray-50 font-semibold" : ""
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
              <p className="text-3xl font-bold text-blue-600 mb-2">₱386,500</p>
              <p className="text-sm text-gray-600">Total Gross Income</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-red-600 mb-2">₱77,260</p>
              <p className="text-sm text-gray-600">Total Deductions</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">₱280,240</p>
              <p className="text-sm text-gray-600">Total Net Pay</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-gray-900 mb-2">24</p>
              <p className="text-sm text-gray-600">Total Employee Records</p>
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
                          {record.date}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pay Date: {record.payDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        {record.status}
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
                        <p className="text-xs text-gray-500 mb-1">Employees</p>
                        <p className="text-sm font-bold text-gray-900">
                          {record.employees}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Gross Income
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          ₱{record.grossIncome.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Deductions</p>
                        <p className="text-sm font-bold text-red-600">
                          ₱{record.deductions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Net Pay</p>
                        <p className="text-sm font-bold text-green-600">
                          ₱{record.netPay.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Employee Payslips Table - Only show when expanded */}
                  {isExpanded && (
                    <div className="p-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">
                        Individual Employee Payslips
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                EMPLOYEE
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                DEPARTMENT
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                GROSS INCOME
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                DEDUCTIONS
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                NET PAY
                              </th>
                              <th className="px-3 py-2 text-center font-semibold text-gray-700">
                                STATUS
                              </th>
                              <th className="px-3 py-2 text-center font-semibold text-gray-700">
                                ACTIONS
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {attendanceData.slice(0, 6).map((employee) => (
                              <tr key={employee.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-900">
                                  {employee.firstName} {employee.lastName}
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {employee.department}
                                </td>
                                <td className="px-3 py-2 text-right text-blue-600 font-semibold">
                                  ₱{(employee.actualPay * 1.3).toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right text-red-600 font-semibold">
                                  ₱{(employee.deduction * 5).toFixed(0)}
                                </td>
                                <td className="px-3 py-2 text-right text-green-600 font-semibold">
                                  ₱{employee.actualPay.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                                    Paid
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleViewPayslip(employee)}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                                      title="View Payslip"
                                    >
                                      <Eye size={14} className="text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDownloadPayslip(employee)}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                                      title="Download PDF"
                                    >
                                      <Download
                                        size={14}
                                        className="text-gray-600"
                                      />
                                    </button>
                                    <button
                                      onClick={() => handlePrintPayslipForEmployee(employee)}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                                      title="Print"
                                    >
                                      <Printer
                                        size={14}
                                        className="text-gray-600"
                                      />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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