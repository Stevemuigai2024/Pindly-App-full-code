# Pindly Dating App - Server Code

## File: server/index.ts
```typescript
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  const start = Date.now();
  const oldSend = _res.send;
  _res.send = function(data) {
    _res.send = oldSend;
    if (_res.statusCode !== 200) {
      log(`${req.method} ${req.path} ${_res.statusCode} in ${Date.now() - start}ms :: ${data}`);
    }
    return oldSend.apply(this, [data]);
  };
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
```

## File: server/storage.ts
```typescript
import {
  users,
  profiles,
  matches,
  likes,
  messages,
  gifts,
  balances,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type Match,
  type InsertMatch,
  type Like,
  type InsertLike,
  type Message,
  type InsertMessage,
  type Gift,
  type InsertGift,
  type Balance,
  type InsertBalance,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, ne, notInArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile>;
  
  // Discovery operations
  getDiscoverableProfiles(userId: string, limit?: number): Promise<(Profile & { user: User })[]>;
  
  // Like/Match operations
  createLike(like: InsertLike): Promise<Like>;
  checkMutualLike(user1Id: string, user2Id: string): Promise<boolean>;
  createMatch(match: InsertMatch): Promise<Match>;
  getUserMatches(userId: string): Promise<(Match & { user1: User; user2: User; profile1: Profile; profile2: Profile })[]>;
  
  // Message operations
  getMatchMessages(matchId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Gift operations
  createGift(gift: InsertGift): Promise<Gift>;
  
  // Balance operations
  getBalance(userId: string): Promise<Balance | undefined>;
  updateBalance(userId: string, amount: string): Promise<Balance>;
  createBalance(balance: InsertBalance): Promise<Balance>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db
      .insert(profiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const [updatedProfile] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Discovery operations
  async getDiscoverableProfiles(userId: string, limit = 10): Promise<(Profile & { user: User })[]> {
    // Get users that the current user hasn't liked/passed on
    const likedUserIds = db
      .select({ userId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));

    const discoverableProfiles = await db
      .select({
        id: profiles.id,
        userId: profiles.userId,
        bio: profiles.bio,
        age: profiles.age,
        interests: profiles.interests,
        photos: profiles.photos,
        latitude: profiles.latitude,
        longitude: profiles.longitude,
        isVisible: profiles.isVisible,
        maxDistance: profiles.maxDistance,
        minAge: profiles.minAge,
        maxAge: profiles.maxAge,
        showMe: profiles.showMe,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(
        and(
          eq(profiles.isVisible, true),
          ne(profiles.userId, userId),
          notInArray(profiles.userId, likedUserIds)
        )
      )
      .limit(limit);

    return discoverableProfiles;
  }

  // Like/Match operations
  async createLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db
      .insert(likes)
      .values(like)
      .onConflictDoUpdate({
        target: [likes.fromUserId, likes.toUserId],
        set: { isLike: like.isLike },
      })
      .returning();
    return newLike;
  }

  async checkMutualLike(user1Id: string, user2Id: string): Promise<boolean> {
    const mutualLikes = await db
      .select()
      .from(likes)
      .where(
        and(
          or(
            and(eq(likes.fromUserId, user1Id), eq(likes.toUserId, user2Id)),
            and(eq(likes.fromUserId, user2Id), eq(likes.toUserId, user1Id))
          ),
          eq(likes.isLike, true)
        )
      );

    return mutualLikes.length === 2;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values(match)
      .returning();
    return newMatch;
  }

  async getUserMatches(userId: string): Promise<(Match & { user1: User; user2: User; profile1: Profile; profile2: Profile })[]> {
    const userMatches = await db
      .select({
        id: matches.id,
        user1Id: matches.user1Id,
        user2Id: matches.user2Id,
        createdAt: matches.createdAt,
        user1: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        user2: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        profile1: profiles,
        profile2: profiles,
      })
      .from(matches)
      .innerJoin(users, eq(matches.user1Id, users.id))
      .innerJoin(profiles, eq(matches.user1Id, profiles.userId))
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
      .orderBy(desc(matches.createdAt));

    return userMatches;
  }

  // Message operations
  async getMatchMessages(matchId: number): Promise<(Message & { sender: User })[]> {
    const matchMessages = await db
      .select({
        id: messages.id,
        matchId: messages.matchId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);

    return matchMessages;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Gift operations
  async createGift(gift: InsertGift): Promise<Gift> {
    const [newGift] = await db
      .insert(gifts)
      .values(gift)
      .returning();
    
    // Update recipient's balance
    await this.updateBalance(gift.toUserId, gift.value);
    
    return newGift;
  }

  // Balance operations
  async getBalance(userId: string): Promise<Balance | undefined> {
    const [balance] = await db
      .select()
      .from(balances)
      .where(eq(balances.userId, userId));
    return balance;
  }

  async updateBalance(userId: string, amount: string): Promise<Balance> {
    const existingBalance = await this.getBalance(userId);
    
    if (!existingBalance) {
      return this.createBalance({
        userId,
        amount,
        totalEarned: amount,
      });
    }

    const [updatedBalance] = await db
      .update(balances)
      .set({
        amount: sql`${balances.amount} + ${amount}`,
        totalEarned: sql`${balances.totalEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(balances.userId, userId))
      .returning();

    return updatedBalance;
  }

  async createBalance(balance: InsertBalance): Promise<Balance> {
    const [newBalance] = await db
      .insert(balances)
      .values(balance)
      .returning();
    return newBalance;
  }
}

export const storage = new DatabaseStorage();
```

## File: server/routes.ts
```typescript
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
```

Continue with authentication and client code in the next part...