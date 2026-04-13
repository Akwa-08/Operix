import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight, CircleUserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  end?: boolean;
};

export type SharedSideBarProps = {
  name: string;
  role?: string;
  items: SidebarItem[];
  profilePath: string;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const SharedSideBar = ({
  name,
  role,
  items,
  profilePath,
  onLogout,
  collapsed,
  setCollapsed,
}: SharedSideBarProps) => {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (location.pathname === "/") return null;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[200px]";

  const confirmLogout = () => { setShowLogoutModal(false); onLogout(); };

  // All nav items including profile for bottom bar
  const allNavItems = [
    ...items,
    { label: "Profile", icon: CircleUserRound, path: profilePath, end: false },
  ];

  // Active link style factory
  const linkClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all duration-150 cursor-pointer ${
      isActive ? "bg-[#E80088] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <>
      {/* ══ LOGOUT MODAL ══════════════════════════════════════════════════════ */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-500">Are you sure you want to log out?</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              You will be redirected to the landing page and will need to log in again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-base">
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-base">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DESKTOP SIDEBAR (hidden on mobile) ════════════════════════════════ */}
      <aside
        className={`
          hidden lg:flex flex-col justify-between
          bg-white text-black
          fixed top-16 left-0 h-[calc(100vh-4rem)]
          ${sidebarWidth}
          border-r border-gray-200 shadow-sm
          ${isMounted ? "transition-all duration-300 ease-in-out" : ""}
          z-30
        `}>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-2 pt-4 flex-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              className={({ isActive }) => linkClass(isActive)}
              title={collapsed ? item.label : undefined}>
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "text-white" : "text-gray-600"}
                  />
                  {!collapsed && (
                    <span className={`text-sm font-bold text-center leading-tight ${isActive ? "text-white" : "text-gray-700"}`}>
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: profile + logout + user info */}
        <div className="border-t border-gray-100 px-2 py-3 flex flex-col gap-1">
          <NavLink
            to={profilePath}
            className={({ isActive }) => linkClass(isActive)}
            title={collapsed ? "Profile" : undefined}>
            {({ isActive }) => (
              <>
                <CircleUserRound size={22} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? "text-white" : "text-gray-600"} />
                {!collapsed && (
                  <span className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-700"}`}>Profile</span>
                )}
              </>
            )}
          </NavLink>

          <button
            onClick={() => setShowLogoutModal(true)}
            title={collapsed ? "Logout" : undefined}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-500 transition-all duration-150 w-full">
            <LogOut size={22} strokeWidth={1.8} />
            {!collapsed && <span className="text-sm font-bold">Logout</span>}
          </button>

          {/* User chip */}
          <div className={`flex items-center gap-2 px-2 pt-2 pb-1 mt-1 border-t border-gray-100 ${collapsed ? "justify-center" : ""}`}>
            <CircleUserRound size={28} strokeWidth={1.5} className="text-gray-400 flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{name}</p>
                {role && <p className="text-xs text-gray-500 truncate">{role}</p>}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`
          hidden lg:flex
          fixed top-1/2 -translate-y-1/2 z-40
          items-center justify-center
          w-5 h-10 bg-white border border-gray-200 rounded-r-md shadow-sm
          hover:bg-gray-50 text-gray-500 hover:text-[#E80088]
          ${isMounted ? "transition-all duration-300 ease-in-out" : ""}
          ${collapsed ? "left-[72px]" : "left-[200px]"}
        `}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
      </button>

      {/* ══ MOBILE BOTTOM NAV BAR (hidden on desktop) ═════════════════════════
          Shows all nav items + logout in a fixed bottom bar.
          Large tap targets (min 60px height) for elderly-friendly use.
      ════════════════════════════════════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch justify-around">
          {allNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[60px] transition-colors ${
                  isActive ? "text-[#E80088]" : "text-gray-500 hover:text-gray-800"
                }`
              }>
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
                  {isActive && <span className="absolute bottom-0 w-8 h-0.5 bg-[#E80088] rounded-t-full" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Logout in bottom nav */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[60px] text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={22} strokeWidth={1.8} />
            <span className="text-[11px] font-semibold leading-tight">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default SharedSideBar;
