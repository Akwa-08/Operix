import {useState} from "react";
import {Outlet, useNavigate} from "react-router-dom";
import SharedSideBar from "../components/Shared/UI/SharedSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";
import {cashierSidebarItems} from "../config/sidebarConfigs";

const CashierPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <TopNavBar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <SharedSideBar
          name="Cashier User"
          role="Cashier"
          items={cashierSidebarItems}
          profilePath="/cashier/profile"
          onLogout={() => navigate("/")}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 p-6 mt-16 transition-all duration-300 ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-[160px]"
          }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CashierPage;
