
export type Category = 'Grains & Staples' | 'Vegetables & Spices' | 'Oils & Condiments' | 'Proteins' | 'Eggs & Others';
export type Unit = 'Kongo' | 'Portion' | 'Bag' | '5L-Bottle' | '10L-Bottle' | 'Kg' | 'Crate' | 'Carton';

export interface Product {
  id: string;
  name: string;
  category: Category;
  supportedUnits: Unit[];
  pricePerUnit: Record<string, number>; // Maps Unit to Price
  stock: number;
  adjustable: boolean;
  imageUrl?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  selectedUnit: Unit;
  quantity: number;
  priceAtOrder: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'buyer';
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: CartItem[];
  total: number;
  status: 'interest' | 'paid' | 'verified' | 'delivered';
  receiptUrl?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: 'initiated' | 'success' | 'failed';
  reference: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'payment' | 'order' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
}
