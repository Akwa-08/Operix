import SharedDashboardLayout from "../components/Shared/UI/SharedDashboardLayout";
import { designerSidebarItems } from "../config/sidebarConfigs";

const DesignerPage = () => {
  return (
    <SharedDashboardLayout 
      items={designerSidebarItems}
      profilePath="/designer/profile"
      roleName="Designer"
    />
  );
};

export default DesignerPage;