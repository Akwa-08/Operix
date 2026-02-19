import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type NavbarProps = {
  userName?: string;
};

// Types for backend integration
interface Notification {
  id: string;
  type: "message" | "order" | "payment" | "system";
  title: string;
  timestamp: string;
  isRead: boolean;
  conversationId?: string; // For message notifications
  userId?: string; // For message notifications
}

const TopNavBar: React.FC<NavbarProps> = ({ userName }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Dummy notifications - ready for backend integration
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "notif1",
      type: "order",
      title: "ORD-002 is in Production",
      timestamp: "15 mins ago",
      isRead: false,
    },
    {
      id: "notif2",
      type: "order",
      title: "ORD-003 is ready for pickup",
      timestamp: "1 hr ago",
      isRead: false,
    },
    {
      id: "notif3",
      type: "order",
      title: "ORD-001 is in design",
      timestamp: "1hr ago",
      isRead: false,
    },
    {
      id: "notif4",
      type: "payment",
      title: "Your payment for ORD-001 has been conf...",
      timestamp: "1 hr ago",
      isRead: false,
    },
    {
      id: "notif5",
      type: "message",
      title: "New message from Shane Dawson",
      timestamp: "2 hrs ago",
      isRead: false,
      conversationId: "conv1",
      userId: "U001",
    },
    {
      id: "notif6",
      type: "message",
      title: "New message from Production Team",
      timestamp: "5 hrs ago",
      isRead: false,
      conversationId: "conv2",
      userId: "U002",
    },
  ]);

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasNotifications = unreadCount > 0;

  const displayedNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    // TODO: API call to mark as read
    console.log("Marked as read:", notificationId);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notification.id ? { ...notif, isRead: true } : notif
      )
    );

    // Close notifications dropdown
    setShowNotifications(false);

    // Navigate based on notification type
    if (notification.type === "message" && notification.conversationId) {
      // Navigate to messages and select the conversation
      navigate("/admin/messages", {
        state: {
          conversationId: notification.conversationId,
          userId: notification.userId,
        },
      });
    } else if (notification.type === "order") {
      // Navigate to orders
      navigate("/admin/orders");
    } else if (notification.type === "payment") {
      // Navigate to relevant page
      navigate("/admin/orders");
    }

    // TODO: API call to mark as read
    console.log("Notification clicked:", notification);
  };

  return (
    <>
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white shadow-sm flex items-center px-10 justify-between z-50">
        <div className="text-xl font-bold">OPERIX</div>

        <div className="flex items-center gap-4 relative">
          {userName && <div className="font-medium">{userName}</div>}

          {/* Bell Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {showNotifications && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                {/* Notifications Dropdown */}
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-gray-600" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200">
                      <button
                        onClick={() => setActiveTab("all")}
                        className={`pb-2 px-1 text-sm font-semibold transition-colors relative ${
                          activeTab === "all"
                            ? "text-cyan-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        All
                        {activeTab === "all" && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600" />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("unread")}
                        className={`pb-2 px-1 text-sm font-semibold transition-colors relative ${
                          activeTab === "unread"
                            ? "text-cyan-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Unread
                        {activeTab === "unread" && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {displayedNotifications.length > 0 ? (
                      displayedNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.isRead ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              {notification.type === "message" && (
                                <span className="text-gray-600">💬</span>
                              )}
                              {notification.type === "order" && (
                                <span className="text-gray-600">📦</span>
                              )}
                              {notification.type === "payment" && (
                                <span className="text-gray-600">💰</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm mb-1 ${
                                  !notification.isRead
                                    ? "font-semibold text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {notification.timestamp}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={(e) =>
                                  handleMarkAsRead(notification.id, e)
                                }
                                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold hover:underline"
                              >
                                Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No notifications</p>
                      </div>
                    )}
                  </div>

                  {/* Footer - Optional: Mark all as read */}
                  {hasNotifications && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((notif) => ({ ...notif, isRead: true }))
                          );
                        }}
                        className="w-full text-sm text-cyan-600 hover:text-cyan-700 font-semibold"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNavBar;