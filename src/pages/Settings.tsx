import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, MapPin, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [ageRange, setAgeRange] = useState([18, 35]);
  const [maxDistance, setMaxDistance] = useState([25]);
  const [showMe, setShowMe] = useState("everyone");
  const [locationVisible, setLocationVisible] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const { data: balance } = useQuery({
    queryKey: ["/api/balance"],
    enabled: !!user,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (!user) {
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
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={user.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-600">28 years old</p>
                <Button
                  onClick={() => setLocation("/profile")}
                  variant="link"
                  className="text-primary text-sm font-semibold p-0 h-auto"
                >
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Account Balance */}
            <div className="bg-gradient-to-r from-yellow-400 to-green-500 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Account Balance</p>
                  <h4 className="text-2xl font-bold">${balance?.amount || "0.00"}</h4>
                  <p className="text-xs opacity-75">Withdrawable at $10+</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Discovery Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-900 font-medium">Age Range</label>
                <span className="text-gray-600">{ageRange[0]}-{ageRange[1]}</span>
              </div>
              <Slider
                value={ageRange}
                onValueChange={setAgeRange}
                min={18}
                max={65}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-900 font-medium">Maximum Distance</label>
                <span className="text-gray-600">{maxDistance[0]} km</span>
              </div>
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-gray-900 font-medium mb-2 block">Show Me</label>
              <Select value={showMe} onValueChange={setShowMe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 font-medium">Show My Location</div>
                <div className="text-sm text-gray-600">Let others see your distance</div>
              </div>
              <Switch checked={locationVisible} onCheckedChange={setLocationVisible} />
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Push Notifications</span>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Location Services</span>
              </div>
              <Switch checked={locationVisible} onCheckedChange={setLocationVisible} />
            </div>

            <button className="flex items-center justify-between py-2 w-full text-left">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Privacy & Safety</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="flex items-center justify-between py-2 w-full text-left">
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Help & Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 py-2 w-full text-left text-red-500"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
