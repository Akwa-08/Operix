import SharedDashboardLayout from "../components/Shared/UI/SharedDashboardLayout";
import { customerSidebarItems } from "../config/sidebarConfigs";

export const RootLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1">
        <SharedSideBar
          name={displayName}
          email={user?.email}
          role="Customer"
          items={customerSidebarItems}
          profilePath="/profile"
          onLogout={() => { signOut(); navigate('/'); }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main
          className={`flex-1 pt-6 px-6 pb-0 mt-16 transition-all duration-300 ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-[180px]"
          }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
