import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  storeImage: string;
  pickupTime: string;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  price: number;
  originalPrice: number;
  items: number;
  code: string;
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  activeOrders: Order[];
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const activeOrders = orders.filter(o => o.status === 'active');

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
