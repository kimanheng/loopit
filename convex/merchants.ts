import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Merchant Profile Management Functions
 */

/**
 * Get merchant by ID
 */
export const getMerchant = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) {
      return null;
    }
    return merchant;
  },
});

/**
 * Get merchant by phone number
 */
export const getMerchantByPhoneNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!merchant) {
      return null;
    }
    return merchant;
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const { merchantId, ...updateFields } = args;
    const cleanFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        cleanFields[key] = value;
      }
    }
    cleanFields.updatedAt = now;

    await ctx.db.patch(merchantId, cleanFields);

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
    if (!merchant) throw new Error("Merchant not found");

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
