import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

interface Match {
  id: number;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  user1: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  user2: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["/api/matches"],
    enabled: !!user,
  });

  const handleChatClick = (matchId: number) => {
    setLocation(`/chat/${matchId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center border-b border-gray-100">
        <button onClick={() => setLocation("/")} className="mr-4">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {matches.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Messages Yet</h2>
              <p className="text-gray-600">Start swiping to find your matches!</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {matches.map((match: Match) => {
              const otherUser = match.user1Id === user?.id ? match.user2 : match.user1;
              const displayName = `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || "Unknown";
              
              return (
                <div
                  key={match.id}
                  onClick={() => handleChatClick(match.id)}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={otherUser.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face"}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">{displayName}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">You matched! Say hello 👋</p>
                  </div>
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
