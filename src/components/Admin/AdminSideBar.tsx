import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home as HouseIcon,
  PackageCheck as OrderIcon,
  Users as UsersIcon,
  ShoppingCart as InventoryIcon,
  DollarSign as PayrollIcon,
  MessageCircleMore as MessageIcon,
  User as ProfileIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
} from "lucide-react";

type Props = { name: string };

const adminSidebarItems = [
  { label: "Dashboard", icon: HouseIcon, path: "/admin" },
  { label: "Orders", icon: OrderIcon, path: "/admin/orders" },
  { label: "Management", icon: UsersIcon, path: "/admin/users" },
  { label: "Inventory", icon: InventoryIcon, path: "/admin/inventory" },
  { label: "Payroll", icon: PayrollIcon, path: "/admin/payroll" },
  { label: "Messages", icon: MessageIcon, path: "/admin/messages" },
];

const AdminSideBar = ({ name }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (location.pathname === "/") return null;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[160px]";

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // TODO: Add any cleanup logic here (clear tokens, etc.)
    setShowLogoutModal(false);
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Logout
                </h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to log out?
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              You will be redirected to the landing page and will need to log in
              again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-md shadow border border-gray-200"
        aria-label="Open menu"
      >
        <ChevronRight size={20} className="text-gray-600" />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white text-black
          fixed top-16 left-0 h-[calc(100%-4rem)]
          ${sidebarWidth}
          border-r border-gray-200 shadow-sm
          transform transition-all duration-300 ease-in-out
          flex flex-col justify-between
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          z-30
        `}
      >
        {/* Top: Nav */}
        <div className="flex flex-col h-full">
          {/* Nav Links */}
          <nav className="flex flex-col gap-[2px] px-2 pt-3 flex-1">
            {adminSidebarItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/admin"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-lg transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? "bg-pink-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={isActive ? "text-white" : "text-gray-600"}
                    />
                    {!collapsed && (
                      <span
                        className={`text-[11px] font-semibold text-center leading-tight ${
                          isActive ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Section: Profile + Logout */}
          <div className="border-t border-gray-100 px-2 py-3 flex flex-col gap-1">
            {/* Profile Link */}
            <NavLink
              to="/admin/profile"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-lg transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? "bg-pink-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
              title={collapsed ? "Profile" : undefined}
            >
              {({ isActive }) => (
                <>
                  <ProfileIcon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "text-white" : "text-gray-600"}
                  />
                  {!collapsed && (
                    <span
                      className={`text-[11px] font-semibold ${
                        isActive ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Profile
                    </span>
                  )}
                </>
              )}
            </NavLink>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
              className="flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-500 transition-all duration-150 w-full"
            >
              <LogOut size={20} strokeWidth={1.8} />
              {!collapsed && (
                <span className="text-[11px] font-semibold">Logout</span>
              )}
            </button>

            {/* User Info */}
            <div
              className={`flex items-center gap-2 px-2 pt-2 pb-1 mt-1 border-t border-gray-100 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <CircleUserRound
                size={28}
                strokeWidth={1.5}
                className="text-gray-500 flex-shrink-0"
              />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 truncate">
                    {name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Collapse Toggle Button (desktop only) */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className={`
          hidden lg:flex
          fixed top-1/2 -translate-y-1/2 z-40
          transition-all duration-300 ease-in-out
          items-center justify-center
          w-5 h-10 bg-white border border-gray-200 rounded-r-md shadow-sm
          hover:bg-gray-50 text-gray-500 hover:text-pink-500
          ${collapsed ? "left-[72px]" : "left-[160px]"}
        `}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={14} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={14} strokeWidth={2.5} />
        )}
      </button>
    </>
  );
};

export default AdminSideBar;