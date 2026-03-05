import { createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import AdminSideBar from "../components/Admin/AdminSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar"; // ✅ FIXED: Added /UI/

const SidebarContext = createContext<{ collapsed: boolean } | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

const AdminPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <TopNavBar />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <AdminSideBar name="Admin User" />

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:ml-[160px] mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
