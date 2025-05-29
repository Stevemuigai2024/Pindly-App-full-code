import { Heart, MessageCircle, User } from "lucide-react";
import { useLocation } from "wouter";

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Heart, label: "Discover", path: "/" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                isActive ? "text-primary" : "text-gray-500"
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
