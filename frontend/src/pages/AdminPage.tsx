import {useState, createContext, useContext} from "react";
import {Outlet, useNavigate} from "react-router-dom";
import SharedSideBar from "../components/Shared/UI/SharedSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar"; // ✅ FIXED: Added /UI/
import {adminSidebarItems} from "../config/sidebarConfigs";
import { useAuth } from '../context/AuthContext';

const SidebarContext = createContext<{collapsed: boolean} | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

const AdminPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Admin';



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <TopNavBar />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <SharedSideBar
          name={displayName}
          items={adminSidebarItems}
          profilePath="/admin/profile"
          onLogout={() => { signOut(); navigate('/staff-login'); }}
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

export default AdminPage;
