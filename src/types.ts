export interface UserNotification {
  id: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface UserCartItem {
  productId: string;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  password?: string;
  role: 'admin' | 'user';
  savedProductIds?: string[];
  loyaltyPoints?: number;
  notifications?: UserNotification[];
  cart?: UserCartItem[];
}

export interface RestockRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  status: 'pending' | 'fulfilled';
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  isActive: boolean;
  applicableProductIds: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code?: string;
  title: string;
  slug: string;
  categoryId: string;
  brand?: string;
  price: number;
  discountPrice?: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  inventoryCount?: number;
  imageUrl: string;
  additionalImages?: string[];
  description: string;
  // Specific specs for PC Builder
  specs: Record<string, string>;
  socket?: string; // For CPU/Motherboard
  wattage?: number; // For PSU or general consumption
  reviews?: Review[];
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface TrackingStep {
  status: string;
  date: string;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';
  deliveryDetails: {
    fullName: string;
    address: string;
    phone: string;
    email?: string;
    instructions?: string;
  };
  trackingHistory?: TrackingStep[];
  couponCode?: string;
  discountAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentStatus?: 'Pending' | 'Verified' | 'Failed';
  createdAt: string;
}

export interface Settings {
  announcementText: string;
  facebookUrl?: string; // Legacy
  whatsappUrl?: string; // Legacy
  instagramUrl?: string; // Legacy
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  orderBreakdown: { Pending: number; Verified: number; Delivered: number; Shipped: number };
  topProducts: { title: string; count: number }[];
  salesData: { name: string; revenue: number }[];
}

export interface Offer {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  active: boolean;
}

export interface SupportTicket {
  id: string;
  productId: string;
  email: string;
  question: string;
  status: 'Open' | 'Closed';
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
