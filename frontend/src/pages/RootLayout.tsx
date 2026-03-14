import {useState} from "react";
import {Outlet, useNavigate} from "react-router-dom";
import SharedSideBar from "../components/Shared/UI/SharedSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";
import {customerSidebarItems} from "../config/sidebarConfigs";
import { useAuth } from '../context/AuthContext';

export const RootLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Guest';



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1">
        <SharedSideBar
          name={displayName}
          items={customerSidebarItems}
          profilePath="/profile"
          onLogout={() => { signOut(); navigate('/'); }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <main
          className={`flex-1 pt-6 px-6 pb-0 mt-16 transition-all duration-300 ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-[160px]"
          }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
