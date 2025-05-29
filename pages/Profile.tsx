import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Edit3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    age: "",
    interests: [] as string[],
    photos: [] as string[],
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const { data: balance } = useQuery({
    queryKey: ["/api/balance"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
  });

  const profile = profileData?.profile;

  const handleEdit = () => {
    if (profile) {
      setFormData({
        bio: profile.bio || "",
        age: profile.age?.toString() || "",
        interests: profile.interests || [],
        photos: profile.photos || [],
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      ...formData,
      age: parseInt(formData.age) || null,
    });
  };

  const handleInterestAdd = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest],
      }));
    }
  };

  const handleInterestRemove = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }));
  };

  if (!user || !profileData) {
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
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <div className="ml-auto">
          {!isEditing ? (
            <Button onClick={handleEdit} variant="ghost" size="sm">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm">
                Save
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-primary to-secondary"></div>
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <img
              src={user.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
        </div>

        <div className="pt-16 px-6 space-y-6">
          {/* Basic Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
              {profile?.age && <span className="font-normal"> {profile.age}</span>}
            </h2>
            <div className="flex items-center justify-center mt-2 text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span>San Francisco, CA</span>
            </div>
          </div>

          {/* Account Balance */}
          <Card>
            <CardContent className="p-4">
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

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>About Me</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about yourself..."
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-gray-600">
                  {profile?.bio || "No bio added yet. Click Edit to add one!"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Age */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Age</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Your age"
                />
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Add an interest and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleInterestAdd(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20"
                        onClick={() => handleInterestRemove(interest)}
                      >
                        {interest} ×
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.interests?.length ? (
                    profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-600">No interests added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {profile?.photos?.map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-xl overflow-hidden">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-primary transition-colors">
                  <i className="fas fa-plus text-2xl text-gray-400"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
