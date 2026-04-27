import React from "react";
import Messages from "../Shared/UI/Messages";

/**
 * Admin-side messages page.
 * Messages.tsx reads the current user via useAuth and handles all logic.
 * Admins can see all users in the discovery panel and message anyone.
 */
const AdminMessages: React.FC = () => {
  return <Messages title="Admin Messages" />;
};

export default AdminMessages;
