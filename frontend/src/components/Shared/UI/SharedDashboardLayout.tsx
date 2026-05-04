import { useState, useEffect, useRef, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SharedSideBar, { type SidebarItem } from "./SharedSideBar";
import TopNavBar from "./TopNavBar";
import { useAuth } from "../../../context/AuthContext";
import { SidebarProvider, useSidebar } from "../../../context/SidebarContext";
import { db } from "../../../lib/database";
import { supabase } from "../../../config/supabaseClient";

interface SharedDashboardLayoutProps {
  items: SidebarItem[];
  profilePath: string;
  roleName?: string;
}

const LayoutContent = ({ items, profilePath, roleName }: SharedDashboardLayoutProps) => {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : roleName || "User";

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  // Check if currently on messages page
  const isOnMessagesPage = location.pathname.endsWith("/messages");

  // Fetch unread count
  useEffect(() => {
    if (!user) return;

    // Init user id for localStorage tracking
    db.chat.initUserId();

    const fetchUnread = async () => {
      const count = await db.chat.getUnreadCount();
      setUnreadCount(count);
    };

    fetchUnread();

    // Subscribe to new messages for realtime badge updates
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel("unread_badge_listener")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          () => {
            // Re-fetch unread count when a new message arrives
            fetchUnread();
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  // Mark messages as viewed when on messages page, and clear badge
  useEffect(() => {
    if (isOnMessagesPage && user) {
      db.chat.markMessagesViewed();
      setUnreadCount(0);
    }
  }, [isOnMessagesPage, user]);
  
  // App Badging API (Native icon notification count)
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount).catch(console.error);
      } else {
        (navigator as any).clearAppBadge().catch(console.error);
      }
    }
  }, [unreadCount]);

  // Inject badge into Messages sidebar item
  const itemsWithBadge = useMemo(() => {
    return items.map(item => {
      if (item.label === "Messages") {
        return { ...item, badge: isOnMessagesPage ? 0 : unreadCount };
      }
      return item;
    });
  }, [items, unreadCount, isOnMessagesPage]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavBar displayName={displayName} onMenuClick={() => setMobileOpen(!mobileOpen)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <SharedSideBar
          name={displayName}
          role={roleName || user?.role}
          avatarUrl={user?.avatarUrl}
          items={itemsWithBadge}
          profilePath={profilePath}
          onLogout={handleLogout}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        
        <main
          className={`flex-1 min-w-0 overflow-x-hidden p-4 md:p-6 mt-16 transition-all duration-300 ${
            collapsed ? "lg:ml-[72px]" : "lg:ml-[200px]"
          }`}
        >
          <div className="max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const SharedDashboardLayout = (props: SharedDashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <LayoutContent {...props} />
    </SidebarProvider>
  );
};

export default SharedDashboardLayout;
