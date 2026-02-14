import { Outlet } from "react-router-dom";
import AdminSideBar from "../components/Admin/AdminSideBar";

export const AdminPage = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <AdminSideBar name="Admin Account" />

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", marginLeft: "16rem" }}>
        <Outlet /> {/* <-- Child routes render here */}
      </main>
    </div>
  );
};
