import SharedDashboardLayout from "../components/Shared/UI/SharedDashboardLayout";
import { customerSidebarItems } from "../config/sidebarConfigs";

export const RootLayout = () => {
  return (
    <SharedDashboardLayout 
      items={customerSidebarItems}
      profilePath="/profile"
      roleName="Customer"
    />
  );
};
