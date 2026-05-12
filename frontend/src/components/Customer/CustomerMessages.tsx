import React from "react";
import Messages from "../Shared/UI/Messages";

/**
 * Customer-side messages page.
 * Messages.tsx reads the current user via useAuth.
 * Customers can only see their own conversations and can only
 * discover staff/admin users to message.
 */
const CustomerMessages: React.FC = () => {
  return <Messages title="Customer Messages" />;
};

export default CustomerMessages;
