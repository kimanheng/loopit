import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
  args: {
    userId: v.id("users"),
    storeId: v.id("stores"),
    storeName: v.string(),
    storeImage: v.optional(v.string()),
    pickupTime: v.string(),
    price: v.number(),
    originalPrice: v.number(),
    items: v.number(),
  },
  handler: async (ctx, args) => {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const date = new Date().toISOString();

    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      storeId: args.storeId,
      storeName: args.storeName,
      storeImage: args.storeImage,
      pickupTime: args.pickupTime,
      date,
      status: "active",
      price: args.price,
      originalPrice: args.originalPrice,
      items: args.items,
      code,
    });
    
    // Decrease items left in store
    const store = await ctx.db.get(args.storeId);
    if (store && store.itemsLeft > 0) {
        await ctx.db.patch(args.storeId, { itemsLeft: store.itemsLeft - args.items });
    }

    return { orderId, code };
  },
});

export const getUserOrders = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc") // Newest first
      .collect();
  },
});

export const getStoreOrders = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();

    // Enrich with user details
    const ordersWithUser = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          customer: user
            ? { name: user.name || "Unknown", phoneNumber: user.phoneNumber }
            : { name: "Unknown", phoneNumber: "" },
        };
      })
    );

    return ordersWithUser.sort((a, b) => {
        // Active orders first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        // Then by date
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  },
});

export const getStoreAnalytics = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const now = new Date();
    
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.price, 0);
    const totalValueSaved = completedOrders.reduce((sum, o) => sum + (o.originalPrice * o.items), 0);
    const itemsSaved = completedOrders.reduce((sum, o) => sum + o.items, 0);

    // Calculate revenue for the last 7 days
    const revenueByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      const dailyRevenue = completedOrders
        .filter(o => o.date.startsWith(dateString))
        .reduce((sum, o) => sum + o.price, 0);
      
      return {
        date: dateString,
        revenue: dailyRevenue
      };
    }).reverse();

    return {
      totalRevenue,
      totalValueSaved,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      activeOrders: orders.filter(o => o.status === 'active').length,
      itemsSaved,
      revenueByDay,
    };
  },
});

export const completeOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { status: "completed" });
  },
});

export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    await ctx.db.patch(args.orderId, { status: "cancelled" });

    // Return stock
    const store = await ctx.db.get(order.storeId);
    if (store) {
      await ctx.db.patch(order.storeId, { itemsLeft: store.itemsLeft + order.items });
    }
  },
});
