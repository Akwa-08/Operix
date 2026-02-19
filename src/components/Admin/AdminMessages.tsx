import { useState, useRef, useEffect } from "react";
import { Search, Send } from "lucide-react";

// Types for backend integration
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isFromAdmin: boolean;
}

interface Conversation {
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

const AdminMessages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv1",
      userId: "U001",
      userName: "Shane Dawson",
      userRole: "Designer",
      lastMessage: "Thank you for your help with the order!",
      lastMessageTime: "Today 17:26 AM",
      unreadCount: 0,
      isActive: true,
      messages: [
        {
          id: "msg1",
          senderId: "U001",
          senderName: "Shane Dawson",
          content: "Hi! I have a question about my recent order.",
          timestamp: "11:04 pm",
          isFromAdmin: false,
        },
        {
          id: "msg2",
          senderId: "admin",
          senderName: "Admin",
          content:
            "Hello John! I'd be happy to help you with your order. What specific question do you have?",
          timestamp: "11:34 pm",
          isFromAdmin: true,
        },
        {
          id: "msg3",
          senderId: "U001",
          senderName: "Shane Dawson",
          content:
            "The delivery date has changed and I wanted to confirm the new timeline.",
          timestamp: "12:04 pm",
          isFromAdmin: false,
        },
      ],
    },
    {
      id: "conv2",
      userId: "U002",
      userName: "Production Team",
      userRole: "Production",
      lastMessage: "Thank you for your help with the order!",
      lastMessageTime: "Yesterday 02:50 PM",
      unreadCount: 0,
      isActive: true,
      messages: [
        {
          id: "msg4",
          senderId: "U002",
          senderName: "Production Team",
          content: "We need approval for the new batch of materials.",
          timestamp: "Yesterday 02:50 PM",
          isFromAdmin: false,
        },
      ],
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    conversations[0]
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
      senderId: "admin",
      senderName: "Admin",
      content: messageInput,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      isFromAdmin: true,
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
          : conv
      )
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
        : null
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
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="flex gap-6 h-[calc(100%-60px)]">
        {/* Conversations List */}
        <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Conversations
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                  selectedConversation?.id === conversation.id
                    ? "bg-cyan-50 border-r-4 border-r-cyan-500"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-600">
                    {getInitials(conversation.userName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {conversation.userName}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {conversation.userRole}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {conversation.lastMessageTime}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-semibold text-gray-600">
                  {getInitials(selectedConversation.userName)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedConversation.userName}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    {selectedConversation.userRole}
                  </p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isFromAdmin ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl ${
                      message.isFromAdmin
                        ? "bg-cyan-500 text-white rounded-br-sm"
                        : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isFromAdmin ? "text-cyan-100" : "text-gray-400"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
            <div className="text-center">
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

export default AdminMessages;