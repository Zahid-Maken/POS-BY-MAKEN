export interface User {
  username: string;
  role: 'admin' | 'cashier';
  password: string;
  recoveryQuestion?: string;
  recoveryAnswer?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sold: number;
  expiryDate: string;
  status: 'in-stock' | 'out-of-stock';
  unit?: string;
  unitRate?: number;
  discount?: number; // Individual product discount percentage
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalPurchases: number;
  lastPurchase: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
  unit?: string;
  unitRate?: number;
  discount?: number; // Applied discount percentage
}

export interface Order {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  universalDiscount?: number; // Separate field for universal discount
  items: OrderItem[];
  createdAt: string;
  status: 'pending' | 'completed';
  cashierId: string;
  customerId?: string;
  customerName?: string; // Customer name for the order
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  todaySales: number;
  todayVisitors: number;
  revenueChange: number;
  ordersChange: number;
  salesChange: number;
  visitorsChange: number;
}

export interface Settings {
  taxRate: number; // Default tax rate percentage
  universalDiscount: number; // Universal discount percentage applied to all products
}