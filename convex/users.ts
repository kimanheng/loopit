import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();
    if (!user) return null;
    // Don't return password to the client
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

export const signUp = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
    userType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (existing) {
      throw new Error("User already exists with this phone number");
    }

    const userId = await ctx.db.insert("users", {
      phoneNumber: args.phoneNumber,
      password: args.password, // In production, hash this!
      userType: args.userType,
      hasBusinessAccount: false,
    });

    return userId;
  },
});

export const signIn = mutation({
  args: {
    phoneNumber: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .unique();

    if (!user || user.password !== args.password) {
      throw new Error("Invalid phone number or password");
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    userType: v.optional(v.string()),
    hasBusinessAccount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const cleanupData = mutation({
  args: {},
  handler: async (ctx: any) => {
    const stores = await ctx.db.query("stores").collect();
    for (const store of stores) {
      const { image, logo, distance, ...rest }: any = store;
      if (image !== undefined || logo !== undefined || distance !== undefined) {
          await ctx.db.replace(store._id, rest);
      }
    }

    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      const { storeImage, ...rest }: any = order;
      if (storeImage !== undefined) {
          await ctx.db.replace(order._id, rest);
      }
    }
  },
});
