import { Outlet } from "react-router-dom";
import ProductionSideBar from "../components/Production/ProductionSideBar";
import TopNavBar from "../components/Shared/UI/TopNavBar";

const ProductionPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      
      <div className="flex">
        <ProductionSideBar name="Production User" />
        
        <main className="flex-1 p-6 lg:ml-[160px] mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProductionPage;
