import React, { useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

type NavbarProps = {
  userName?: string;
};

const TopNavBar: React.FC<NavbarProps> = ({ userName }) => {
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNotifications] = useState(false); // no notifications for now
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutPopup(false);
    navigate("/"); // redirect to landing page
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

          {/* Logout Button */}
          <button onClick={() => setShowLogoutPopup(true)}>
            <LogOut className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      //Logout popup
      
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavBar;
