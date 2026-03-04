import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home as HouseIcon,
  PackageCheck as OrderIcon,
  ShoppingCart as InventoryIcon,
  User as ProfileIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
} from "lucide-react";

type Props = { name: string };

const productionSidebarItems = [
  { label: "Dashboard", icon: HouseIcon, path: "/production" },
  { label: "Orders", icon: OrderIcon, path: "/production/orders" },
  { label: "Inventory", icon: InventoryIcon, path: "/production/inventory" },
];

const ProductionSideBar = ({ name }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (location.pathname === "/") return null;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[160px]";

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate("/");
  };
  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
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

            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"
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
      >
        <ChevronRight size={20} className="text-gray-600" />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white fixed top-16 left-0 h-[calc(100%-4rem)] 
        ${sidebarWidth}
        shadow-sm
        transform transition-all duration-300
        flex flex-col justify-between
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        z-30`}
      >
        <div className="flex flex-col h-full">
          {/* NAV LINKS */}
          <nav className="flex flex-col gap-[2px] px-2 pt-3 flex-1">
            {productionSidebarItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/production"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-lg transition-all duration-150
                  ${
                    isActive
                      ? "bg-[#E80088] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
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
                        className={`text-[11px] font-semibold ${
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

          {/* BOTTOM SECTION */}
          <div className="px-2 py-3 flex flex-col gap-1">
            {/* Profile */}
            <NavLink
              to="/production/profile"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-lg transition-all duration-150
                ${
                  isActive
                    ? "bg-[#E80088] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-500 transition-all duration-150 w-full"
            >
              <LogOut size={20} strokeWidth={1.8} />
              {!collapsed && (
                <span className="text-[11px] font-semibold">Logout</span>
              )}
            </button>

            {/* User Info */}
            <div
              className={`flex items-center gap-2 px-2 pt-3 ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <CircleUserRound
                size={28}
                strokeWidth={1.5}
                className="text-gray-500 flex-shrink-0"
              />
              {!collapsed && (
                <div>
                  <p className="text-[11px] font-bold text-gray-800 truncate">
                    {name}
                  </p>
                  <p className="text-[9px] text-gray-500">Production</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-40
        items-center justify-center
        w-5 h-10 bg-white border border-gray-200 rounded-r-md shadow-sm
        hover:bg-gray-50 text-gray-500 hover:text-[#E80088]
        ${collapsed ? "left-[72px]" : "left-[160px]"}`}
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

export default ProductionSideBar;
