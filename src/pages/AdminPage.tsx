import { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import AdminSideBar from "../components/Admin/AdminSideBar";
import TopNavBar from "../components/Shared/TopNavBar";

// Context to share sidebar state
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

export const AdminPage = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Top Navbar */}
        <TopNavBar userName="Admin" />

        {/* Main Layout */}
        <div className="flex flex-1 mt-16">
          {/* Sidebar - pass collapse state */}
          <AdminSideBar name="Admin Account" />

          {/* Main Content - adjusts based on sidebar state */}
          <main
            className={`
              flex-1 p-6 lg:p-8
              transition-all duration-300 ease-in-out
              ${collapsed ? "lg:ml-[72px]" : "lg:ml-[160px]"}
            `}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};