import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import GiftModal from "@/components/GiftModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, Video, Gift, Send, Smile } from "lucide-react";
import { useLocation, useParams } from "wouter";

interface Message {
  id: number;
  matchId: number;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/matches/${matchId}/messages`],
    enabled: !!matchId && !!user,
  });

  const { sendMessage } = useWebSocket(user?.id);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/matches/${matchId}/messages`, {
        content,
        messageType: "text",
      });
      return response.json();
    },
    onSuccess: (message) => {
      queryClient.setQueryData([`/api/matches/${matchId}/messages`], (old: Message[]) => [
        ...(old || []),
        { ...message, sender: user }
      ]);
      setNewMessage("");
      
      // Send via WebSocket for real-time delivery
      sendMessage({
        type: "message",
        message,
        recipientId: getOtherUserId(),
      });
    },
  });

  const getOtherUserId = () => {
    // This would need to be determined from the match data
    // For now, we'll need to fetch match details or pass it through params
    return "other-user-id"; // placeholder
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get other user info from first message or match data
  const otherUser = messages[0]?.sender?.id !== user?.id ? messages[0]?.sender : null;
  const displayName = otherUser ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || "Unknown" : "Chat";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Chat Header */}
      <header className="bg-white px-6 py-4 border-b border-gray-100 flex items-center">
        <button onClick={() => setLocation("/messages")} className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        {otherUser && (
          <img
            src={otherUser.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face"}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{displayName}</h3>
          <p className="text-xs text-green-500">Online</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
            <Phone className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
            <Video className="w-5 h-5 text-gray-600" />
          </Button>
          <Button
            onClick={() => setShowGiftModal(true)}
            className="w-10 h-10 p-0 rounded-full bg-primary hover:bg-primary/90"
          >
            <Gift className="w-5 h-5 text-white" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center mb-4">
              <div className="text-2xl mb-2">💕</div>
              <p className="text-sm text-gray-600">You matched! Start the conversation.</p>
            </div>
          </div>
        ) : (
          messages.map((message: Message) => {
            const isOwn = message.senderId === user?.id;
            
            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : ""}`}>
                <div className="max-w-xs">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isOwn
                        ? "bg-primary text-white rounded-br-lg"
                        : "bg-gray-100 text-gray-900 rounded-bl-lg"
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <p
                    className={`text-xs text-gray-500 mt-1 ${
                      isOwn ? "text-right mr-4" : "ml-4"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowGiftModal(true)}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-full"
          >
            <Gift className="w-5 h-5 text-yellow-500" />
          </Button>
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex items-center">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-500"
            />
            <Button variant="ghost" size="sm" className="p-0 ml-3">
              <Smile className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            className="w-10 h-10 p-0 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      <GiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        recipientId={getOtherUserId()}
      />
    </div>
  );
}
