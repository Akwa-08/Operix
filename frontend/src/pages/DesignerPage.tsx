import {useState} from "react";
import {Outlet, useNavigate} from "react-router-dom";
import SharedSideBar from "../components/Shared/UI/SharedSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";
import {designerSidebarItems} from "../config/sidebarConfigs";

const DesignerPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar />

      <div className="flex flex-1">
        <SharedSideBar
          name="Designer User"
          role="Designer"
          items={designerSidebarItems}
          profilePath="/designer/profile"
          onLogout={() => navigate("/")}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

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

export default DesignerPage;
