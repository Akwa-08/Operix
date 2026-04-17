import { Outlet, useNavigate } from "react-router-dom";
import SharedSideBar, { type SidebarItem } from "./SharedSideBar";
import TopNavBar from "./TopNavBar";
import { useAuth } from "../../../context/AuthContext";
import { SidebarProvider, useSidebar } from "../../../context/SidebarContext";

interface SharedDashboardLayoutProps {
  items: SidebarItem[];
  profilePath: string;
  roleName?: string;
}

const LayoutContent = ({ items, profilePath, roleName }: SharedDashboardLayoutProps) => {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : roleName || "User";

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar userName={displayName} onMenuClick={() => setMobileOpen(!mobileOpen)} />
      
      <div className="flex flex-1">
        <SharedSideBar
          name={displayName}
          role={roleName || user?.role}
          items={items}
          profilePath={profilePath}
          onLogout={handleLogout}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        
        <main
          className={`flex-1 p-4 md:p-6 mt-16 transition-all duration-300 ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-[200px]"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const SharedDashboardLayout = (props: SharedDashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <LayoutContent {...props} />
    </SidebarProvider>
  );
};

export default SharedDashboardLayout;
