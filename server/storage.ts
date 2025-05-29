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
