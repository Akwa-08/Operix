import React, {useState, useRef, useEffect, useCallback} from "react";
import {Search, Send, PlusCircle, ArrowLeft, ImageIcon, X} from "lucide-react";
import {useAuth} from "../../../context/AuthContext";
import {db} from "../../../lib/database";
import toast from "react-hot-toast";

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string; // TST_07_02 — image in chat
  timestamp: string;
  isFromAdmin: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
  messages: Message[];
}

interface MessagesProps {
  title?: string;
}

const MAX_CHARS = 500; // TST_07_01 — character limit

// ─── Component ────────────────────────────────────────────────────────────────
const Messages: React.FC<MessagesProps> = ({title = "Messages"}) => {
  const {user} = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverySearch, setDiscoverySearch] = useState("");
  const [potentialRecipients, setPotentialRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Image upload state (TST_07_02)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConvRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  const STAFF_ROLES = ["admin", "cashier", "designer", "production"];
  const isStaff = user
    ? STAFF_ROLES.includes((user.role || "").toLowerCase())
    : false;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  // ── Load conversations ─────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await db.chat.getConversations();
      setConversations(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Select a conversation and load its messages ────────────────────────────
  const openConversation = useCallback(async (conv: Conversation) => {
    try {
      const messages = await db.chat.getMessages(conv.userId);
      const full = {...conv, messages};
      setSelectedConv(full);
      selectedConvRef.current = full;
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadConversations().then((data) => {
      if (data.length > 0 && !selectedConvRef.current) {
        openConversation(data[0]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const subscription = db.chat.subscribeToMessages(async (payload: any) => {
      const newMsg = payload.new;
      if (newMsg.sender_id === user.id) return;

      await loadConversations();

      const current = selectedConvRef.current;
      if (
        current &&
        (newMsg.sender_id === current.userId ||
          newMsg.receiver_id === current.userId)
      ) {
        const fresh = await db.chat.getMessages(current.userId);
        setSelectedConv((prev) => (prev ? {...prev, messages: fresh} : null));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [selectedConv?.messages]);

  // ── Discovery ──────────────────────────────────────────────────────────────
  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    if (potentialRecipients.length === 0 && user) {
      try {
        const list = await db.chat.getPotentialRecipients(user.role);
        setPotentialRecipients(list);
      } catch (err) {
        console.error("Failed to fetch recipients:", err);
      }
    }
  };

  const handleSelectDiscoveryUser = async (target: any) => {
    setIsDiscovering(false);
    setDiscoverySearch("");

    const existing = conversations.find((c) => c.userId === target.userId);
    if (existing) {
      openConversation(existing);
      return;
    }

    const draft: Conversation = {
      id: `draft-${target.userId}`,
      userId: target.userId,
      userName: target.userName,
      userRole: target.userRole,
      lastMessage: "",
      lastMessageTime: "",
      unreadCount: 0,
      isActive: true,
      messages: [],
    };
    setSelectedConv(draft);
    selectedConvRef.current = draft;
  };

  // ── Image file handling (TST_07_02) ────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const clearImageAttachment = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content && !imageFile) return;
    if (!selectedConv || !user) return;

    setMessageInput("");

    // Optimistic UI — show immediately with local timestamp
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      content,
      attachmentUrl: imagePreview ?? undefined,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      isFromAdmin: isStaff,
    };

    setSelectedConv((prev) =>
      prev ? {...prev, messages: [...prev.messages, optimistic]} : null,
    );

    // Upload image if present
    let uploadedUrl: string | undefined;
    if (imageFile) {
      setIsUploadingImage(true);
      try {
        uploadedUrl = await db.chat.uploadChatImage(imageFile);
      } catch (err: any) {
        toast.error(err.message || "Failed to upload image");
        // Revert optimistic on upload failure
        setSelectedConv((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== optimistic.id),
              }
            : null,
        );
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
      clearImageAttachment();
    }

    try {
      await db.chat.sendMessage(
        selectedConv.userId,
        content,
        undefined,
        uploadedUrl,
      );

      if (selectedConv.id.startsWith("draft-")) {
        const freshList = await loadConversations();
        const real = freshList.find((c) => c.userId === selectedConv.userId);
        if (real) {
          setSelectedConv((prev) => (prev ? {...prev, id: real.id} : null));
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setSelectedConv((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== optimistic.id),
            }
          : null,
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Filtered views ─────────────────────────────────────────────────────────
  const filteredConversations = conversations.filter((c) =>
    c.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredRecipients = potentialRecipients.filter((r) =>
    r.userName.toLowerCase().includes(discoverySearch.toLowerCase()),
  );

  if (!user) return null;

  const charsLeft = MAX_CHARS - messageInput.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight">
        {title}
      </h1>

      <div
        className="flex gap-4 md:gap-6 overflow-hidden"
        style={{height: "calc(100vh - 180px)", minHeight: 360}}>
        {/* ── LEFT: conversation list ─────────────────────────────────────── */}
        <div
          className={`flex-col ${
            selectedConv ? "hidden md:flex" : "flex"
          } w-full md:w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {isDiscovering ? "New Message" : "Conversations"}
              </h2>
              {isDiscovering ? (
                <button
                  onClick={() => {
                    setIsDiscovering(false);
                    setDiscoverySearch("");
                  }}
                  className="p-1 px-2 text-xs font-semibold text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors flex items-center gap-1">
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <button
                  onClick={handleStartDiscovery}
                  className="p-1.5 text-cyan-600 bg-cyan-50 rounded-full hover:bg-cyan-100 transition-colors"
                  title="New Message">
                  <PlusCircle size={20} />
                </button>
              )}
            </div>

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  isDiscovering ? "Search users..." : "Search conversations..."
                }
                value={isDiscovering ? discoverySearch : searchQuery}
                onChange={(e) =>
                  isDiscovering
                    ? setDiscoverySearch(e.target.value)
                    : setSearchQuery(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isDiscovering ? (
              filteredRecipients.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  No users found
                </p>
              ) : (
                filteredRecipients.map((r) => (
                  <button
                    key={r.userId}
                    onClick={() => handleSelectDiscoveryUser(r)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-cyan-700">
                        {getInitials(r.userName)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {r.userName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {r.userRole}
                      </p>
                    </div>
                  </button>
                ))
              )
            ) : loading ? (
              <p className="p-4 text-center text-sm text-gray-400">Loading…</p>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                No active conversations
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    selectedConv?.userId === conv.userId
                      ? "bg-cyan-50 border-r-4 border-r-cyan-500"
                      : ""
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">
                      {getInitials(conv.userName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {conv.userName}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1 capitalize">
                      {conv.userRole}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {conv.lastMessageTime}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: chat area ────────────────────────────────────────────── */}
        {selectedConv ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-w-0">
            {/* Header — TST_07_01: removed hardcoded "Online" badge */}
            <div className="p-4 md:p-6 border-b border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-2 -ml-1 hover:bg-gray-100 rounded-lg"
                aria-label="Back to conversations">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-gray-600">
                  {getInitials(selectedConv.userName)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedConv.userName}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {selectedConv.userRole}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {selectedConv.messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8">
                  No messages yet. Say hello!
                </p>
              )}
              {selectedConv.messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-cyan-500 text-white rounded-br-sm"
                          : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
                      }`}>
                      {/* Image attachment (TST_07_02) */}
                      {msg.attachmentUrl && (
                        <img
                          src={msg.attachmentUrl}
                          alt="attachment"
                          className="rounded-xl mb-2 max-w-[240px] max-h-[240px] object-cover cursor-pointer"
                          onClick={() =>
                            window.open(msg.attachmentUrl, "_blank")
                          }
                        />
                      )}
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                      <p
                        className={`text-[10px] mt-1 text-right ${isMine ? "text-cyan-100" : "text-gray-400"}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Image preview strip (TST_07_02) */}
              {imagePreview && (
                <div className="relative inline-block mb-3">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="h-20 w-20 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={clearImageAttachment}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                    <X size={11} />
                  </button>
                </div>
              )}

              <div className="flex gap-3 items-center">
                {/* Hidden file input (TST_07_02) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {/* Image icon button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image (max 2 MB)"
                  className="p-2.5 text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-colors flex-shrink-0">
                  <ImageIcon size={20} />
                </button>

                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="Tap here to type a message..."
                    value={messageInput}
                    maxLength={MAX_CHARS}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {/* Character counter (TST_07_01) */}
                  {messageInput.length > 0 && (
                    <p
                      className={`text-[11px] text-right pr-1 ${charsLeft < 50 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      {charsLeft} characters remaining
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={
                    (!messageInput.trim() && !imageFile) || isUploadingImage
                  }
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 active:scale-95 shadow-sm flex-shrink-0">
                  {isUploadingImage ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
