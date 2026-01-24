import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Role-Based Access Control (RBAC) Functions
 */

// ============================================
// ROLE MANAGEMENT
// ============================================

/**
 * Initialize default system roles
 * Should be called once during system setup
 */
export const initializeRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaultRoles = [
      {
        name: "customer",
        displayName: "Customer",
        description: "Regular customer who can browse stores and place orders",
        permissions: [
          "read:stores",
          "read:orders",
          "write:orders",
          "read:favorites",
          "write:favorites",
          "read:profile",
          "write:profile",
        ],
        isSystem: true,
      },
      {
        name: "merchant",
        displayName: "Merchant",
        description: "Store owner who can manage their store and view orders",
        permissions: [
          "read:stores",
          "write:stores",
          "read:orders",
          "update:orders",
          "read:analytics",
          "read:profile",
          "write:profile",
        ],
        isSystem: true,
      },
      {
        name: "admin",
        displayName: "Administrator",
        description: "System administrator with full access",
        permissions: [
          "read:*",
          "write:*",
          "delete:*",
          "manage:users",
          "manage:roles",
          "view:auditLogs",
          "process:gdprRequests",
        ],
        isSystem: true,
      },
      {
        name: "support",
        displayName: "Support Agent",
        description: "Customer support with limited admin capabilities",
        permissions: [
          "read:stores",
          "read:orders",
          "update:orders",
          "read:users",
          "view:auditLogs",
        ],
        isSystem: true,
      },
    ];

    const results = [];

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", roleData.name))
        .unique();

      if (!existing) {
        const roleId = await ctx.db.insert("roles", {
          ...roleData,
          createdAt: now,
        });
        results.push({ name: roleData.name, created: true, id: roleId });
      } else {
        results.push({ name: roleData.name, created: false, id: existing._id });
      }
    }

    return results;
  },
});

/**
 * Get all roles
 */
export const listRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roles").collect();
  },
});

/**
 * Get role by name
 */
export const getRoleByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});

/**
 * Create a custom role
 */
export const createRole = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
    createdBy: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if role already exists
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("A role with this name already exists");
    }

    const roleId = await ctx.db.insert("roles", {
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      permissions: args.permissions,
      isSystem: false,
      createdAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.createdBy,
      action: "create",
      resourceType: "role",
      resourceId: roleId,
      details: JSON.stringify({ name: args.name, permissions: args.permissions }),
      timestamp: now,
    });

    return roleId;
  },
});

/**
 * Update role permissions
 */
export const updateRolePermissions = mutation({
  args: {
    roleId: v.id("roles"),
    permissions: v.array(v.string()),
    updatedBy: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem) {
      throw new Error("System roles cannot be modified");
    }

    await ctx.db.patch(args.roleId, { permissions: args.permissions });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.updatedBy,
      action: "update",
      resourceType: "role",
      resourceId: args.roleId,
      details: JSON.stringify({
        oldPermissions: role.permissions,
        newPermissions: args.permissions,
      }),
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Delete a custom role
 */
export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
    deletedBy: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem) {
      throw new Error("System roles cannot be deleted");
    }

    // Remove all account role assignments for this role
    const assignments = await ctx.db
      .query("accountRoles")
      .withIndex("by_roleId", (q) => q.eq("roleId", args.roleId))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(args.roleId);

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.deletedBy,
      action: "delete",
      resourceType: "role",
      resourceId: args.roleId,
      details: JSON.stringify({ roleName: role.name, assignmentsRemoved: assignments.length }),
      timestamp: now,
    });

    return { success: true };
  },
});

// ============================================
// ROLE ASSIGNMENT
// ============================================

/**
 * Assign a role to an account
 */
export const assignRole = mutation({
  args: {
    accountId: v.id("accounts"),
    roleName: v.string(),
    grantedBy: v.id("accounts"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .unique();

    if (!role) {
      throw new Error("Role not found");
    }

    // Check if already assigned
    const existing = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId_and_roleId", (q) =>
        q.eq("accountId", args.accountId).eq("roleId", role._id)
      )
      .unique();

    if (existing) {
      throw new Error("Role already assigned to this account");
    }

    const assignmentId = await ctx.db.insert("accountRoles", {
      accountId: args.accountId,
      roleId: role._id,
      grantedBy: args.grantedBy,
      grantedAt: now,
      expiresAt: args.expiresAt,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.grantedBy,
      action: "role_assigned",
      resourceType: "accountRole",
      resourceId: assignmentId,
      details: JSON.stringify({
        targetAccount: args.accountId,
        roleName: args.roleName,
        expiresAt: args.expiresAt,
      }),
      timestamp: now,
    });

    return assignmentId;
  },
});

/**
 * Remove a role from an account
 */
export const removeRole = mutation({
  args: {
    accountId: v.id("accounts"),
    roleName: v.string(),
    removedBy: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .unique();

    if (!role) {
      throw new Error("Role not found");
    }

    const assignment = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId_and_roleId", (q) =>
        q.eq("accountId", args.accountId).eq("roleId", role._id)
      )
      .unique();

    if (!assignment) {
      throw new Error("Role not assigned to this account");
    }

    await ctx.db.delete(assignment._id);

    // Audit log
    await ctx.db.insert("auditLogs", {
      accountId: args.removedBy,
      action: "role_removed",
      resourceType: "accountRole",
      resourceId: assignment._id,
      details: JSON.stringify({
        targetAccount: args.accountId,
        roleName: args.roleName,
      }),
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Get all roles for an account
 */
export const getAccountRoles = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const now = Date.now();

    const assignments = await ctx.db
      .query("accountRoles")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .collect();

    const roles = await Promise.all(
      assignments
        .filter((a) => !a.expiresAt || a.expiresAt > now)
        .map(async (a) => {
          const role = await ctx.db.get(a.roleId);
          return role
            ? {
                ...role,
                grantedAt: a.grantedAt,
                expiresAt: a.expiresAt,
              }
            : null;
        })
    );

    return roles.filter(Boolean);
  },
});

/**
 * Get all accounts with a specific role
 */
export const getAccountsByRole = query({
  args: { roleName: v.string() },
  handler: async (ctx, args) => {
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .unique();

    if (!role) {
      return [];
    }

    const assignments = await ctx.db
      .query("accountRoles")
      .withIndex("by_roleId", (q) => q.eq("roleId", role._id))
      .collect();

    const now = Date.now();
    const activeAssignments = assignments.filter(
      (a) => !a.expiresAt || a.expiresAt > now
    );

    const accounts = await Promise.all(
      activeAssignments.map(async (a) => {
        const account = await ctx.db.get(a.accountId);
        const user = await ctx.db
          .query("users")
          .withIndex("by_accountId", (q) => q.eq("accountId", a.accountId))
          .unique();

        return account && account.isActive
          ? {
              accountId: account._id,
              phoneNumber: account.phoneNumber,
              userName: user?.name,
              grantedAt: a.grantedAt,
            }
          : null;
      })
    );

    return accounts.filter(Boolean);
  },
});
