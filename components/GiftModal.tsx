import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
}

const gifts = [
  { type: "rose", emoji: "🌹", name: "Rose", price: "$5.00" },
  { type: "chocolate", emoji: "🍫", name: "Chocolate", price: "$7.50" },
  { type: "diamond", emoji: "💎", name: "Diamond", price: "$15.00" },
  { type: "surprise", emoji: "🎁", name: "Surprise", price: "$10.00" },
  { type: "champagne", emoji: "🥂", name: "Champagne", price: "$25.00" },
  { type: "coffee", emoji: "☕", name: "Coffee", price: "$2.50" },
];

export default function GiftModal({ isOpen, onClose, recipientId }: GiftModalProps) {
  const queryClient = useQueryClient();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  const sendGiftMutation = useMutation({
    mutationFn: async (giftType: string) => {
      const response = await apiRequest("POST", "/api/gifts", {
        toUserId: recipientId,
        giftType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      onClose();
      setSelectedGift(null);
    },
  });

  const handleSendGift = () => {
    if (selectedGift) {
      sendGiftMutation.mutate(selectedGift);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">Send a Gift</DialogTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {gifts.map((gift) => (
              <div
                key={gift.type}
                onClick={() => setSelectedGift(gift.type)}
                className={`bg-gray-50 rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                  selectedGift === gift.type
                    ? "bg-primary/10 border-2 border-primary"
                    : "hover:bg-yellow-50"
                }`}
              >
                <div className="text-2xl mb-2">{gift.emoji}</div>
                <p className="text-sm font-semibold text-gray-900">{gift.name}</p>
                <p className="text-xs text-gray-600">{gift.price}</p>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handleSendGift}
            disabled={!selectedGift || sendGiftMutation.isPending}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-lg h-auto"
          >
            {sendGiftMutation.isPending ? "Sending..." : "Send Gift"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
