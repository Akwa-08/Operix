import SharedDashboardLayout from "../components/Shared/UI/SharedDashboardLayout";
import { productionSidebarItems } from "../config/sidebarConfigs";

const ProductionPage = () => {
  return (
    <SharedDashboardLayout 
      items={productionSidebarItems}
      profilePath="/production/profile"
      roleName="Production"
    />
  );
};

export default ProductionPage;