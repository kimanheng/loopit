import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Profile Management Functions
 * Works with the new separated account/user schema
 */

/**
 * Get user profile by account ID
 */
export const getUserByAccountId = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();

    if (!user || user.isAnonymized) {
      return null;
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      return null;
    }

    return {
      ...user,
      phoneNumber: account.phoneNumber,
      isVerified: account.isVerified,
    };
  },
});

/**
 * Get user by ID
 */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isAnonymized) {
      return null;
    }

    const account = await ctx.db.get(user.accountId);
    if (!account) {
      return null;
    }

    return {
      ...user,
      phoneNumber: account.phoneNumber,
      isVerified: account.isVerified,
    };
  },
});

/**
 * Get user by phone number (for lookup)
 */
export const getUserByPhoneNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!account) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .unique();

    if (!user || user.isAnonymized) {
      return null;
    }

    return {
      ...user,
      phoneNumber: account.phoneNumber,
      isVerified: account.isVerified,
    };
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
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isAnonymized) {
      throw new Error("Cannot update anonymized user");
    }

    const { userId, ipAddress, userAgent, ...updateFields } = args;

    // Filter out undefined values
    const cleanFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        cleanFields[key] = value;
      }
    }
    cleanFields.updatedAt = now;

    await ctx.db.patch(userId, cleanFields);

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: user.accountId,
      action: "update",
      resourceType: "user",
      resourceId: userId,
      details: JSON.stringify(Object.keys(cleanFields)),
      ipAddress,
      userAgent,
      timestamp: now,
    });

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
    if (!user) {
      throw new Error("User not found");
    }

    // Delete old avatar if exists
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
 * Generate a unique referral code for the user
 */
export const generateReferralCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate a unique referral code
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code: string;
    let isUnique = false;

    do {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if code already exists
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
    if (!user) {
      throw new Error("User not found");
    }

    if (user.referredBy) {
      throw new Error("You have already used a referral code");
    }

    // Find the referrer
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
      .unique();

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    if (referrer._id === args.userId) {
      throw new Error("You cannot use your own referral code");
    }

    await ctx.db.patch(args.userId, {
      referredBy: referrer._id,
      updatedAt: now,
    });

    return { success: true, referrerName: referrer.name };
  },
});

/**
 * Get referral statistics for a user
 */
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Count users who were referred by this user
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
 * Get avatar URL for a user
 */
export const getAvatarUrl = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.avatarStorageId) {
      return null;
    }

    return await ctx.storage.getUrl(user.avatarStorageId);
  },
});
