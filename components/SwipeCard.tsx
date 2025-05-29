import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Info } from "lucide-react";

interface Profile {
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

interface SwipeCardProps {
  profile: Profile;
  className?: string;
  zIndex?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function SwipeCard({
  profile,
  className = "",
  zIndex = 1,
  onSwipeLeft,
  onSwipeRight,
}: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [showLikeIndicator, setShowLikeIndicator] = useState(false);
  const [showNopeIndicator, setShowNopeIndicator] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const displayName = `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim() || "Unknown";
  const profileImage = profile.user.profileImageUrl || profile.photos?.[0] || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face";

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);

    // Show indicators based on swipe direction
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setShowLikeIndicator(true);
        setShowNopeIndicator(false);
      } else {
        setShowLikeIndicator(false);
        setShowNopeIndicator(true);
      }
    } else {
      setShowLikeIndicator(false);
      setShowNopeIndicator(false);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
      setRotation(0);
      setShowLikeIndicator(false);
      setShowNopeIndicator(false);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  const cardStyle = {
    zIndex,
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
    transition: isDragging ? "none" : "transform 0.3s ease-out",
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <Card
      ref={cardRef}
      className={`${className} overflow-hidden shadow-2xl select-none`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="relative h-full">
        <img
          src={profileImage}
          alt={displayName}
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* Swipe indicators */}
        <div
          className={`absolute top-20 right-8 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-xl transform rotate-12 transition-opacity ${
            showLikeIndicator ? "opacity-100" : "opacity-0"
          }`}
        >
          LIKE
        </div>
        <div
          className={`absolute top-20 left-8 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-xl transform -rotate-12 transition-opacity ${
            showNopeIndicator ? "opacity-100" : "opacity-0"
          }`}
        >
          NOPE
        </div>
        
        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-2xl font-bold">
                {displayName}
                {profile.age && <span className="font-normal"> {profile.age}</span>}
              </h3>
              <div className="flex items-center text-white/90 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">2.5 km away</span>
              </div>
            </div>
            <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Info className="w-5 h-5" />
            </button>
          </div>
          
          {profile.bio && (
            <p className="text-sm text-white/90 mb-4 line-clamp-2">
              {profile.bio}
            </p>
          )}
          
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-white/20 text-white hover:bg-white/30 text-xs"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
