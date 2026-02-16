import { useState } from "react";

const AdminPayroll: React.FC = () => {
  const [activePayrollTab, setActivePayrollTab] = useState("Payroll Dashboard");

  const payrollTabs = [
    "Payroll Dashboard",
    "Attendance Logs",
    "Salary Computation",
    "Salary History",
  ];

  return (
    <div style={{ padding: "20px" }}>
      {/* Nested Payroll Tabs */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
        {payrollTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActivePayrollTab(tab)}
            style={{
              padding: "8px 16px",
              backgroundColor: activePayrollTab === tab ? "#6366F1" : "#F3F4F6",
              color: activePayrollTab === tab ? "white" : "black",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Payroll Tab Content */}
      <div style={{ border: "1px solid #D1D5DB", padding: "20px", borderRadius: "8px" }}>
        <h2>{activePayrollTab}</h2>
      </div>
    </div>
  );
};

export default AdminPayroll;
