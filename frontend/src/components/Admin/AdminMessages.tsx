import React from "react";
import Messages, {type Conversation} from "../Shared/UI/Messages";

const AdminMessages: React.FC = () => {
  const adminConversations: Conversation[] = [
    {
      id: "conv1",
      userId: "U001",
      userName: "Shane Dawson",
      userRole: "Designer",
      lastMessage: "Thank you for your help with the order!",
      lastMessageTime: "Today 17:26 AM",
      unreadCount: 0,
      isActive: true,
      messages: [
        {
          id: "msg1",
          senderId: "U001",
          senderName: "Shane Dawson",
          content: "Hi! I have a question about my recent order.",
          timestamp: "11:04 pm",
          isFromAdmin: false,
        },
        {
          id: "msg2",
          senderId: "admin",
          senderName: "Admin",
          content:
            "Hello John! I'd be happy to help you with your order. What specific question do you have?",
          timestamp: "11:34 pm",
          isFromAdmin: true,
        },
        {
          id: "msg3",
          senderId: "U001",
          senderName: "Shane Dawson",
          content:
            "The delivery date has changed and I wanted to confirm the new timeline.",
          timestamp: "12:04 pm",
          isFromAdmin: false,
        },
      ],
    },
    {
      id: "conv2",
      userId: "U002",
      userName: "Production Team",
      userRole: "Production",
      lastMessage: "Thank you for your help with the order!",
      lastMessageTime: "Yesterday 02:50 PM",
      unreadCount: 0,
      isActive: true,
      messages: [
        {
          id: "msg4",
          senderId: "U002",
          senderName: "Production Team",
          content: "We need approval for the new batch of materials.",
          timestamp: "Yesterday 02:50 PM",
          isFromAdmin: false,
        },
      ],
    },
  ];

  return (
    <Messages
      initialConversations={adminConversations}
      title="Admin Messages"
      currentUserId="admin"
      currentUserName="Admin"
      isAdmin={true}
    />
  );
};

export default AdminMessages;
