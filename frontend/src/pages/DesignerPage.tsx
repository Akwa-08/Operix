//src\pages\DesginerPage.tsx

import { Outlet } from "react-router-dom";
import DesignerSideBar from "../components/Designer/DesignerSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";

const DesignerPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      
      <div className="flex">
        <DesignerSideBar name="Designer User" />
        
        <main className="flex-1 p-6 lg:ml-[160px] mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DesignerPage;
