import { Outlet } from "react-router-dom";
import AdminSideBar from "../components/Admin/AdminSideBar";
import TopNavBar from "../components/Shared/TopNavBar";

export const AdminPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <TopNavBar userName="Admin" />

      {/* Main Layout */}
      <div className="flex flex-1 mt-16"> {/* start below navbar */}
        {/* Sidebar */}
        <AdminSideBar name="Admin Account" />

        {/* Main Content */}
        <main className="flex-1 p-10 ml-72 lg:ml-72"> 
          {/* move content more right (ml-72 = 18rem) so it is not behind sidebar */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
