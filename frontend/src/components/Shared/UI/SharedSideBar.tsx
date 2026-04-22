import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight, CircleUserRound, X } from "lucide-react";
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
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
};

const SharedSideBar = ({
  name,
  role,
  items,
  profilePath,
  onLogout,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}: SharedSideBarProps) => {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen?.(false);
  }, [location.pathname]);

  if (location.pathname === "/") return null;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[200px]";
  const confirmLogout = () => { setShowLogoutModal(false); onLogout(); };

  const linkClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl transition-all duration-150 cursor-pointer ${
      isActive ? "bg-[#E80088] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
    }`;

  const drawerLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer ${
      isActive ? "bg-[#E80088] text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
    }`;

  // ── Shared nav content (used by both desktop sidebar and mobile drawer) ──
  const NavItems = ({ drawer = false }: { drawer?: boolean }) => (
    <>
      {items.map(item => (
        <NavLink
          key={item.label}
          to={item.path}
          end={item.end}
          className={({ isActive }) => drawer ? drawerLinkClass(isActive) : linkClass(isActive)}
          title={!drawer && collapsed ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              <item.icon
                size={drawer ? 20 : 22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={drawer ? "" : isActive ? "text-white" : "text-gray-600"}
              />
              {drawer ? (
                <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-700"}`}>{item.label}</span>
              ) : !collapsed ? (
                <span className={`text-sm font-bold text-center leading-tight ${isActive ? "text-white" : "text-gray-700"}`}>{item.label}</span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      {/* ─── LOGOUT MODAL ─────────────────────────────────────────────────── */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-500">Are you sure you want to log out?</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">You will be redirected to the landing page.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={confirmLogout}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside className={`
        hidden lg:flex flex-col justify-between
        bg-white text-black
        fixed top-16 left-0 h-[calc(100vh-4rem)]
        ${sidebarWidth}
        border-r border-gray-200 shadow-sm
        ${isMounted ? "transition-all duration-300 ease-in-out" : ""}
        z-30
      `}>
        <nav className="flex flex-col gap-1 px-2 pt-4 flex-1 overflow-y-auto">
          <NavItems />
        </nav>

        <div className="border-t border-gray-100 px-2 py-3 flex flex-col gap-1">
          <NavLink to={profilePath}
            className={({ isActive }) => linkClass(isActive)}
            title={collapsed ? "Profile" : undefined}>
            {({ isActive }) => (
              <>
                <CircleUserRound size={22} strokeWidth={isActive ? 2.5 : 1.8} className={isActive ? "text-white" : "text-gray-600"} />
                {!collapsed && <span className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-700"}`}>Profile</span>}
              </>
            )}
          </NavLink>

          <button onClick={() => setShowLogoutModal(true)} title={collapsed ? "Logout" : undefined}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-500 transition-all w-full">
            <LogOut size={22} strokeWidth={1.8} />
            {!collapsed && <span className="text-sm font-bold">Logout</span>}
          </button>

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

      {/* ─── MOBILE DRAWER ───────────────────────────────────────────────── */}
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E80088]/10 flex items-center justify-center">
              <CircleUserRound size={20} className="text-[#E80088]" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{name}</p>
              {role && <p className="text-xs text-gray-500">{role}</p>}
            </div>
          </div>
          <button onClick={() => setMobileOpen?.(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <NavItems drawer />
          <NavLink to={profilePath}
            className={({ isActive }) => drawerLinkClass(isActive)}>
            {({ isActive }) => (
              <>
                <CircleUserRound size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-700"}`}>Profile</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-gray-100 p-3">
          <button onClick={() => { setShowLogoutModal(true); setMobileOpen?.(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default SharedSideBar;
