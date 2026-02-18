import React, { useState } from "react";
import { Bell } from "lucide-react";

type NavbarProps = {
  userName?: string;
};

const TopNavBar: React.FC<NavbarProps> = ({ userName }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications] = useState(false);

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
              className="relative"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {hasNotifications && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b font-semibold">Notifications</div>
                <div className="p-4 text-gray-500">
                  You have no new notifications.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNavBar;
