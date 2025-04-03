import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderItem } from '../types';

interface OrderState {
  orders: Order[];
  pendingOrders: Order[];
  dailySalesBackup: Order[];
  addOrder: (order: Order) => void;
  addPendingOrder: (order: Order) => void;
  removePendingOrder: (orderId: string) => void;
  getPendingOrderById: (orderId: string) => Order | undefined;
  getOrders: () => Order[];
  getCompletedOrders: () => Order[];
  getPendingOrders: () => Order[];
  resetDailySales: () => void;
  revertDailySales: () => void;
  getTotalRevenue: () => number;
  getOrderCount: () => number;
  getTodaySales: () => number;
  getOrdersByDay: (date: Date) => Order[];
}

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Initial empty orders array
const initialOrders: Order[] = [];
const initialPendingOrders: Order[] = [];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: initialOrders,
      pendingOrders: initialPendingOrders,
      dailySalesBackup: [],

      addOrder: (order) => {
        // Add ID if not provided
        const newOrder = order.id ? order : { ...order, id: generateId() };
        
        set((state) => ({
          orders: [...state.orders, newOrder],
        }));
      },
      
      addPendingOrder: (order) => {
        // Add ID if not provided
        const newOrder = order.id ? order : { ...order, id: generateId() };
        
        set((state) => ({
          pendingOrders: [...state.pendingOrders, newOrder],
        }));
      },
      
      removePendingOrder: (orderId) => {
        set((state) => ({
          pendingOrders: state.pendingOrders.filter(order => order.id !== orderId),
        }));
      },
      
      getPendingOrderById: (orderId) => {
        return get().pendingOrders.find(order => order.id === orderId);
      },

      getOrders: () => {
        return get().orders;
      },

      getCompletedOrders: () => {
        return get().orders.filter(order => order.status === 'completed');
      },

      getPendingOrders: () => {
        return get().pendingOrders;
      },

      getTodaySales: () => {
        const today = new Date().toLocaleDateString();
        return get().orders
          .filter(order => new Date(order.createdAt).toLocaleDateString() === today)
          .reduce((sum, order) => sum + order.total, 0);
      },

      getOrdersByDay: (date: Date) => {
        const targetDate = date.toLocaleDateString();
        return get().orders.filter(order => 
          new Date(order.createdAt).toLocaleDateString() === targetDate
        );
      },

      resetDailySales: () => {
        // Get today's orders only
        const today = new Date().toLocaleDateString();
        const todaysOrders = get().orders.filter(order => {
          const orderDate = new Date(order.createdAt).toLocaleDateString();
          return orderDate === today;
        });

        // Save backup of today's orders
        set((state) => ({
          dailySalesBackup: todaysOrders,
        }));

        // Remove today's orders from the list
        set((state) => ({
          orders: state.orders.filter(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            return orderDate !== today;
          }),
        }));
      },

      revertDailySales: () => {
        // Combine existing orders with the backed up orders
        set((state) => ({
          orders: [...state.orders, ...state.dailySalesBackup],
          dailySalesBackup: [],
        }));
      },

      getTotalRevenue: () => {
        return get().orders.reduce((total, order) => total + order.total, 0);
      },

      getOrderCount: () => {
        return get().orders.length;
      },
    }),
    {
      name: 'order-storage',
    }
  )
); 