import { useAuth } from "../../context/AuthContext";
import Messages from "../Shared/UI/Messages";

/**
 * Admin-side messages page.
 * Messages.tsx reads the current user via useAuth and handles all logic.
 * Admins can see all users in the discovery panel and message anyone.
 */
const AdminMessages: React.FC = () => {
  const { user } = useAuth();
  const roleName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Staff";
  
  return <Messages title={`${roleName} Messages`} />;
};

export default AdminMessages;
