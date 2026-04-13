// frontend/src/pages/CashierPage.tsx
// REFACTORED: Logout navigates to '/' (unified login on landing page)

import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SharedSideBar from "../components/Shared/UI/SharedSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";
import { cashierSidebarItems } from "../config/sidebarConfigs";
import { useAuth } from '../context/AuthContext';

const CashierPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Cashier';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar userName={displayName} onMenuClick={() => setMobileOpen(o => !o)} />
      <div className="flex flex-1">
        <SharedSideBar
          name={displayName}
          role="Cashier"
          items={cashierSidebarItems}
          profilePath="/cashier/profile"
          onLogout={() => { signOut(); navigate('/'); }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main
          className={`flex-1 p-4 md:p-6 mt-16 lg:pb-6 transition-all duration-300 ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-[200px]"
          }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CashierPage;