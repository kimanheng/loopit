import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export interface Order {
  _id: string;
  userId: string;
  storeId: string;
  storeName: string;
  storeImage?: string | null;
  pickupTime: string;
  date: string;
  status: string;
  price: number;
  originalPrice: number;
  items: number;
  code: string;
}

interface CreateOrderData {
  storeId: string;
  storeName: string;
  storeImage?: string;
  pickupTime: string;
  price: number;
  originalPrice: number;
  items: number;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (orderData: CreateOrderData) => Promise<{ orderId: string; code: string } | null>;
  activeOrders: Order[];
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const ordersRaw = useQuery(api.orders.getUserOrders, user ? { userId: user._id as any } : "skip");
  const createOrderMutation = useMutation(api.orders.createOrder);

  const orders = (ordersRaw || []) as Order[];
  const activeOrders = orders.filter(o => o.status === 'active');

  const addOrder = async (orderData: CreateOrderData) => {
    if (!user) return null;
    
    try {
      const result = await createOrderMutation({
        userId: user._id as any,
        storeId: orderData.storeId as any,
        storeName: orderData.storeName,
        pickupTime: orderData.pickupTime,
        price: orderData.price,
        originalPrice: orderData.originalPrice,
        items: orderData.items,
      });
      return result; // { orderId, code }
    } catch (error) {
      console.error("Failed to create order:", error);
      return null;
    }
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder, activeOrders }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
