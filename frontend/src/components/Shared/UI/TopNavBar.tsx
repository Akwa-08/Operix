// frontend/src/components/Shared/UI/TopNavBar.tsx
import { useState, useEffect, useRef } from "react";
import { Bell, X, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../../config/supabaseClient";
import { useOrdersData } from "../../../hooks/useSupabase";

type NavbarProps = {
  displayName?: string;
  onMenuClick?: () => void; // triggers burger menu
};

interface Notification {
  id: string;
  title: string;
  message: string;
  related_module: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  // Supabase stores timestamps as UTC without the Z suffix.
  // Without normalization, JS parses them as local time, causing an offset equal
  // to the client's UTC offset (e.g. 8 h for UTC+8). Appending Z fixes this.
  const normalized = /[Z+]/.test(iso) ? iso : iso.replace(" ", "T") + "Z";
  const diff = Date.now() - new Date(normalized).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const moduleIcon: Record<string, string> = {
  orders: "📦",
  payment: "💰",
  messages: "💬",
  inventory: "🗃️",
  users: "👤",
  system: "⚙️",
};

const TopNavBar: React.FC<NavbarProps> = ({ displayName, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = location.pathname.startsWith("/admin");
  const { stats } = useOrdersData();
  const unassignedCount = (isAdmin && stats?.unassigned) || 0;

  // ── Notification fetching + realtime + polling ─────────────────────────────
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const isFetching = { current: false };

    const fetchNotifications = async (userId: string) => {
      if (isFetching.current || !isMounted) return;
      isFetching.current = true;
      try {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && isMounted) {
          setNotifications(data as Notification[]);
        }
      } catch (err) {
        console.error("Notification fetch failed:", err);
      } finally {
        isFetching.current = false;
      }
    };

    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        userIdRef.current = user.id;

        // 1. Initial fetch
        await fetchNotifications(user.id);

        // 2. Realtime subscription for instant updates
        if (isMounted && !channelRef.current) {
          channelRef.current = supabase
            .channel(`notifs_${user.id}_${Date.now()}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${user.id}`,
              },
              () => {
                fetchNotifications(user.id);
              },
            )
            .subscribe();
        }

        // 3. Polling fallback — guarantees updates even if Realtime is flaky
        if (isMounted && !pollTimer) {
          pollTimer = setInterval(() => {
            fetchNotifications(user.id);
          }, 10_000); // every 10 seconds
        }
      } catch (err) {
        console.error("Notification init failed:", err);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const [previewNotif, setPreviewNotif] = useState<Notification | null>(null);

  const handleNotifClick = async (n: Notification) => {
    // Open preview instead of navigating
    setPreviewNotif(n);

    // Mark as read immediately when previewed
    if (!n.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
    }
  };

  const handleProceed = () => {
    if (!previewNotif) return;
    const n = previewNotif;
    setPreviewNotif(null);
    setShowNotif(false);

    const path = location.pathname;
    const base = path.startsWith("/admin")
      ? "/admin"
      : path.startsWith("/cashier")
        ? "/cashier"
        : path.startsWith("/designer")
          ? "/designer"
          : path.startsWith("/production")
            ? "/production"
            : "";

    if (n.related_module === "messages") {
      // related_id = sender's user ID — pass it so Messages auto-opens that conversation
      const chatParam = n.related_id ? `?openChat=${n.related_id}` : "";
      navigate(`${base}/messages${chatParam}`);
    } else if (n.related_module === "orders" || n.related_module === "payment") {
      if (n.id === "virtual-unassigned") {
        navigate(`${base}/orders?filter=unassigned`);
      } else {
        navigate(`${base}/orders?highlight=${n.related_id}`);
      }
    } else if (n.related_module === "inventory") {
      navigate(`${base}/inventory?highlight=${n.related_id}`);
    } else if (n.related_module === "payroll") {
      navigate(`${base}/payroll?tab=Payroll Dashboard&highlight=${n.related_id}`);
    }
  };

  const rawDisplayed =
    tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const displayed = (() => {
    if (unassignedCount > 0) {
      const virtual: Notification = {
        id: "virtual-unassigned",
        title: "Unassigned Orders",
        message: `There are ${unassignedCount} orders waiting for assignment.`,
        related_module: "orders",
        related_id: "unassigned",
        is_read: false,
        created_at: new Date().toISOString(),
      };
      return [virtual, ...rawDisplayed];
    }
    return rawDisplayed;
  })();

  const unreadCount = notifications.filter((n) => !n.is_read).length + (unassignedCount > 0 ? 1 : 0);

  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 justify-between z-50 shadow-sm">
      {/* Left: burger (mobile) + logo */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu">
            <Menu size={22} className="text-gray-700" />
          </button>
        )}
        <img
          src="/images/DASHBOARD3.png"
          alt="OPERIX Logo"
          className="h-6 sm:h-8 w-auto"
        />
      </div>

      {/* Right: user chip + bell */}
      <div className="flex items-center gap-3">
        {displayName && (
          <span className="hidden sm:inline-block text-sm font-semibold text-gray-700">
            {displayName}
          </span>
        )}

        {/* Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            aria-label="Notifications">
            <Bell className="w-5 h-5 text-slate-800" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <span className="text-[11px] font-bold text-white leading-none px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setShowNotif(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {(["all", "unread"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all capitalize ${tab === t
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                        }`}>
                      {t}{" "}
                      {t === "unread" && unreadCount > 0
                        ? `(${unreadCount})`
                        : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {displayed.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {tab === "unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </div>
                ) : (
                  displayed.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? "bg-blue-50/60" : ""}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-base">
                        {moduleIcon[n.related_module || "system"] || "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug mb-0.5 ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-gray-500 truncate">
                            {n.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {n.id !== "virtual-unassigned" && !n.is_read && (
                        <button
                          onClick={(e) => markRead(n.id, e)}
                          className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold whitespace-nowrap flex-shrink-0 mt-0.5">
                          Mark read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {unreadCount > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={markAllRead}
                    className="w-full text-xs text-cyan-600 hover:text-cyan-700 font-semibold">
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Notification Preview Modal */}
      {previewNotif && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-2xl mb-4">
                {moduleIcon[previewNotif.related_module || "system"] || "📋"}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {previewNotif.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {previewNotif.message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewNotif(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
                  Close
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-cyan-200">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopNavBar;
