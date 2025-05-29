import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertLikeSchema, insertMessageSchema, insertGiftSchema } from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Also get user's profile and balance
      const profile = await storage.getProfile(userId);
      const balance = await storage.getBalance(userId);
      
      res.json({ 
        user, 
        profile, 
        balance: balance || { amount: "0.00", totalEarned: "0.00" }
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      
      const existingProfile = await storage.getProfile(userId);
      if (existingProfile) {
        const updatedProfile = await storage.updateProfile(userId, profileData);
        res.json(updatedProfile);
      } else {
        const newProfile = await storage.createProfile(profileData);
        res.json(newProfile);
      }
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.get('/api/profile/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Discovery routes
  app.get('/api/discover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const profiles = await storage.getDiscoverableProfiles(userId, limit);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching discoverable profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  // Like/Match routes
  app.post('/api/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const { toUserId, isLike } = insertLikeSchema.parse({
        fromUserId: userId,
        toUserId: req.body.toUserId,
        isLike: req.body.isLike,
      });

      const like = await storage.createLike({ fromUserId: userId, toUserId, isLike });
      
      let match = null;
      if (isLike) {
        const isMutual = await storage.checkMutualLike(userId, toUserId);
        if (isMutual) {
          // Create match with consistent ordering (smaller ID first)
          const user1Id = userId < toUserId ? userId : toUserId;
          const user2Id = userId < toUserId ? toUserId : userId;
          match = await storage.createMatch({ user1Id, user2Id });
        }
      }

      res.json({ like, match });
    } catch (error) {
      console.error("Error creating like:", error);
      res.status(500).json({ message: "Failed to process like" });
    }
  });

  // Match routes
  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Message routes
  app.get('/api/matches/:matchId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const messages = await storage.getMatchMessages(matchId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/matches/:matchId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const matchId = parseInt(req.params.matchId);
      
      const messageData = insertMessageSchema.parse({
        matchId,
        senderId: userId,
        content: req.body.content,
        messageType: req.body.messageType || "text",
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Gift routes
  const giftValues = {
    coffee: "2.50",
    rose: "5.00",
    chocolate: "7.50",
    diamond: "15.00",
    surprise: "10.00",
    champagne: "25.00",
    superlike: "7.50",
  };

  app.post('/api/gifts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const { toUserId, giftType, messageId } = req.body;
      
      const value = giftValues[giftType as keyof typeof giftValues];
      if (!value) {
        return res.status(400).json({ message: "Invalid gift type" });
      }

      const giftData = insertGiftSchema.parse({
        fromUserId: userId,
        toUserId,
        giftType,
        value,
        messageId: messageId || null,
      });

      const gift = await storage.createGift(giftData);
      res.json(gift);
    } catch (error) {
      console.error("Error creating gift:", error);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  // Balance routes
  app.get('/api/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const balance = await storage.getBalance(userId);
      res.json(balance || { amount: "0.00", totalEarned: "0.00" });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedUsers = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          userId = data.userId;
          if (userId) {
            connectedUsers.set(userId, ws);
            console.log(`User ${userId} connected to WebSocket`);
          }
        } else if (data.type === 'message' && userId) {
          // Broadcast message to the recipient if they're online
          const recipientWs = connectedUsers.get(data.recipientId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(JSON.stringify({
              type: 'new_message',
              message: data.message,
              senderId: userId,
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    });
  });

  return httpServer;
}
