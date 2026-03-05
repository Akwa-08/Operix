import { Outlet } from "react-router-dom";
import CashierSideBar from "../components/Cashier/CashierSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";

const CashierPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      
      <div className="flex">
        <CashierSideBar name="Cashier User" />
        
        <main className="flex-1 p-6 lg:ml-[160px] mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CashierPage;
