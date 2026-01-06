import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to add URLs
const addUrls = async (ctx: any, store: any) => {
    if (!store) return null;
    let image = undefined;
    let logo = undefined;
    if (store.imageStorageId) {
        image = await ctx.storage.getUrl(store.imageStorageId);
    }
    if (store.logoStorageId) {
        logo = await ctx.storage.getUrl(store.logoStorageId);
    }
    return {
        ...store,
        image: image ?? undefined,
        logo: logo ?? undefined,
    };
};

export const toggleFavorite = mutation({
  args: {
    userId: v.id("users"),
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId_and_storeId", (q) =>
        q.eq("userId", args.userId).eq("storeId", args.storeId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // Removed
    } else {
      await ctx.db.insert("favorites", {
        userId: args.userId,
        storeId: args.storeId,
      });
      return true; // Added
    }
  },
});

export const getFavorites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const storeIds = favorites.map((f) => f.storeId);

    // Fetch stores
    const stores = await Promise.all(storeIds.map((id) => ctx.db.get(id)));

    // Filter out nulls and resolve URLs
    const validStores = stores.filter((s) => s !== null);
    return await Promise.all(validStores.map(s => addUrls(ctx, s)));
  },
});
