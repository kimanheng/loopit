import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phoneNumber: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    userType: v.string(), // 'consumer' | 'business'
    hasBusinessAccount: v.boolean(),
  }).index("by_phoneNumber", ["phoneNumber"]),

  stores: defineTable({
    ownerId: v.string(), 
    name: v.string(),
    rating: v.number(),
    pickupTime: v.string(),
    price: v.number(),
    originalPrice: v.number(),
    itemsLeft: v.number(),
    category: v.string(),
    isActive: v.optional(v.boolean()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    plusCode: v.optional(v.string()),
    locationDescription: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    logoStorageId: v.optional(v.id("_storage")),
  }).index("by_ownerId", ["ownerId"]),

  orders: defineTable({
    userId: v.id("users"),
    storeId: v.id("stores"),
    storeName: v.string(),
    pickupTime: v.string(),
    date: v.string(),
    status: v.string(), // 'active' | 'completed' | 'cancelled'
    price: v.number(),
    originalPrice: v.number(),
    items: v.number(),
    code: v.string(),
    // Temporarily allowing storeImage for cleanup
    storeImage: v.optional(v.string()),
  })
  .index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"]),

  favorites: defineTable({
    userId: v.id("users"),
    storeId: v.id("stores"),
  })
  .index("by_userId", ["userId"])
  .index("by_userId_and_storeId", ["userId", "storeId"]),
});