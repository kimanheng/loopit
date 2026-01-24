import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Merchant Profile Management Functions
 * Separate from users table - merchants have their own profile table
 */

/**
 * Get merchant by account ID
 */
export const getMerchantByAccountId = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();

    if (!merchant || merchant.isAnonymized) {
      return null;
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      return null;
    }

    return {
      ...merchant,
      phoneNumber: account.phoneNumber,
      isVerified: account.isVerified,
    };
  },
});

/**
 * Get merchant by phone number (for lookup)
 */
export const getMerchantByPhoneNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!account) {
      return null;
    }

    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .unique();

    if (!merchant || merchant.isAnonymized) {
      return null;
    }

    return {
      ...merchant,
      phoneNumber: account.phoneNumber,
      isVerified: account.isVerified,
    };
  },
});

/**
 * Get merchant by ID
 */
export const getMerchant = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant || merchant.isAnonymized) {
      return null;
    }

    const account = await ctx.db.get(merchant.accountId);
    if (!account) {
      return null;
    }

    return {
      ...merchant,
      phoneNumber: account.phoneNumber,
      isVerified: account.isVerified,
    };
  },
});

/**
 * Update merchant profile
 */
export const updateMerchant = mutation({
  args: {
    merchantId: v.id("merchants"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    if (merchant.isAnonymized) {
      throw new Error("Cannot update anonymized merchant");
    }

    const { merchantId, ipAddress, userAgent, ...updateFields } = args;

    // Filter out undefined values
    const cleanFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        cleanFields[key] = value;
      }
    }
    cleanFields.updatedAt = now;

    await ctx.db.patch(merchantId, cleanFields);

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: merchant.accountId,
      action: "update",
      resourceType: "merchant",
      resourceId: merchantId,
      details: JSON.stringify(Object.keys(cleanFields)),
      ipAddress,
      userAgent,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Update merchant avatar
 */
export const updateAvatar = mutation({
  args: {
    merchantId: v.id("merchants"),
    avatarStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Delete old avatar if exists
    if (merchant.avatarStorageId) {
      await ctx.storage.delete(merchant.avatarStorageId);
    }

    await ctx.db.patch(args.merchantId, {
      avatarStorageId: args.avatarStorageId,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Get avatar URL for a merchant
 */
export const getAvatarUrl = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant || !merchant.avatarStorageId) {
      return null;
    }

    return await ctx.storage.getUrl(merchant.avatarStorageId);
  },
});
