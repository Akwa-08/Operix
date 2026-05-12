import SharedDashboardLayout from "../components/Shared/UI/SharedDashboardLayout";
import { cashierSidebarItems } from "../config/sidebarConfigs";

const CashierPage = () => {
  return (
    <SharedDashboardLayout 
      items={cashierSidebarItems}
      profilePath="/cashier/profile"
      roleName="Cashier"
    />
  );
};

export default CashierPage;