import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let stores = await ctx.db.query("stores").collect();

    // Only show active stores for the list
    stores = stores.filter((store) => store.isActive === true);

    if (args.category && args.category !== "All") {
      stores = stores.filter((store) => store.category === args.category);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      stores = stores.filter((store) =>
        store.name.toLowerCase().includes(searchLower)
      );
    }

    // Resolve URLs and enrich
    const storesWithUrls = await Promise.all(
      stores.map(async (store) => {
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
      })
    );

    return storesWithUrls;
  },
});

export const get = query({
  args: { id: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.id);
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
  },
});

export const getMyStore = query({
  args: { ownerId: v.id("merchants") },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .unique();

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
  },
});

export const createStore = mutation({
  args: {
    ownerId: v.id("merchants"),
    name: v.string(),
    category: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    plusCode: v.string(),
    locationDescription: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const storeId = await ctx.db.insert("stores", {
      ownerId: args.ownerId,
      name: args.name,
      category: args.category,
      latitude: args.latitude,
      longitude: args.longitude,
      plusCode: args.plusCode,
      locationDescription: args.locationDescription,
      imageStorageId: args.imageStorageId,
      logoStorageId: args.logoStorageId,
      rating: 5.0, 
      pickupTime: "", // Empty by default
      price: 0,
      originalPrice: 0,
      itemsLeft: 0, 
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
    return storeId;
  },
});

export const updateBag = mutation({
  args: {
    storeId: v.id("stores"),
    itemsLeft: v.number(),
    price: v.number(),
    originalPrice: v.number(),
    pickupTime: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { storeId, ...fields } = args;
    
    if (fields.isActive) {
        const store = await ctx.db.get(storeId);
        if (!store) throw new Error("Store not found");

        const requiredFields = [
            store.name,
            store.category,
            store.latitude,
            store.longitude,
            store.plusCode,
            fields.itemsLeft,
            fields.price,
            fields.originalPrice,
            fields.pickupTime
        ];

        if (requiredFields.some(f => !f)) {
            throw new Error("Cannot activate listing: Missing required store details or bag information.");
        }
    }

    await ctx.db.patch(storeId, fields);
  },
});

export const updateStore = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    plusCode: v.optional(v.string()),
    locationDescription: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { storeId, ...fields } = args;
    // Filter out undefineds
    const patchData: any = {};
    if (fields.name) patchData.name = fields.name;
    if (fields.category) patchData.category = fields.category;
    if (fields.latitude !== undefined) patchData.latitude = fields.latitude;
    if (fields.longitude !== undefined) patchData.longitude = fields.longitude;
    if (fields.plusCode) patchData.plusCode = fields.plusCode;
    if (fields.locationDescription) patchData.locationDescription = fields.locationDescription;
    if (fields.imageStorageId) patchData.imageStorageId = fields.imageStorageId;
    if (fields.logoStorageId) patchData.logoStorageId = fields.logoStorageId;
    
    await ctx.db.patch(storeId, patchData);
  },
});
