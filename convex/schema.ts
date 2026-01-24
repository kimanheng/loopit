import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Simplified Schema for LoopIt
 * 
 * Security Features:
 * - Separate users and merchants tables for authentication (full isolation)
 * - Allows same phone number to exist in both tables without conflict
 */

export default defineSchema({
  // ============================================
  // USER DATA & AUTHENTICATION (CUSTOMERS)
  // ============================================

  users: defineTable({
    // Authentication fields
    phoneNumber: v.string(),
    passwordHash: v.string(),
    isVerified: v.boolean(),
    isActive: v.boolean(),
    failedLoginAttempts: v.number(),
    lockedUntil: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    lastLoginIp: v.optional(v.string()),
    
    // Profile fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.string(), // 'en' | 'km' | 'zh'
    avatarStorageId: v.optional(v.id("_storage")),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.id("users")),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phoneNumber", ["phoneNumber"])
    .index("by_isActive", ["isActive"])
    .index("by_referralCode", ["referralCode"]),

  // ============================================
  // MERCHANT DATA & AUTHENTICATION
  // ============================================

  merchants: defineTable({
    // Authentication fields
    phoneNumber: v.string(),
    passwordHash: v.string(),
    isVerified: v.boolean(),
    isActive: v.boolean(),
    failedLoginAttempts: v.number(),
    lockedUntil: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    lastLoginIp: v.optional(v.string()),

    // Profile fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.string(), // 'en' | 'km' | 'zh'
    avatarStorageId: v.optional(v.id("_storage")),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phoneNumber", ["phoneNumber"])
    .index("by_isActive", ["isActive"]),

  // ============================================
  // BUSINESS DATA
  // ============================================

  stores: defineTable({
    ownerId: v.id("merchants"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_category", ["category"])
    .index("by_isActive", ["isActive"]),

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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  favorites: defineTable({
    userId: v.id("users"),
    storeId: v.id("stores"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_storeId", ["userId", "storeId"]),
});
