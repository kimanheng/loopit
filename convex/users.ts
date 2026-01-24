import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Profile Management Functions
 */

/**
 * Get user by ID
 */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

/**
 * Get user by phone number
 */
export const getUserByPhoneNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!user) {
      return null;
    }
    return user;
  },
});

/**
 * Update user profile
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { userId, ...updateFields } = args;
    const cleanFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        cleanFields[key] = value;
      }
    }
    cleanFields.updatedAt = now;

    await ctx.db.patch(userId, cleanFields);

    return { success: true };
  },
});

/**
 * Update user avatar
 */
export const updateAvatar = mutation({
  args: {
    userId: v.id("users"),
    avatarStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }

    await ctx.db.patch(args.userId, {
      avatarStorageId: args.avatarStorageId,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Generate a unique referral code
 */
export const generateReferralCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.referralCode) return user.referralCode;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code: string;
    let isUnique = false;

    do {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const existing = await ctx.db
        .query("users")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
        .unique();
      isUnique = !existing;
    } while (!isUnique);

    await ctx.db.patch(args.userId, {
      referralCode: code,
      updatedAt: now,
    });

    return code;
  },
});

/**
 * Apply a referral code
 */
export const applyReferralCode = mutation({
  args: {
    userId: v.id("users"),
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.referredBy) throw new Error("Referral already used");

    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
      .unique();

    if (!referrer) throw new Error("Invalid referral code");
    if (referrer._id === args.userId) throw new Error("Cannot refer yourself");

    await ctx.db.patch(args.userId, {
      referredBy: referrer._id,
      updatedAt: now,
    });

    return { success: true, referrerName: referrer.name };
  },
});

/**
 * Get referral statistics
 */
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const referrals = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("referredBy"), args.userId))
      .collect();

    return {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
    };
  },
});

/**
 * Get avatar URL
 */
export const getAvatarUrl = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.avatarStorageId) return null;
    return await ctx.storage.getUrl(user.avatarStorageId);
  },
});
