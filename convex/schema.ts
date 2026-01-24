import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * GDPR-Compliant, Role-Based Schema for LoopIt
 * 
 * Security Features:
 * - Separate accounts table for authentication (isolated from personal data)
 * - Password hashing required (never store plain text)
 * - Role-based access control (RBAC)
 * - Audit logging for data access
 * - GDPR consent tracking
 * - Data deletion/anonymization support
 * - Session management
 */

export default defineSchema({
  // ============================================
  // AUTHENTICATION & SECURITY
  // ============================================
  
  /**
   * Accounts: Authentication credentials only
   * Separated from user profile for security (credential isolation)
   * GDPR: Contains minimal data needed for authentication
   */
  accounts: defineTable({
    phoneNumber: v.string(),
    passwordHash: v.string(), // NEVER store plain text passwords
    isVerified: v.boolean(),
    isActive: v.boolean(),
    failedLoginAttempts: v.number(),
    lockedUntil: v.optional(v.number()), // Unix timestamp
    lastLoginAt: v.optional(v.number()), // Unix timestamp
    lastLoginIp: v.optional(v.string()), // For security auditing
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_phoneNumber", ["phoneNumber"])
    .index("by_isActive", ["isActive"]),

  /**
   * Sessions: Track active user sessions
   * Enables session invalidation and multi-device management
   */
  sessions: defineTable({
    accountId: v.id("accounts"),
    token: v.string(), // Secure session token (hashed)
    deviceInfo: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    expiresAt: v.number(), // Unix timestamp
    createdAt: v.number(),
    isRevoked: v.boolean(),
  })
    .index("by_accountId", ["accountId"])
    .index("by_token", ["token"])
    .index("by_expiresAt", ["expiresAt"]),

  // ============================================
  // ROLES & PERMISSIONS (RBAC)
  // ============================================

  /**
   * Roles: Define available roles in the system
   * Examples: customer, merchant, admin, support
   */
  roles: defineTable({
    name: v.string(), // 'customer' | 'merchant' | 'admin' | 'support'
    displayName: v.string(), // Localized display name
    description: v.optional(v.string()),
    permissions: v.array(v.string()), // ['read:stores', 'write:orders', etc.]
    isSystem: v.boolean(), // System roles cannot be deleted
    createdAt: v.number(),
  })
    .index("by_name", ["name"]),

  /**
   * AccountRoles: Many-to-many relationship between accounts and roles
   * An account can have multiple roles
   */
  accountRoles: defineTable({
    accountId: v.id("accounts"),
    roleId: v.id("roles"),
    grantedBy: v.optional(v.id("accounts")), // Who granted this role
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration for temporary roles
  })
    .index("by_accountId", ["accountId"])
    .index("by_roleId", ["roleId"])
    .index("by_accountId_and_roleId", ["accountId", "roleId"]),

  // ============================================
  // USER PROFILE DATA
  // ============================================

  /**
   * Users: Personal profile information
   * GDPR: This is the main PII (Personally Identifiable Information) table
   * Can be anonymized while keeping account for order history
   */
  users: defineTable({
    accountId: v.id("accounts"), // Link to authentication
    name: v.optional(v.string()),
    email: v.optional(v.string()), // Optional for notifications
    preferredLanguage: v.string(), // 'en' | 'km' | 'zh'
    avatarStorageId: v.optional(v.id("_storage")),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.id("users")),
    // GDPR Compliance Fields
    isAnonymized: v.boolean(), // True if user requested data deletion
    anonymizedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_accountId", ["accountId"])
    .index("by_referralCode", ["referralCode"])
    .index("by_email", ["email"]),

  // ============================================
  // GDPR COMPLIANCE
  // ============================================

  /**
   * GdprConsent: Track user consent for various data processing activities
   * GDPR Article 7: Conditions for consent
   */
  gdprConsent: defineTable({
    userId: v.id("users"),
    consentType: v.string(), // 'marketing' | 'analytics' | 'thirdParty' | 'terms' | 'privacy'
    granted: v.boolean(),
    grantedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    version: v.string(), // Version of terms/policy consented to
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "consentType"]),

  /**
   * DataExportRequests: GDPR Article 20 - Right to data portability
   * Track requests for data export
   */
  dataExportRequests: defineTable({
    userId: v.id("users"),
    status: v.string(), // 'pending' | 'processing' | 'completed' | 'failed'
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    exportFileId: v.optional(v.id("_storage")),
    expiresAt: v.optional(v.number()), // When the export file will be deleted
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  /**
   * DataDeletionRequests: GDPR Article 17 - Right to erasure
   * Track requests for data deletion
   */
  dataDeletionRequests: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    reason: v.optional(v.string()),
    status: v.string(), // 'pending' | 'processing' | 'completed' | 'rejected'
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
    processedBy: v.optional(v.id("accounts")), // Admin who processed
    retentionEndDate: v.optional(v.number()), // Some data must be retained for legal reasons
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  /**
   * AuditLogs: Track all significant data access and changes
   * GDPR: Demonstrates accountability and helps with breach reporting
   */
  auditLogs: defineTable({
    accountId: v.optional(v.id("accounts")), // Who performed the action (null for system)
    action: v.string(), // 'read' | 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout'
    resourceType: v.string(), // 'user' | 'order' | 'store' | 'account' | etc.
    resourceId: v.optional(v.string()), // ID of the affected resource
    details: v.optional(v.string()), // JSON string with additional details
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_accountId", ["accountId"])
    .index("by_resourceType", ["resourceType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

  // ============================================
  // MERCHANT PROFILES
  // ============================================

  /**
   * Merchants: Merchant profile information (separate from users table)
   * Merchants have their own profile table to keep customer and merchant data separate
   */
  merchants: defineTable({
    accountId: v.id("accounts"), // Link to authentication
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferredLanguage: v.string(), // 'en' | 'km' | 'zh'
    avatarStorageId: v.optional(v.id("_storage")),
    // GDPR Compliance Fields
    isAnonymized: v.boolean(),
    anonymizedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_accountId", ["accountId"])
    .index("by_email", ["email"]),

  // ============================================
  // BUSINESS DATA
  // ============================================

  /**
   * Stores: Merchant store information
   */
  stores: defineTable({
    ownerId: v.id("accounts"), // Changed to reference accounts table
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

  /**
   * Orders: Transaction records
   * Note: Orders are retained for legal/financial compliance even after user deletion
   * Personal data is anonymized but transaction record remains
   */
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
    // For anonymized users, we can null out the userId reference
    isAnonymized: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storeId", ["storeId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  /**
   * Favorites: User's favorite stores
   */
  favorites: defineTable({
    userId: v.id("users"),
    storeId: v.id("stores"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_storeId", ["userId", "storeId"]),
});
