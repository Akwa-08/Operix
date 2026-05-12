import SharedDashboardLayout from "../components/Shared/UI/SharedDashboardLayout";
import { adminSidebarItems } from "../config/sidebarConfigs";

const AdminPage = () => {
  return (
    <SharedDashboardLayout 
      items={adminSidebarItems}
      profilePath="/admin/profile"
      roleName="Admin"
    />
  );
};

export default AdminPage;