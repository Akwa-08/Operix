import React, { useState, useRef, useEffect } from "react";
import { Search, Send, MessageCircle } from "lucide-react";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
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
  initialConversations: Conversation[];
  title?: string;
  currentUserId?: string;
  currentUserName?: string;
  isAdmin?: boolean;
}

const Messages: React.FC<MessagesProps> = ({
  initialConversations,
  title = "Messages Dashboard",
  currentUserId = "user-1",
  currentUserName = "Current User",
  isAdmin = false,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    conversations.length > 0 ? conversations[0] : null,
  );
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      isFromAdmin: isAdmin,
    };

    // Update conversations
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: messageInput,
              lastMessageTime: "Just now",
            }
          : conv,
      ),
    );

    // Update selected conversation
    setSelectedConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: messageInput,
            lastMessageTime: "Just now",
          }
        : null,
    );

    setMessageInput("");

    // TODO: Send to backend
    console.log("Sending message:", newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] animate-in fade-in zoom-in duration-300">
      <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">{title}</h1>

      <div className="flex gap-8 h-[calc(100%-80px)]">
        {/* Conversations List - Scaled Up for Boomers */}
        <div className="w-96 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex flex-col overflow-hidden">
          <div className="p-6 border-b-2 border-slate-100 bg-slate-50">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-cyan-600" /> Inbox
            </h2>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={24}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-5 py-4 border-2 border-slate-300 rounded-xl text-lg font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-all placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-100">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-6 flex flex-col gap-2 hover:bg-slate-50 transition-colors border-l-8 text-left ${
                  selectedConversation?.id === conversation.id
                    ? "bg-cyan-50/50 border-cyan-500 shadow-inner"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-14 h-14 rounded-2xl flex-shrink-0 bg-slate-200 flex items-center justify-center border-2 border-slate-300 shadow-sm text-slate-600 font-black text-xl">
                    {getInitials(conversation.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xl font-black text-slate-900 truncate tracking-tight">
                        {conversation.userName}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm font-black rounded-lg shadow-sm">
                          {conversation.unreadCount} New
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      {conversation.userRole}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pl-[72px] pr-2">
                  <p className="text-lg text-slate-600 truncate font-medium">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-sm text-slate-400 font-semibold mt-2">
                    {conversation.lastMessageTime}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area - Scaled Up */}
        {selectedConversation ? (
          <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-8 border-b-2 border-slate-100 bg-slate-50 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 bg-slate-200 flex items-center justify-center border-2 border-slate-300 shadow-sm text-slate-600 font-black text-2xl">
                {getInitials(selectedConversation.userName)}
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {selectedConversation.userName}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-lg font-bold text-slate-500">
                    {selectedConversation.userRole}
                  </p>
                  <span className="px-3 py-1 bg-green-100 border border-green-200 text-green-800 text-sm font-black rounded-lg uppercase tracking-wider">
                    Online Now
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 space-y-6">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    (isAdmin && message.isFromAdmin) || (!isAdmin && !message.isFromAdmin)
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl px-6 py-5 rounded-3xl shadow-sm border-2 ${
                      (isAdmin && message.isFromAdmin) || (!isAdmin && !message.isFromAdmin)
                        ? "bg-cyan-600 text-white rounded-br-md border-cyan-700"
                        : "bg-white text-slate-900 rounded-bl-md border-slate-200"
                    }`}
                  >
                    <p className="text-xl font-medium leading-relaxed">{message.content}</p>
                    <p
                      className={`text-sm font-bold mt-3 text-right ${
                        (isAdmin && message.isFromAdmin) || (!isAdmin && !message.isFromAdmin)
                          ? "text-cyan-200"
                          : "text-slate-400"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Massive Touch Targets */}
            <div className="p-6 border-t-2 border-slate-100 bg-white">
              <div className="flex items-stretch gap-4 bg-slate-50 border-2 border-slate-200 p-2 rounded-2xl focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/20 transition-all">
                <input
                  type="text"
                  placeholder="Tap here to type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-6 py-4 bg-transparent text-xl font-medium text-slate-900 focus:outline-none placeholder-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:border-slate-300 text-white font-black text-xl rounded-xl shadow-md transition-colors flex items-center justify-center gap-3 border-b-4 border-cyan-800 active:border-b-0 active:translate-y-1"
                >
                  Confirm & Send <Send size={24} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex items-center justify-center p-12 text-center bg-slate-50/50">
            <div className="max-w-md">
              <MessageCircle className="w-24 h-24 text-slate-300 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-slate-800 mb-4">No Conversation Selected</h2>
              <p className="text-xl text-slate-500 font-medium">
                Tap on an inbox thread from the left panel to read and reply to messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
