import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, verifyPassword, generateSecureToken } from "./lib/password";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Sign up a new account with role assignment
 * Creates both account and user profile
 */
export const signUp = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    role: v.string(), // 'customer' | 'merchant'
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if account already exists
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (existing) {
      throw new Error("An account already exists with this phone number");
    }

    // Hash password securely
    const passwordHash = await hashPassword(args.password);

    // Create account (authentication data)
    const accountId = await ctx.db.insert("accounts", {
      phoneNumber: args.phoneNumber,
      passwordHash,
      isVerified: false,
      isActive: true,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create profile based on role
    let profileId: string;
    
    if (args.role === 'merchant') {
      // Create merchant profile (separate from users)
      const merchantId = await ctx.db.insert("merchants", {
        accountId,
        name: args.name,
        preferredLanguage: args.preferredLanguage || "en",
        isAnonymized: false,
        createdAt: now,
        updatedAt: now,
      });
      profileId = merchantId;
    } else {
      // Create user profile for customers
      const userId = await ctx.db.insert("users", {
        accountId,
        name: args.name,
        preferredLanguage: args.preferredLanguage || "en",
        isAnonymized: false,
        createdAt: now,
        updatedAt: now,
      });
      profileId = userId;

      // Record GDPR consent for customers only (uses userId)
      await ctx.db.insert("gdprConsent", {
        userId,
        consentType: "terms",
        granted: true,
        grantedAt: now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        version: "1.0",
      });

      await ctx.db.insert("gdprConsent", {
        userId,
        consentType: "privacy",
        granted: true,
        grantedAt: now,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        version: "1.0",
      });
    }

    // Find and assign the requested role
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.role))
      .unique();

    if (role) {
      await ctx.db.insert("accountRoles", {
        accountId,
        roleId: role._id,
        grantedAt: now,
      });
    }

    // Create session
    const sessionToken = generateSecureToken();
    await ctx.db.insert("sessions", {
      accountId,
      token: sessionToken,
      deviceInfo: args.userAgent,
      ipAddress: args.ipAddress,
      expiresAt: now + SESSION_DURATION_MS,
      createdAt: now,
      isRevoked: false,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId,
      action: "create",
      resourceType: "account",
      resourceId: accountId,
      details: JSON.stringify({ role: args.role }),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return {
      accountId,
      profileId,
      sessionToken,
      role: args.role,
    };
  },
});

/**
 * Sign in with phone number and password
 * Implements rate limiting and account lockout
 */
export const signIn = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find account
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!account) {
      // Don't reveal whether account exists
      throw new Error("Invalid phone number or password");
    }

    // Check if account is locked
    if (account.lockedUntil && account.lockedUntil > now) {
      const remainingMinutes = Math.ceil((account.lockedUntil - now) / 60000);
      throw new Error(`Account is locked. Try again in ${remainingMinutes} minutes.`);
    }

    // Check if account is active
    if (!account.isActive) {
      throw new Error("This account has been deactivated");
    }

    // Verify password
    const isValid = await verifyPassword(args.password, account.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = account.failedLoginAttempts + 1;
      const updates: any = {
        failedLoginAttempts: newAttempts,
        updatedAt: now,
      };

      // Lock account if too many attempts
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = now + LOCKOUT_DURATION_MS;
      }

      await ctx.db.patch(account._id, updates);

      // Audit log failed attempt
      await ctx.db.insert("auditLogs", {
        accountId: account._id,
        action: "login_failed",
        resourceType: "account",
        resourceId: account._id,
        details: JSON.stringify({ attempts: newAttempts }),
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        timestamp: now,
      });

      throw new Error("Invalid phone number or password");
    }

    // Successful login - reset failed attempts
    await ctx.db.patch(account._id, {
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      lastLoginAt: now,
      lastLoginIp: args.ipAddress,
      updatedAt: now,
    });

    // Get profile - check users table first, then merchants table
    const user = await ctx.db
      .query("users")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .unique();

    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .unique();

    const profile = user || merchant;
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Get roles
    const accountRoles = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .collect();

    const roles = await Promise.all(
      accountRoles.map(async (ar) => {
        const role = await ctx.db.get(ar.roleId);
        return role?.name;
      })
    );

    // Create new session
    const sessionToken = generateSecureToken();
    await ctx.db.insert("sessions", {
      accountId: account._id,
      token: sessionToken,
      deviceInfo: args.userAgent,
      ipAddress: args.ipAddress,
      expiresAt: now + SESSION_DURATION_MS,
      createdAt: now,
      isRevoked: false,
    });

    // Audit log successful login
    await ctx.db.insert("auditLogs", {
      accountId: account._id,
      action: "login",
      resourceType: "account",
      resourceId: account._id,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return {
      accountId: account._id,
      profileId: profile._id,
      sessionToken,
      profile: {
        name: profile.name,
        preferredLanguage: profile.preferredLanguage,
        phoneNumber: account.phoneNumber,
      },
      roles: roles.filter(Boolean),
      isMerchant: !!merchant,
    };
  },
});

