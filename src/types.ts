export type UserRole = 'customer' | 'rider' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  addresses?: DeliveryAddress[];
  createdAt: string;
}

export interface DeliveryAddress {
  label: string;
  address: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // Price before discount
  costPrice: number; // What we pay the farmer/supplier
  category: string;
  imageUrl: string;
  stockLevel: number;
  unit: string;
  isFeatured: boolean;
  supplierId?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  costPrice: number; // Captured at time of order
}

export type OrderStatus = 'pending' | 'packing' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string; // Format: JZA+YY+MM+DD+Serial
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number; // What we charge the customer
  deliveryCost: number; // What we pay the rider
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: 'mobile_money' | 'cash';
  createdAt: string;
  updatedAt: string;
}

export interface Cost {
  id: string;
  description: string;
  amount: number;
  category: 'operating' | 'marketing' | 'logistics' | 'tax' | 'other';
  date: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageCaption?: string;
  isComingSoon?: boolean; // For "Products Coming Soon" updates
  createdAt: string;
  updatedAt: string;
  published: boolean;
}
