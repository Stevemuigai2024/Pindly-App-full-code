import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Heart, X, Star } from "lucide-react";

interface ProfileData {
  id: number;
  userId: string;
  bio: string | null;
  age: number | null;
  interests: string[] | null;
  photos: string[] | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<ProfileData | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["/api/discover"],
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ toUserId, isLike }: { toUserId: string; isLike: boolean }) => {
      const response = await apiRequest("POST", "/api/like", { toUserId, isLike });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.match) {
        setMatchedProfile(profiles[currentCardIndex]);
        setShowMatchModal(true);
      }
      setCurrentCardIndex((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/discover"] });
    },
  });

  const handleLike = () => {
    if (profiles[currentCardIndex]) {
      likeMutation.mutate({
        toUserId: profiles[currentCardIndex].userId,
        isLike: true,
      });
    }
  };

  const handlePass = () => {
    if (profiles[currentCardIndex]) {
      likeMutation.mutate({
        toUserId: profiles[currentCardIndex].userId,
        isLike: false,
      });
    }
  };

  const handleSuperLike = () => {
    // For now, treat super like as regular like
    handleLike();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentProfile = profiles[currentCardIndex];
  const nextProfile = profiles[currentCardIndex + 1];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <i className="fas fa-cog text-gray-600"></i>
        </button>
        <div className="flex items-center space-x-2">
          <Heart className="text-primary w-6 h-6" />
          <h1 className="text-xl font-bold text-gray-900">Pindly</h1>
        </div>
        <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative">
          <i className="fas fa-comment text-gray-600"></i>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center">
            3
          </span>
        </button>
      </header>

      {/* Card Stack */}
      <div className="flex-1 relative overflow-hidden p-4">
        {!currentProfile ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No More Profiles</h2>
              <p className="text-gray-600">Check back later for new matches!</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Background card */}
            {nextProfile && (
              <SwipeCard 
                profile={nextProfile}
                className="absolute inset-4 transform scale-95 opacity-50"
                zIndex={1}
              />
            )}
            
            {/* Active card */}
            <SwipeCard 
              profile={currentProfile}
              className="absolute inset-4"
              zIndex={2}
              onSwipeLeft={handlePass}
              onSwipeRight={handleLike}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentProfile && (
        <div className="flex justify-center items-center space-x-8 py-6 bg-white">
          <Button
            onClick={handlePass}
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-gray-400"
          >
            <X className="w-6 h-6 text-gray-600" />
          </Button>
          
          <Button
            onClick={handleSuperLike}
            size="lg"
            className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600"
          >
            <Star className="w-5 h-5 text-white" />
          </Button>
          
          <Button
            onClick={handleLike}
            size="lg"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
          >
            <Heart className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

      <Navigation />

      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchedProfile={matchedProfile}
      />
    </div>
  );
}
