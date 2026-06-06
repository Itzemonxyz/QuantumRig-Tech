import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { Order } from '../types';
import { Package, MapPin, ChevronDown, ChevronUp, CheckCircle2, Heart, Printer, Star, Gift, Search, Settings, LogOut, TrendingUp, BarChart3, Clock, Calendar, PieChart as PieIcon, AlertTriangle, ShieldAlert, ArrowRight, CalendarRange, X } from 'lucide-react';
import TakaIcon from '../components/TakaIcon';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { auth, db } from '../lib/firebase';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import PastOrdersList from '../components/PastOrdersList';
import { motion, AnimatePresence } from 'motion/react';

const SpendingTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200/80 p-3 shadow-lg rounded-xl text-xs font-sans text-slate-800 z-50 select-none">
        <p className="font-bold text-slate-400 mb-1 tracking-wider uppercase text-[10px]">{label}</p>
        <p className="font-mono text-sm font-bold text-indigo-600 flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Spent: ৳{Number(payload[0].value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = [
  '#4f46e5', // indigo-600
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
  '#f43f5e', // rose-500
];

export default function Profile() {
  const { user, login: setLoginData, token, products, categories, logout, updateUser, addToast } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'orders' | 'saved' | 'rewards' | 'settings' | 'analytics'>('orders');
  const [showMobileMenu, setShowMobileMenu] = useState(true);
  const [showEnlargedAvatar, setShowEnlargedAvatar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getLocalDateString = (dateInput: Date | string) => {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Custom Date Range & Budget States
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('monthly_spending_budget');
    return saved ? Number(saved) : 50000; // Default limit
  });

  const handleSaveBudget = (value: number) => {
    setMonthlyBudget(value);
    localStorage.setItem('monthly_spending_budget', String(value));
    addToast('Monthly budget threshold updated successfully!', 'success');
  };

  const handleApplyPreset = (preset: '30days' | '90days' | 'thisyear' | 'clear') => {
    if (preset === 'clear') {
      setStartDateStr('');
      setEndDateStr('');
    } else {
      const end = new Date();
      const start = new Date();
      if (preset === '30days') {
        start.setDate(end.getDate() - 30);
      } else if (preset === '90days') {
        start.setDate(end.getDate() - 90);
      } else if (preset === 'thisyear') {
        start.setMonth(0, 1);
      }
      setStartDateStr(getLocalDateString(start));
      setEndDateStr(getLocalDateString(end));
    }
  };

  const activePreset = React.useMemo(() => {
    if (!startDateStr || !endDateStr) return '';
    const now = new Date();
    const todayStr = getLocalDateString(now);
    if (endDateStr !== todayStr) return '';
    
    const start30 = new Date(now);
    start30.setDate(now.getDate() - 30);
    if (startDateStr === getLocalDateString(start30)) return '30days';
    
    const start90 = new Date(now);
    start90.setDate(now.getDate() - 90);
    if (startDateStr === getLocalDateString(start90)) return '90days';
    
    const startYear = new Date(now);
    startYear.setMonth(0, 1);
    if (startDateStr === getLocalDateString(startYear)) return 'thisyear';
    
    return '';
  }, [startDateStr, endDateStr]);
  
  // Profile edit states
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [editError, setEditError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const navigate = useNavigate();

  const getProductCategory = (item: { productId: string; title: string }) => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      const category = categories.find(c => c.id === product.categoryId);
      if (category) {
        return category.name;
      }
    }
    
    // Heuristic matching for custom/mock items:
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('core') || titleLower.includes('ryzen') || titleLower.includes('processor') || titleLower.includes('cpu') || titleLower.includes('intel') || titleLower.includes('amd')) {
      return 'Processors';
    }
    if (titleLower.includes('gpu') || titleLower.includes('graphics') || titleLower.includes('rtx') || titleLower.includes('geforce') || titleLower.includes('radeon') || titleLower.includes('card')) {
      return 'Graphics Cards';
    }
    if (titleLower.includes('motherboard') || titleLower.includes('board') || titleLower.includes('asus strix') || titleLower.includes('b650') || titleLower.includes('z790')) {
      return 'Motherboards';
    }
    if (titleLower.includes('ram') || titleLower.includes('ddr4') || titleLower.includes('ddr5') || titleLower.includes('corsair vengeance') || titleLower.includes('memory')) {
      return 'RAM';
    }
    if (titleLower.includes('ssd') || titleLower.includes('nvme') || titleLower.includes('hard disk') || titleLower.includes('storage') || titleLower.includes('samsung evo') || titleLower.includes('wd')) {
      return 'Storage';
    }
    if (titleLower.includes('power supply') || titleLower.includes('psu') || titleLower.includes('watt') || titleLower.includes('smps') || titleLower.includes('bronze') || titleLower.includes('gold')) {
      return 'Power Supplies';
    }
    if (titleLower.includes('case') || titleLower.includes('casing') || titleLower.includes('chassis') || titleLower.includes('tower')) {
      return 'Casings';
    }
    if (titleLower.includes('cooler') || titleLower.includes('fan') || titleLower.includes('aio') || titleLower.includes('liquid') || titleLower.includes('heatsink')) {
      return 'Coolers';
    }
    if (titleLower.includes('monitor') || titleLower.includes('display') || titleLower.includes('screen') || titleLower.includes('ips') || titleLower.includes('hz')) {
      return 'Monitors';
    }
    if (titleLower.includes('laptop') || titleLower.includes('notebook') || titleLower.includes('macbook')) {
      return 'Laptops';
    }
    
    return 'Accessories';
  };

  const baseAnalyticsOrders = React.useMemo(() => {
    if (orders.length > 0) return orders;
    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() - 2);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 5);
    return [
      {
        id: "mock_1", userId: user?.id || "u",
        totalAmount: 42000, status: "Delivered",
        createdAt: d1.toISOString(),
        items: [
          { productId: "p1", title: "Intel Core i7", price: 32000, quantity: 1 },
          { productId: "p2", title: "Corsair RAM 16GB", price: 10000, quantity: 1 }
        ]
      },
      {
        id: "mock_2", userId: user?.id || "u",
        totalAmount: 65000, status: "Delivered",
        createdAt: d2.toISOString(),
        items: [
          { productId: "p3", title: "ASUS RTX 4060", price: 50000, quantity: 1 },
          { productId: "p4", title: "NZXT Case", price: 15000, quantity: 1 }
        ]
      }
    ] as Order[];
  }, [orders, user]);

  const filteredOrdersForAnalytics = React.useMemo(() => {
    const valid = baseAnalyticsOrders.filter(o => o.status !== 'Cancelled');
    let result = [...valid];
    if (startDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= start);
    }
    if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= end);
    }
    return result;
  }, [baseAnalyticsOrders, startDateStr, endDateStr, user]);

  const categorySpendingData = React.useMemo(() => {
    const spendingMap: Record<string, number> = {};
    
    filteredOrdersForAnalytics.forEach(o => {
      o.items.forEach(item => {
        const catName = getProductCategory(item);
        const itemTotal = item.price * item.quantity;
        spendingMap[catName] = (spendingMap[catName] || 0) + itemTotal;
      });
    });
    
    return Object.entries(spendingMap).map(([name, value]) => ({
      name,
      value: Number(value)
    })).sort((a, b) => b.value - a.value);
  }, [filteredOrdersForAnalytics, products, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result as string);
      addToast('Profile picture loaded: Remember to click "Save Changes" below to submit!', 'info');
    };
    reader.readAsDataURL(file);
  };

  const [spendingSegment, setSpendingSegment] = React.useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const weeklyData = React.useMemo(() => {
    const validOrders = baseAnalyticsOrders.filter(o => o.status !== 'Cancelled');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const targetDateStr = getLocalDateString(d);
      
      const dailySpent = validOrders
        .filter(o => getLocalDateString(o.createdAt) === targetDateStr)
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      return {
        name: dayNames[d.getDay()],
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        Spent: Number(dailySpent)
      };
    }).reverse();
  }, [baseAnalyticsOrders]);

  const monthlyData = React.useMemo(() => {
    const validOrders = baseAnalyticsOrders.filter(o => o.status !== 'Cancelled');
    
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const targetDateStr = getLocalDateString(d);
      
      const dailySpent = validOrders
        .filter(o => getLocalDateString(o.createdAt) === targetDateStr)
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      return {
        name: `${d.getMonth() + 1}/${d.getDate()}`,
        Spent: Number(dailySpent)
      };
    }).reverse();
  }, [baseAnalyticsOrders]);

  const yearlyData = React.useMemo(() => {
    const validOrders = baseAnalyticsOrders.filter(o => o.status !== 'Cancelled');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setDate(1); // prevent month overflow
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      
      const monthlySpent = validOrders
        .filter(o => {
          const oDate = new Date(o.createdAt);
          return oDate.getFullYear() === year && oDate.getMonth() === monthIdx;
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
        
      return {
        name: `${monthNames[monthIdx]} '${String(year).slice(-2)}`,
        Spent: Number(monthlySpent)
      };
    }).reverse();
  }, [baseAnalyticsOrders]);

  const customRangeData = React.useMemo(() => {
    if (!startDateStr || !endDateStr) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      return Array.from({ length: diffDays + 1 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const targetDateStr = getLocalDateString(d);
        const dailySpent = filteredOrdersForAnalytics
          .filter(o => getLocalDateString(o.createdAt) === targetDateStr)
          .reduce((sum, o) => sum + o.totalAmount, 0);
        return {
          name: `${d.getMonth() + 1}/${d.getDate()}`,
          Spent: Number(dailySpent)
        };
      });
    } else {
      const resultsMap: Record<string, number> = {};
      const d = new Date(start);
      d.setDate(1);
      const endMonth = new Date(end);
      endMonth.setDate(1);
      
      while (d <= endMonth) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const key = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
        resultsMap[key] = 0;
        d.setMonth(d.getMonth() + 1);
      }
      
      filteredOrdersForAnalytics.forEach(o => {
        const oDate = new Date(o.createdAt);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const key = `${monthNames[oDate.getMonth()]} '${String(oDate.getFullYear()).slice(-2)}`;
        if (key in resultsMap) {
          resultsMap[key] += o.totalAmount;
        }
      });
      
      return Object.entries(resultsMap).map(([name, Spent]) => ({
        name,
        Spent: Number(Spent)
      }));
    }
  }, [startDateStr, endDateStr, filteredOrdersForAnalytics]);

  const chartData = React.useMemo(() => {
    if (startDateStr && endDateStr) {
      return customRangeData;
    }
    if (spendingSegment === 'weekly') return weeklyData;
    if (spendingSegment === 'monthly') return monthlyData;
    return yearlyData;
  }, [startDateStr, endDateStr, customRangeData, spendingSegment, weeklyData, monthlyData, yearlyData]);

  const currentTotalSpend = React.useMemo(() => {
    if (startDateStr && endDateStr) {
      return filteredOrdersForAnalytics.reduce((acc, o) => acc + o.totalAmount, 0);
    }
    
    let baseOrders = orders;
    if (orders.length === 0) {
      const today = new Date();
      const d1 = new Date(today); d1.setDate(d1.getDate() - 2);
      const d2 = new Date(today); d2.setDate(d2.getDate() - 5);
      baseOrders = [
        { totalAmount: 42000, status: "Delivered", createdAt: d1.toISOString() },
        { totalAmount: 65000, status: "Delivered", createdAt: d2.toISOString() }
      ] as Order[];
    }

    let cutoff = new Date();
    if (spendingSegment === 'weekly') {
      cutoff.setDate(cutoff.getDate() - 6);
      cutoff.setHours(0, 0, 0, 0);
    } else if (spendingSegment === 'monthly') {
      cutoff.setDate(cutoff.getDate() - 29);
      cutoff.setHours(0, 0, 0, 0);
    } else {
      cutoff.setMonth(cutoff.getMonth() - 11);
      cutoff.setDate(1);
      cutoff.setHours(0, 0, 0, 0);
    }
    
    return baseOrders
      .filter(o => {
        if (o.status === 'Cancelled') return false;
        const d = new Date(o.createdAt);
        return d >= cutoff;
      })
      .reduce((acc, o) => acc + o.totalAmount, 0);
  }, [orders, spendingSegment, startDateStr, endDateStr, filteredOrdersForAnalytics]);

  const currentMonthSpending = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    
    return baseAnalyticsOrders
      .filter(o => {
        if (o.status === 'Cancelled') return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [baseAnalyticsOrders]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await api.get('/orders/user', token);
        // Sort by newest
        data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [user, token, navigate]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setEditMsg('');
    setEditLoading(true);

    try {
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error('New Password and Re-enter New Password do not match.');
      }

      if (auth.currentUser) {
        if (editName !== user.name) {
          await updateProfile(auth.currentUser, { displayName: editName });
        }
        if (newPassword) {
          try {
            await updatePassword(auth.currentUser, newPassword);
          } catch (pwErr: any) {
            if (pwErr.code === 'auth/requires-recent-login' || pwErr.message?.includes('requires-recent-login')) {
              const providerId = auth.currentUser.providerData[0]?.providerId;
              if (providerId === 'google.com') {
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(auth.currentUser, provider);
                await updatePassword(auth.currentUser, newPassword);
              } else if (providerId === 'password') {
                if (!currentPassword) {
                  throw new Error('For security, your current password is required to change your password. Please enter it below and try again.');
                }
                const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await updatePassword(auth.currentUser, newPassword);
              } else {
                throw pwErr;
              }
            } else {
              throw pwErr;
            }
          }
        }
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { name: editName, phone: editPhone, avatar: editAvatar });
      }

      const res = await api.put('/users/me', { name: editName, phone: editPhone, password: newPassword, avatar: editAvatar }, token);
      setLoginData(res, token);
      setEditMsg('Profile updated successfully!');
      addToast('Profile updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleOrderExpand = (id: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedOrders(newExpanded);
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 2rem; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 2rem; }
            .header h1 { margin: 0 0 0.5rem 0; font-size: 24px; color: #0f172a; }
            .header p { margin: 0.25rem 0; color: #64748b; font-size: 14px; }
            .section { margin-bottom: 2.5rem; }
            .section h2 { font-size: 18px; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
            th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            th { font-weight: 600; color: #64748b; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 1rem; color: #0f172a; }
            .tracking { list-style: none; padding: 0; margin: 0; }
            .tracking li { margin-bottom: 1.5rem; }
            .tracking-date { font-weight: bold; margin-bottom: 0.25rem; font-size: 14px; color: #0f172a; }
            .tracking-status { color: #64748b; font-size: 14px; }
            .details { background: #f8fafc; padding: 1.5rem; border-radius: 8px; font-size: 14px; line-height: 1.6; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="margin-bottom: 1.5rem;">
              <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
                <g transform="translate(10, 5)">
                  <circle cx="45" cy="45" r="30" stroke="#1e293b" stroke-width="8" fill="none" stroke-dasharray="140 40" stroke-linecap="round" transform="rotate(45 45 45)"/>
                  <circle cx="45" cy="45" r="8" fill="#4f46e5"/>
                  <line x1="62" y1="62" x2="85" y2="85" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                </g>
                <text x="110" y="62" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="42" font-weight="800" fill="#1e293b" letter-spacing="-1">Quantum<tspan fill="#4f46e5">Rig</tspan></text>
              </svg>
            </div>
            <h1>Order Receipt</h1>
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          
          <div class="section">
            <h2>Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.quantity}</td>
                    <td>৳${Number((item.price * item.quantity) || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">Total: ৳${Number(order.totalAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>

          <div class="section">
            <h2>Delivery Details</h2>
            <div class="details">
              <strong>Receiver:</strong> ${order.deliveryDetails?.fullName || 'N/A'}<br>
              <strong>Phone:</strong> ${order.deliveryDetails?.phone || 'N/A'}<br>
              <strong>Address:</strong> ${order.deliveryDetails?.address || 'N/A'}<br>
              ${order.deliveryDetails?.instructions ? `<strong>Instructions:</strong> ${order.deliveryDetails.instructions}<br>` : ''}
              <strong>Payment Method:</strong> ${order.paymentMethod || 'Cash on Delivery'}
            </div>
          </div>

          ${order.trackingHistory && order.trackingHistory.length > 0 ? `
            <div class="section">
              <h2>Tracking History</h2>
              <ul class="tracking">
                ${(order.trackingHistory || []).map(step => `
                  <li>
                    <div class="tracking-date">${new Date(step.date).toLocaleDateString()} ${new Date(step.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${step.status}</div>
                    <div class="tracking-status">${step.description}</div>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const lifetimeSpend = orders.reduce((acc, order) => {
    if (order.status !== 'Cancelled') {
      return acc + order.totalAmount;
    }
    return acc;
  }, 0);

  let tier = 'Bronze';
  let nextTier = 'Silver';
  let nextTierThreshold = 10000;
  let rewardRate = '1%';
  let tierColor = 'text-amber-600 bg-amber-50';
  let progressColor = 'bg-amber-500';
  
  if (lifetimeSpend >= 100000) {
    tier = 'Platinum';
    nextTier = 'Max Tier';
    nextTierThreshold = 0;
    rewardRate = '5%';
    tierColor = 'text-slate-700 bg-slate-100 border border-slate-300';
    progressColor = 'bg-slate-700';
  } else if (lifetimeSpend >= 50000) {
    tier = 'Gold';
    nextTier = 'Platinum';
    nextTierThreshold = 100000;
    rewardRate = '3%';
    tierColor = 'text-yellow-600 bg-yellow-50';
    progressColor = 'bg-yellow-500';
  } else if (lifetimeSpend >= 10000) {
    tier = 'Silver';
    nextTier = 'Gold';
    nextTierThreshold = 50000;
    rewardRate = '2%';
    tierColor = 'text-slate-500 bg-slate-50 border border-slate-200';
    progressColor = 'bg-slate-400';
  }

  const progress = nextTierThreshold === 0 ? 100 : (Math.max(0, lifetimeSpend) / nextTierThreshold) * 100;

  const savedProducts = products.filter(p => user.savedProductIds?.includes(p.id));

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row max-w-[1600px] mx-auto">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center">
            <h2 className="text-lg font-bold text-slate-900">My Profile</h2>
         </div>
         <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
         >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-auto
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            {editAvatar ? (
              <img 
                src={editAvatar} 
                alt={editName} 
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" 
                onClick={() => setShowEnlargedAvatar(true)}
              />
            ) : (
              <div 
                className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl shadow-sm shrink-0 cursor-pointer hover:bg-indigo-200 transition-colors"
                onClick={() => setShowEnlargedAvatar(true)}
              >
                {editName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-900 text-base truncate">{editName}</h2>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
               <Star className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
               <div className="font-bold text-amber-700 text-sm">{user.loyaltyPoints || 0}</div>
               <div className="text-[9px] uppercase tracking-wider text-amber-600/70 font-bold">Points</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-2 text-center border border-indigo-100">
               <TakaIcon className="w-4 h-4 text-indigo-500 mx-auto mb-0.5" />
               <div className="font-bold text-indigo-700 text-sm">0</div>
               <div className="text-[9px] uppercase tracking-wider text-indigo-600/70 font-bold">Credit</div>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-2">Account Menu</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
          <button 
             onClick={() => { setActiveTab('orders'); setShowMobileMenu(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
               activeTab === 'orders' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
             }`}
          >
             <Package className={`w-5 h-5 ${activeTab === 'orders' ? 'text-indigo-600' : 'text-slate-400'}`} />
             <span>My Orders</span>
          </button>
          
          <button 
             onClick={() => { setActiveTab('saved'); setShowMobileMenu(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
               activeTab === 'saved' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
             }`}
          >
             <Heart className={`w-5 h-5 ${activeTab === 'saved' ? 'text-indigo-600' : 'text-slate-400'}`} />
             <span>Saved Products</span>
          </button>
          
          <button 
             onClick={() => { setActiveTab('rewards'); setShowMobileMenu(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
               activeTab === 'rewards' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
             }`}
          >
             <Gift className={`w-5 h-5 ${activeTab === 'rewards' ? 'text-indigo-600' : 'text-slate-400'}`} />
             <span>Rewards History</span>
          </button>
          
          <button 
             onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
               activeTab === 'settings' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
             }`}
          >
             <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`} />
             <span>Profile Settings</span>
          </button>
          
          <button 
             onClick={() => { setActiveTab('analytics'); setShowMobileMenu(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
               activeTab === 'analytics' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
             }`}
          >
             <TrendingUp className={`w-5 h-5 ${activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400'}`} />
             <span>Spending Analytics</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-200">
           <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200">
             <h3 className="font-bold text-slate-800 text-xs mb-1 flex items-center">
               <Star className="w-3.5 h-3.5 text-amber-500 mr-1" />
               {tier} Tier
             </h3>
             <div className="text-[10px] text-slate-500 mb-2 flex justify-between">
               <span>Spend</span>
               <span className="font-bold">৳{lifetimeSpend.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
             </div>
             <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
               <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }} />
             </div>
           </div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-colors font-medium text-sm"
           >
             <LogOut className="w-4 h-4" />
             <span>Log Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full bg-slate-50 p-4 md:p-8 min-w-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[600px] p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'orders' ? 'Order History' : 
               activeTab === 'saved' ? 'Saved Products' :
               activeTab === 'rewards' ? 'Rewards History' :
               activeTab === 'settings' ? 'Edit Profile & Address' :
               activeTab === 'analytics' ? 'Spending Analytics' : 'My Profile'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'orders' ? 'View and track your previous purchases.' : 
               activeTab === 'saved' ? 'Products you have saved for later.' :
               activeTab === 'rewards' ? 'Track your point-earning transactions.' :
               activeTab === 'settings' ? 'Update your personal information and preferences.' :
               activeTab === 'analytics' ? 'Understand your hardware investments over time.' : ''}
            </p>
          </div>

          {activeTab === 'orders' && (
            <div>
              <PastOrdersList token={token} initialOrders={orders} />
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              {savedProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-medium text-slate-600">You don't have any saved products.</p>
                  <p className="text-sm mt-1">Browse the catalog to add items here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {savedProducts.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onRemove={async () => {
                        try {
                          const res = await api.delete(`/users/me/saved-products/${p.id}`, token);
                          updateUser(res);
                          addToast(`Removed "${p.title}" from saved products.`, 'info');
                        } catch (err) {
                          console.error('Failed to remove saved product:', err);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              {orders.filter(o => o.status !== 'Cancelled').length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                  <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="font-medium text-slate-600">You don't have any point-earning transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...orders]
                    .filter(o => o.status !== 'Cancelled')
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((order, index, array) => {
                      // Calculate cumulative spend before this order to determine tier rate
                      const spendBefore = array.slice(0, index).reduce((acc, o) => acc + o.totalAmount, 0);
                      let rate = 0.01; // 1% default (Bronze)
                      if (spendBefore >= 100000) rate = 0.05; // Platinum
                      else if (spendBefore >= 50000) rate = 0.03; // Gold
                      else if (spendBefore >= 10000) rate = 0.02; // Silver
                      
                      const earnedAmount = order.totalAmount * rate;
                      
                      return { ...order, earnedAmount, rate };
                    })
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(order => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">Order #{order.id.slice(0, 8)}</span>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className="text-slate-300">|</span>
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">Amount: ৳{order.totalAmount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="opacity-70">(Earned at {Number((order.rate * 100) || 0).toLocaleString("en-BD", {minimumFractionDigits: 0, maximumFractionDigits: 0})}% rate)</span></p>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                          <Gift className="w-4 h-4 text-indigo-600 mr-2" />
                          <span className="font-bold text-indigo-700">+৳{order.earnedAmount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div id="analytics-summary-total" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {startDateStr && endDateStr ? "Filtered Period Investment" : "Lifetime Hardware Investment"}
                    </span>
                    <strong className="text-slate-900 text-xl font-extrabold font-mono mt-0.5 block">
                      ৳{(startDateStr && endDateStr ? filteredOrdersForAnalytics.reduce((acc, o) => acc + o.totalAmount, 0) : lifetimeSpend).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                <div id="analytics-summary-orders" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {startDateStr && endDateStr ? "Filtered Period Orders" : "Total Successful Orders"}
                    </span>
                    <strong className="text-slate-900 text-xl font-extrabold font-mono mt-0.5 block">
                      {filteredOrdersForAnalytics.length} Orders
                    </strong>
                  </div>
                </div>

                <div id="analytics-summary-tier" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Loyalty Tier Status</span>
                    <strong className="text-slate-900 text-base font-extrabold mt-0.5 block capitalize flex items-center gap-1.5 pt-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${tierColor}`}>{tier} Tier</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Date Filters and Budget Configuration widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Date Range Picker Component */}
                <div id="analytics-date-range-picker" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-sm">Filter Custom Time Period</h3>
                      </div>
                      {(startDateStr || endDateStr) && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 font-bold flex items-center gap-1 select-none animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Filter Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4 md:h-8">
                      Select start and end points manually or apply instant range presets to dynamically isolate hardware spending.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Native date pickers wrapped inside unified high-fidelity dashboard containers */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex-1 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span className="absolute right-3 top-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest pointer-events-none select-none">Start</span>
                        <input 
                          id="analytics-start-date"
                          type="date" 
                          value={startDateStr}
                          onChange={(e) => setStartDateStr(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 hover:border-slate-300 text-slate-800 rounded-xl pl-9 pr-3 pt-3.5 pb-1.5 text-xs font-bold outline-none ring-offset-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer"
                        />
                      </div>
                      
                      <div className="flex items-center justify-center shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-400 rotate-90 sm:rotate-0 shadow-sm">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span className="absolute right-3 top-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest pointer-events-none select-none">End</span>
                        <input 
                          id="analytics-end-date"
                          type="date" 
                          value={endDateStr}
                          onChange={(e) => setEndDateStr(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 hover:border-slate-300 text-slate-800 rounded-xl pl-9 pr-3 pt-3.5 pb-1.5 text-xs font-bold outline-none ring-offset-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Invalid Date Range Warning */}
                    {startDateStr && endDateStr && new Date(startDateStr) > new Date(endDateStr) && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Invalid range: start date must precede end date.</span>
                      </div>
                    )}

                    {/* Real-time Human Readable Formatting Feedback */}
                    {startDateStr && endDateStr && !(new Date(startDateStr) > new Date(endDateStr)) && (
                      <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl px-3 py-1.5 text-center flex items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-700 font-mono tracking-wide uppercase">Active Range:</span>
                        <span className="text-[11px] font-bold text-slate-700 font-sans">
                          {new Date(startDateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-700 font-sans">
                          {new Date(endDateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {/* Match-Highlighting Preset Pills Selection Area */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        id="btn-preset-30days"
                        onClick={() => handleApplyPreset('30days')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activePreset === '30days'
                            ? 'bg-indigo-600 text-white shadow-md border border-indigo-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        Last 30 Days
                      </button>
                      <button
                        id="btn-preset-90days"
                        onClick={() => handleApplyPreset('90days')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activePreset === '90days'
                            ? 'bg-indigo-600 text-white shadow-md border border-indigo-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        Last 90 Days
                      </button>
                      <button
                        id="btn-preset-year"
                        onClick={() => handleApplyPreset('thisyear')}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activePreset === 'thisyear'
                            ? 'bg-indigo-600 text-white shadow-md border border-indigo-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        This Year
                      </button>
                      {(startDateStr || endDateStr) && (
                        <button
                          id="btn-preset-reset"
                          onClick={() => handleApplyPreset('clear')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition ml-auto flex items-center gap-1.5 cursor-pointer border border-rose-100 active:scale-95"
                        >
                          <X className="w-3 h-3" />
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Monthly Budget Threshold Card */}
                <div id="analytics-budget-tracker" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <TakaIcon className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-sm">Monthly Spend Budget</h3>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Limit:</span>
                        <span className="text-xs font-extrabold font-mono text-slate-800">৳{monthlyBudget.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3 md:h-8">
                      Set a monthly electronics budget to safeguard against hardware enthusiast impulse buys.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {(() => {
                      const budgetPercent = monthlyBudget > 0 ? (currentMonthSpending / monthlyBudget) * 100 : 0;
                      const formattedPercent = budgetPercent.toLocaleString("en-BD", {minimumFractionDigits: 0, maximumFractionDigits: 0});
                      
                      let alertBg = "bg-emerald-50 border-emerald-200 text-emerald-800";
                      let progressBg = "bg-emerald-500";
                      let message = `You have utilized ${formattedPercent}% of your monthly hardware budget. Spending responsibly!`;
                      let IconComponent = CheckCircle2;

                      if (budgetPercent >= 100) {
                        alertBg = "bg-rose-50 border-rose-200 text-rose-800";
                        progressBg = "bg-rose-600";
                        message = `Alert: Budget Exceeded! Monthly spending of ৳${currentMonthSpending.toLocaleString()} is above limit (৳${monthlyBudget.toLocaleString()}).`;
                        IconComponent = ShieldAlert;
                      } else if (budgetPercent >= 80) {
                        alertBg = "bg-amber-50 border-amber-200 text-amber-800";
                        progressBg = "bg-amber-500";
                        message = `Warning: Approaching Budget! You've used ${formattedPercent}% of your ৳${monthlyBudget.toLocaleString()} threshold.`;
                        IconComponent = AlertTriangle;
                      }

                      return (
                        <>
                          <div className={`p-3 rounded-xl border flex items-start space-x-2.5 text-[11px] font-medium leading-normal ${alertBg}`}>
                            <IconComponent className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="block font-bold">
                                {budgetPercent >= 100 ? "Budget Limit Exceeded" : budgetPercent >= 80 ? "Approaching Threshold" : "Safe Budget Status"}
                              </span>
                              <span className="opacity-90">{message}</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span>Month Spend: ৳{currentMonthSpending.toLocaleString()}</span>
                              <span>{formattedPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${progressBg}`} 
                                style={{ width: `${Math.min(100, budgetPercent)}%` }} 
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <div className="flex gap-2 items-center pt-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs font-extrabold text-slate-400 font-mono">৳</span>
                        <input 
                          id="budget-threshold-input"
                          type="number"
                          min="1000"
                          step="1000"
                          placeholder="Edit Limit..."
                          value={monthlyBudget || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setMonthlyBudget(val);
                            localStorage.setItem('monthly_spending_budget', String(val));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-6 pr-3 py-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <button
                        id="btn-save-budget"
                        onClick={() => handleSaveBudget(monthlyBudget)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition"
                      >
                        Set Threshold
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Main Time Series Component (Spans 2 cols on wide screens) */}
                <div id="analytics-area-chart-card" className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <span>Spending Trend over Time</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track your hardware custom configurations and components spending curve.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {startDateStr && endDateStr ? (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-2 py-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Custom Range Active
                        </span>
                      ) : (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                          {(['weekly', 'monthly', 'yearly'] as const).map((segment) => (
                            <button
                              key={segment}
                              type="button"
                              onClick={() => setSpendingSegment(segment)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                                spendingSegment === segment
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              {segment}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1">
                        <strong className="text-indigo-700 text-xs font-extrabold font-mono block">
                          ৳{currentTotalSpend.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full font-sans text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dy={6}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={11}
                          tickFormatter={(value) => `৳${value.toLocaleString()}`}
                          tickLine={false}
                          axisLine={false}
                          dx={-6}
                        />
                        <Tooltip content={<SpendingTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="Spent" 
                          stroke="#4f46e5" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorSpent)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Hardware Allocation Pie Chart (Spans 1 col) */}
                <div id="analytics-pie-chart-card" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-1">
                      <PieIcon className="w-5 h-5 text-indigo-600" />
                      <span>Investment Share</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Breakdown of total spendings by PC components.
                    </p>
                  </div>

                  {categorySpendingData.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic py-10">
                      No component data available.
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <div className="h-44 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categorySpendingData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categorySpendingData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`৳${Number(value).toLocaleString()}`, 'Spent']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Main Area</span>
                          <span className="text-xs font-extrabold text-indigo-600 font-mono mt-0.5">
                            {categorySpendingData[0]?.name.split(' ')[0] || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Legend detail list */}
                      <div className="w-full mt-4 max-h-36 overflow-y-auto space-y-1.5 px-1 pr-2">
                        {categorySpendingData.slice(0, 5).map((item, idx) => (
                          <div key={item.name} className="flex items-center justify-between text-xs select-none">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="text-slate-600 font-medium truncate">{item.name}</span>
                            </div>
                            <span className="font-mono text-slate-950 font-bold shrink-0">
                              ৳{item.value.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {categorySpendingData.length > 5 && (
                          <div className="text-[10px] text-slate-400 text-center font-medium pt-1">
                            + {categorySpendingData.length - 5} more PC part categories
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Hardware Category Bar Chart (Spans 2 cols) */}
                <div id="analytics-bar-chart-card" className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-1">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      <span>PC Component Breakdown</span>
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                      Compare total spent across different computer hardware categories.
                    </p>
                  </div>

                  {categorySpendingData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      No part purchase history found.
                    </div>
                  ) : (
                    <div className="h-64 w-full font-mono text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categorySpendingData}
                          margin={{ top: 5, right: 10, left: 15, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#94a3b8" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            angle={-15}
                            textAnchor="end"
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10}
                            tickFormatter={(value) => `৳${value.toLocaleString()}`}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip formatter={(value) => [`৳${Number(value).toLocaleString()}`, 'Total Spent']} />
                          <Bar 
                            dataKey="value" 
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                          >
                            {categorySpendingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 4. Customer Custom Insights Card (Spans 1 col) */}
                <div id="analytics-insights-card" className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col justify-between border border-slate-800">
                  <div className="space-y-4">
                    <div className="inline-flex bg-indigo-500/10 text-indigo-300 font-mono text-[10px] tracking-widest font-bold uppercase rounded-lg px-2.5 py-1 border border-indigo-400/20">
                      By Gamers, For Gamers
                    </div>
                    <div>
                      <h4 className="text-lg font-extrabold tracking-tight">QuantumRig Profiler</h4>
                      <p className="text-xs text-slate-400 mt-1 select-none">
                        Analyzing your PC component composition:
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <div className="flex items-start space-x-3">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Enthusiast Scale Index</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {lifetimeSpend >= 100000 
                              ? "Extreme Build Spec: Configured for bleeding-edge high FPS 4K rendering and compiling."
                              : lifetimeSpend >= 50000
                              ? "Pro Rig Spec: Perfect high-performance gaming balance with reliable, high-tier components."
                              : "Solid Standard Spec: Excellent productivity performance with optimal value setups."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Prime Category Focus</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {categorySpendingData[0] 
                              ? `You have allocated your maximum capital into ${categorySpendingData[0].name} (৳${categorySpendingData[0].value.toLocaleString()}).`
                              : "Assemble your custom computer components in our interactive PC Builder to start tracking."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/builder')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md mt-6 flex items-center justify-center gap-1.5"
                  >
                    Open PC Builder
                  </button>
                </div>

              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Edit Profile</h2>
              
              {editError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100">
                  {editError}
                </div>
              )}
              {editMsg && (
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-6 border border-emerald-100">
                  {editMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Avatar & Basic Information */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Profile Avatar Upload Component */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 border border-slate-200/60 p-6 rounded-2xl">
                      <div className="relative group shrink-0">
                        {editAvatar ? (
                          <img src={editAvatar} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-4xl shadow-md border-4 border-indigo-200 transition-all">
                            {editName.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        {editAvatar && (
                          <button 
                            type="button" 
                            onClick={() => { setEditAvatar(''); }}
                            className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-lg transition-colors text-xs w-6 h-6 flex items-center justify-center font-bold"
                            title="Remove profile image"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5 text-center sm:text-left">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Choose Profile Picture</label>
                        <p className="text-xs text-slate-500">JPEG, PNG or B64. Max file size: 2MB.</p>
                        <div className="relative mt-3">
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="avatar-file-upload-input"
                            onChange={handleFileChange}
                            className="hidden" 
                          />
                          <label 
                            htmlFor="avatar-file-upload-input"
                            className="inline-block bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-sans font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-colors"
                          >
                            Upload Picture
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input type="email" value={user.email} disabled className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed" />
                        <p className="text-xs text-slate-500 mt-1">Email address cannot be changed.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                          <input required type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                          <input required type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Password Control (Optional) */}
                  <div className="lg:col-span-5">
                    <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl h-full space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-indigo-100 pb-3">Change Password (Optional)</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (!e.target.value) setConfirmPassword('');
                          }} 
                          placeholder="Leave blank to keep current password" 
                          className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                        />
                        <p className="text-xs text-slate-500 mt-1">If you registered via Google, setting a password here will allow you to login with email next time.</p>
                      </div>

                      {newPassword && (
                        <div className="animate-in fade-in duration-200 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Re-enter New Password <span className="text-rose-500">*</span>
                            </label>
                            <input 
                              required
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)} 
                              className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                              placeholder="Re-enter new password to verify"
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                              <p className="text-xs text-rose-500 mt-1">Passwords do not match.</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && (
                              <p className="text-xs text-emerald-600 mt-1">Passwords match! Ready to save.</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {newPassword && auth.currentUser?.providerData[0]?.providerId === 'password' && (
                        <div className="mt-4 animate-in fade-in duration-200">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Current Password <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            required
                            type="password" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            className="w-full border border-slate-300 bg-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                            placeholder="Required to change your password"
                          />
                        </div>
                      )}

                      {newPassword && auth.currentUser?.providerData[0]?.providerId === 'google.com' && (
                        <p className="text-[11px] text-indigo-600 mt-2 bg-indigo-50 border border-indigo-100/50 p-2.5 rounded-lg">
                          Note: Since you signed in using Google, clicking Save Changes may prompt a Google sign-in window to confirm your identity.
                        </p>
                      )}
                    </div>
                  </div>

                </div>
                
                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={editLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-70 cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all text-sm"
                  >
                    {editLoading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Enlarged Avatar Modal */}
      <AnimatePresence>
        {showEnlargedAvatar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setShowEnlargedAvatar(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative max-w-sm w-full md:max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowEnlargedAvatar(false)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="bg-white rounded-3xl p-2 shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                {editAvatar ? (
                  <img src={editAvatar} alt={editName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-7xl md:text-9xl shadow-inner border-[12px] border-white">
                    {editName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
