import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface Profile {
  id: number;
  userId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: Profile | null;
}

export default function MatchModal({ isOpen, onClose, matchedProfile }: MatchModalProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!matchedProfile || !user) return null;

  const displayName = `${matchedProfile.user.firstName || ""} ${matchedProfile.user.lastName || ""}`.trim() || "Someone";

  const handleSendMessage = () => {
    onClose();
    setLocation("/messages");
  };

  const handleKeepSwiping = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <div className="text-center p-6">
          <div className="mb-6">
            <div className="text-6xl mb-4 animate-pulse">💕</div>
            <h2 className="text-3xl font-bold text-primary mb-2">It's a Match!</h2>
            <p className="text-gray-600">You and {displayName} liked each other</p>
          </div>
          
          <div className="flex justify-center mb-6 -space-x-4">
            <img
              src={user.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"}
              alt="Your photo"
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <img
              src={matchedProfile.user.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"}
              alt="Match photo"
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleSendMessage}
              className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg h-auto"
            >
              Send Message
            </Button>
            <Button
              onClick={handleKeepSwiping}
              variant="outline"
              className="w-full py-4 rounded-2xl font-semibold text-lg h-auto"
            >
              Keep Swiping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
