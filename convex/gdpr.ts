import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * GDPR Compliance Functions
 * 
 * Implements:
 * - Article 7: Consent management
 * - Article 15: Right of access
 * - Article 17: Right to erasure
 * - Article 20: Right to data portability
 */

// ============================================
// CONSENT MANAGEMENT (Article 7)
// ============================================

/**
 * Record user consent for a specific purpose
 */
export const recordConsent = mutation({
  args: {
    userId: v.id("users"),
    consentType: v.string(), // 'marketing' | 'analytics' | 'thirdParty'
    granted: v.boolean(),
    version: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find existing consent record
    const existing = await ctx.db
      .query("gdprConsent")
      .withIndex("by_userId_and_type", (q) =>
        q.eq("userId", args.userId).eq("consentType", args.consentType)
      )
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        granted: args.granted,
        grantedAt: args.granted ? now : existing.grantedAt,
        revokedAt: args.granted ? undefined : now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        version: args.version,
      });
    } else {
      // Create new consent record
      await ctx.db.insert("gdprConsent", {
        userId: args.userId,
        consentType: args.consentType,
        granted: args.granted,
        grantedAt: args.granted ? now : undefined,
        revokedAt: args.granted ? undefined : now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        version: args.version,
      });
    }

    // Get user's account for audit log
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.insert("auditLogs", {
        accountId: user.accountId,
        action: args.granted ? "consent_granted" : "consent_revoked",
        resourceType: "consent",
        resourceId: args.userId,
        details: JSON.stringify({
          consentType: args.consentType,
          version: args.version,
        }),
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        timestamp: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get all consent records for a user
 */
export const getConsents = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gdprConsent")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Check if user has granted a specific consent
 */
export const hasConsent = query({
  args: {
    userId: v.id("users"),
    consentType: v.string(),
  },
  handler: async (ctx, args) => {
    const consent = await ctx.db
      .query("gdprConsent")
      .withIndex("by_userId_and_type", (q) =>
        q.eq("userId", args.userId).eq("consentType", args.consentType)
      )
      .unique();

    return consent?.granted ?? false;
  },
});

// ============================================
// RIGHT OF ACCESS (Article 15)
// ============================================

/**
 * Get all personal data for a user (data subject access request)
 */
export const getPersonalData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const account = await ctx.db.get(user.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Get all related data
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const consents = await ctx.db
      .query("gdprConsent")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const accountRoles = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId", (q) => q.eq("accountId", user.accountId))
      .collect();

    const roles = await Promise.all(
      accountRoles.map(async (ar) => {
        const role = await ctx.db.get(ar.roleId);
        return role?.name;
      })
    );

    return {
      profile: {
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
      account: {
        phoneNumber: account.phoneNumber,
        isVerified: account.isVerified,
        createdAt: account.createdAt,
        lastLoginAt: account.lastLoginAt,
      },
      roles: roles.filter(Boolean),
      orders: orders.map((o) => ({
        storeName: o.storeName,
        date: o.date,
        status: o.status,
        price: o.price,
        items: o.items,
      })),
      favorites: favorites.length,
      consents: consents.map((c) => ({
        type: c.consentType,
        granted: c.granted,
        grantedAt: c.grantedAt,
        version: c.version,
      })),
    };
  },
});

// ============================================
// DATA PORTABILITY (Article 20)
// ============================================

/**
 * Request data export
 */
export const requestDataExport = mutation({
  args: {
    userId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing pending request
    const existingPending = await ctx.db
      .query("dataExportRequests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPending) {
      throw new Error("A data export request is already pending");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const requestId = await ctx.db.insert("dataExportRequests", {
      userId: args.userId,
      status: "pending",
      requestedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: user.accountId,
      action: "data_export_requested",
      resourceType: "dataExportRequest",
      resourceId: requestId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return { requestId };
  },
});

/**
 * Get data export request status
 */
export const getDataExportStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("dataExportRequests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    return requests;
  },
});

// ============================================
// RIGHT TO ERASURE (Article 17)
// ============================================

/**
 * Request account deletion
 */
export const requestDataDeletion = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check for existing pending request
    const existingPending = await ctx.db
      .query("dataDeletionRequests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingPending) {
      throw new Error("A deletion request is already pending");
    }

    const requestId = await ctx.db.insert("dataDeletionRequests", {
      userId: args.userId,
      accountId: user.accountId,
      reason: args.reason,
      status: "pending",
      requestedAt: now,
      // Legal retention period: 30 days grace period for potential reversal
      retentionEndDate: now + 30 * 24 * 60 * 60 * 1000,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: user.accountId,
      action: "data_deletion_requested",
      resourceType: "dataDeletionRequest",
      resourceId: requestId,
      details: JSON.stringify({ reason: args.reason }),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return { requestId };
  },
});

/**
 * Cancel a pending deletion request
 */
export const cancelDeletionRequest = mutation({
  args: {
    requestId: v.id("dataDeletionRequests"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be cancelled");
    }

    await ctx.db.patch(args.requestId, {
      status: "cancelled" as any, // Add cancelled to status types
      processedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: request.accountId,
      action: "data_deletion_cancelled",
      resourceType: "dataDeletionRequest",
      resourceId: args.requestId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Process deletion request (admin/system function)
 * Anonymizes user data instead of hard delete for order history integrity
 */
export const processDeletionRequest = mutation({
  args: {
    requestId: v.id("dataDeletionRequests"),
    processedBy: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Request is not pending");
    }

    // 1. Anonymize user profile
    await ctx.db.patch(request.userId, {
      name: "Deleted User",
      email: undefined,
      avatarStorageId: undefined,
      referralCode: undefined,
      isAnonymized: true,
      anonymizedAt: now,
      updatedAt: now,
    });

    // 2. Deactivate account
    await ctx.db.patch(request.accountId, {
      isActive: false,
      updatedAt: now,
    });

    // 3. Revoke all sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_accountId", (q) => q.eq("accountId", request.accountId))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { isRevoked: true });
    }

    // 4. Delete favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", request.userId))
      .collect();

    for (const fav of favorites) {
      await ctx.db.delete(fav._id);
    }

    // 5. Mark orders as anonymized (keep for business records)
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", request.userId))
      .collect();

    for (const order of orders) {
      await ctx.db.patch(order._id, { isAnonymized: true });
    }

    // 6. Update deletion request status
    await ctx.db.patch(args.requestId, {
      status: "completed",
      processedAt: now,
      processedBy: args.processedBy,
    });

    // 7. Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.processedBy,
      action: "data_deletion_completed",
      resourceType: "dataDeletionRequest",
      resourceId: args.requestId,
      details: JSON.stringify({
        userId: request.userId,
        accountId: request.accountId,
      }),
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Get deletion request status
 */
export const getDeletionRequestStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("dataDeletionRequests")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    return request;
  },
});