/**
 * Sign out and revoke session
 */
export const signOut = mutation({
  args: {
    sessionToken: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();

    if (session) {
      await ctx.db.patch(session._id, { isRevoked: true });

      // Audit log
      await ctx.db.insert("auditLogs", {
        accountId: session.accountId,
        action: "logout",
        resourceType: "session",
        resourceId: session._id,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        timestamp: now,
      });
    }

    return { success: true };
  },
});

/**
 * Validate a session token
 */
export const validateSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();

    if (!session) {
      return null;
    }

    if (session.isRevoked || session.expiresAt < now) {
      return null;
    }

    const account = await ctx.db.get(session.accountId);
    if (!account || !account.isActive) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .unique();

    if (!user || user.isAnonymized) {
      return null;
    }

    // Get roles
    const accountRoles = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .collect();

    const roles = await Promise.all(
      accountRoles.map(async (ar) => {
        const role = await ctx.db.get(ar.roleId);
        return role;
      })
    );

    return {
      accountId: account._id,
      userId: user._id,
      user: {
        name: user.name,
        preferredLanguage: user.preferredLanguage,
        phoneNumber: account.phoneNumber,
      },
      roles: roles.filter(Boolean),
    };
  },
});

/**
 * Revoke all sessions for an account (logout everywhere)
 */
export const revokeAllSessions = mutation({
  args: {
    accountId: v.id("accounts"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .collect();

    for (const session of sessions) {
      if (!session.isRevoked) {
        await ctx.db.patch(session._id, { isRevoked: true });
      }
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.accountId,
      action: "revoke_all_sessions",
      resourceType: "account",
      resourceId: args.accountId,
      details: JSON.stringify({ count: sessions.length }),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return { revokedCount: sessions.length };
  },
});

/**
 * Change password
 */
export const changePassword = mutation({
  args: {
    accountId: v.id("accounts"),
    currentPassword: v.string(),
    newPassword: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify current password
    const isValid = await verifyPassword(args.currentPassword, account.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(account._id, {
      passwordHash,
      updatedAt: now,
    });

    // Revoke all existing sessions for security
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { isRevoked: true });
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: account._id,
      action: "password_change",
      resourceType: "account",
      resourceId: account._id,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Check if user has a specific permission
 */
export const hasPermission = query({
  args: {
    accountId: v.id("accounts"),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const accountRoles = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .collect();

    for (const ar of accountRoles) {
      // Check if role has expired
      if (ar.expiresAt && ar.expiresAt < Date.now()) {
        continue;
      }

      const role = await ctx.db.get(ar.roleId);
      if (role && role.permissions.includes(args.permission)) {
        return true;
      }
    }

    return false;
  },
});

/**
 * Check if user has a specific role
 */
export const hasRole = query({
  args: {
    accountId: v.id("accounts"),
    roleName: v.string(),
  },
  handler: async (ctx, args) => {
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .unique();

    if (!role) {
      return false;
    }

    const accountRole = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId_and_roleId", (q) =>
        q.eq("accountId", args.accountId).eq("roleId", role._id)
      )
      .unique();

    if (!accountRole) {
      return false;
    }

    // Check if expired
    if (accountRole.expiresAt && accountRole.expiresAt < Date.now()) {
      return false;
    }

    return true;
  },
});

/**
 * Check if account exists by phone number
 * Used for authentication flow to determine if user should sign in or sign up
 */
export const checkAccount = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    return !!account;
  },
});
