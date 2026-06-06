import { create } from 'zustand';
import { User, Category, Brand, Product, Order, Settings, Offer, Analytics, UserNotification, SocialLink, ToastMessage } from './types';
import { api } from './lib/api';

const syncCartToServer = async (cart: { product: Product; quantity: number }[], token: string | null) => {
  if (!token) return;
  try {
    await api.post('/users/me/cart', {
      cart: cart.map(item => ({ productId: item.product.id, quantity: item.quantity }))
    }, token);
  } catch (error) {
    console.warn("Cart synchronization failed:", error);
  }
};

interface StoreState {
  user: User | null;
  token: string | null;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  offers: Offer[];
  settings: Settings | null;
  socialLinks: SocialLink[];
  analytics: Analytics | null;
  notifications: UserNotification[];
  cart: { product: Product; quantity: number }[];
  builderCart: { [categoryId: string]: Product };
  isLoading: boolean;
  toasts: ToastMessage[];

  // Actions
  setIsLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setCategories: (categories: Category[]) => void;
  setBrands: (brands: Brand[]) => void;
  setProducts: (products: Product[]) => void;
  setOffers: (offers: Offer[]) => void;
  setSettings: (settings: Settings) => void;
  setSocialLinks: (socialLinks: SocialLink[]) => void;
  setAnalytics: (analytics: Analytics) => void;
  setNotifications: (notifications: UserNotification[]) => void;
  markNotificationRead: (id: string) => void;
  
  // Toast
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Cart
  addToCart: (product: Product, quantity?: number, silent?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Builder
  addToBuilder: (categoryId: string, product: Product) => void;
  removeFromBuilder: (categoryId: string) => void;
  clearBuilder: () => void;

  // Compare
  compareIds: string[];
  showCompareModal: boolean;
  setShowCompareModal: (show: boolean) => void;
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  categories: [],
  brands: [],
  products: [],
  offers: [],
  settings: null,
  socialLinks: [],
  analytics: null,
  notifications: [],
  cart: [],
  builderCart: {},
  compareIds: [],
  showCompareModal: false,
  toasts: [],
  isLoading: true,

  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowCompareModal: (show: boolean) => set({ showCompareModal: show }),
  login: (user, token) => {
    localStorage.setItem('token', token);
    set((state) => {
      let mergedCart = [...state.cart];
      if (user.cart && user.cart.length > 0) {
        user.cart.forEach((dbItem: any) => {
          const product = state.products.find(p => p.id === dbItem.productId);
          if (product) {
            const existing = mergedCart.find(item => item.product.id === product.id);
            if (existing) {
              existing.quantity = Math.max(existing.quantity, dbItem.quantity);
            } else {
              mergedCart.push({ product, quantity: dbItem.quantity });
            }
          }
        });
        syncCartToServer(mergedCart, token);
      } else if (state.cart.length > 0) {
        syncCartToServer(state.cart, token);
      }
      return { user, token, cart: mergedCart };
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, notifications: [], cart: [] });
  },
  updateUser: (user) => set({ user }),
  setCategories: (categories) => set({ categories }),
  setBrands: (brands) => set({ brands }),
  setProducts: (products) => set({ products }),
  setOffers: (offers) => set({ offers }),
  setSettings: (settings) => set({ settings }),
  setSocialLinks: (socialLinks) => set({ socialLinks }),
  setAnalytics: (analytics) => set({ analytics }),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set((state) => ({ 
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) 
  })),

  addToast: (message, type = 'success') => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    setTimeout(() => {
      useStore.getState().removeToast(id);
    }, 3000);
    return { toasts: [...state.toasts, { id, message, type }] };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  addToCart: (product, quantity = 1, silent = false) => set((state) => {
    const existing = state.cart.find((item) => item.product.id === product.id);
    let newCart;
    if (existing) {
      newCart = state.cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
    } else {
      newCart = [...state.cart, { product, quantity }];
    }
    syncCartToServer(newCart, state.token);

    if (silent) {
      return { cart: newCart };
    }

    const toastId = Math.random().toString(36).substring(2, 9);
    setTimeout(() => {
      useStore.getState().removeToast(toastId);
    }, 3000);

    return { 
      cart: newCart,
      toasts: [...state.toasts, { id: toastId, message: `Added "${product.title}" to cart!`, type: 'success' }]
    };
  }),
  removeFromCart: (productId) => set((state) => {
    const newCart = state.cart.filter((item) => item.product.id !== productId);
    syncCartToServer(newCart, state.token);
    
    const prod = state.cart.find(item => item.product.id === productId)?.product;
    const title = prod ? prod.title : 'Item';
    const toastId = Math.random().toString(36).substring(2, 9);
    setTimeout(() => {
      useStore.getState().removeToast(toastId);
    }, 3000);

    return { 
      cart: newCart,
      toasts: [...state.toasts, { id: toastId, message: `Removed "${title}" from cart.`, type: 'info' }]
    };
  }),
  updateQuantity: (productId, quantity) => set((state) => {
    const newCart = state.cart.map((item) => item.product.id === productId ? { ...item, quantity } : item);
    syncCartToServer(newCart, state.token);
    return { cart: newCart };
  }),
  clearCart: () => set((state) => {
    syncCartToServer([], state.token);
    
    const toastId = Math.random().toString(36).substring(2, 9);
    setTimeout(() => {
      useStore.getState().removeToast(toastId);
    }, 3000);

    return { 
      cart: [],
      toasts: [...state.toasts, { id: toastId, message: 'Shopping cart has been emptied.', type: 'info' }]
    };
  }),

  addToBuilder: (categoryId, product) => set((state) => ({
    builderCart: { ...state.builderCart, [categoryId]: product }
  })),
  removeFromBuilder: (categoryId) => set((state) => {
    const newBuilder = { ...state.builderCart };
    delete newBuilder[categoryId];
    return { builderCart: newBuilder };
  }),
  clearBuilder: () => set({ builderCart: {} }),

  toggleCompare: (productId) => set((state) => {
    if (state.compareIds.includes(productId)) {
      return { compareIds: state.compareIds.filter(id => id !== productId) };
    }
    if (state.compareIds.length >= 4) {
      return state;
    }
    return { compareIds: [...state.compareIds, productId] };
  }),
  clearCompare: () => set({ compareIds: [] }),
}));
