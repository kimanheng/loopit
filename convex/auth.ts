import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, verifyPassword } from "./lib/password";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Sign up a new customer
 */
export const signUpCustomer = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (existing) {
      throw new Error("An account already exists with this phone number");
    }

    const passwordHash = await hashPassword(args.password);

    // Create user profile with auth fields
    const userId = await ctx.db.insert("users", {
      phoneNumber: args.phoneNumber,
      passwordHash,
      isVerified: false,
      isActive: true,
      failedLoginAttempts: 0,
      name: args.name,
      preferredLanguage: args.preferredLanguage || "en",
      createdAt: now,
      updatedAt: now,
    });

    return {
      userId,
      success: true
    };
  },
});

/**
 * Sign up a new merchant
 */
export const signUpMerchant = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if merchant already exists
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (existing) {
      throw new Error("A merchant account already exists with this phone number");
    }

    const passwordHash = await hashPassword(args.password);

    // Create merchant profile with auth fields
    const merchantId = await ctx.db.insert("merchants", {
      phoneNumber: args.phoneNumber,
      passwordHash,
      isVerified: false,
      isActive: true,
      failedLoginAttempts: 0,
      name: args.name,
      preferredLanguage: args.preferredLanguage || "en",
      createdAt: now,
      updatedAt: now,
    });

    return {
      merchantId,
      success: true
    };
  },
});

/**
 * Sign in as a customer
 */
export const signInCustomer = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!user || !user.isActive) {
      throw new Error("Invalid phone number or password");
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      throw new Error("Account is locked");
    }

    const isValid = await verifyPassword(args.password, user.passwordHash);

    if (!isValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newAttempts, updatedAt: now };
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      await ctx.db.patch(user._id, updates);
      throw new Error("Invalid phone number or password");
    }

    await ctx.db.patch(user._id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: now,
      lastLoginIp: args.ipAddress,
      updatedAt: now,
    });

    return {
      userId: user._id,
      profile: {
        name: user.name,
        phoneNumber: user.phoneNumber,
      },
    };
  },
});

/**
 * Sign in as a merchant
 */
export const signInMerchant = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!merchant || !merchant.isActive) {
      throw new Error("Invalid phone number or password");
    }

    if (merchant.lockedUntil && merchant.lockedUntil > now) {
      throw new Error("Account is locked");
    }

    const isValid = await verifyPassword(args.password, merchant.passwordHash);

    if (!isValid) {
      const newAttempts = merchant.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newAttempts, updatedAt: now };
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      await ctx.db.patch(merchant._id, updates);
      throw new Error("Invalid phone number or password");
    }

    await ctx.db.patch(merchant._id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: now,
      lastLoginIp: args.ipAddress,
      updatedAt: now,
    });

    return {
      merchantId: merchant._id,
      profile: {
        name: merchant.name,
        phoneNumber: merchant.phoneNumber,
      },
    };
  },
});

/**
 * Check if a customer account exists by phone number
 */
export const checkAccount = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();
    return !!user;
  },
});

/**
 * Generic check if phone exists
 */
export const checkPhoneNumberExists = query({
  args: { phoneNumber: v.string(), type: v.string() }, // 'customer' | 'merchant'
  handler: async (ctx, args) => {
    if (args.type === "customer") {
      const user = await ctx.db
        .query("users")
        .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
        .unique();
      return !!user;
    } else {
      const merchant = await ctx.db
        .query("merchants")
        .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
        .unique();
      return !!merchant;
    }
  },
});
