import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useNavigate, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Package, FolderTree, ShoppingCart, Settings as SettingsIcon, Ticket, Zap, LogOut, AreaChart, HelpCircle, RefreshCw, Link as LinkIcon, Menu, X, Box } from 'lucide-react';
import { api } from '../../lib/api';
import AnalyticsTab from './AnalyticsTab';
import ProductsTab from './ProductsTab';
import CategoriesTab from './CategoriesTab';
import BrandsTab from './BrandsTab';
import OrdersTab from './OrdersTab';
import CouponsTab from './CouponsTab';
import SettingsTab from './SettingsTab';
import OffersTab from './OffersTab';
import SupportTab from './SupportTab';
import SocialLinksTab from './SocialLinksTab';
import RestockRequestsTab from './RestockRequestsTab';

const boardOptions = [
  { to: '/admin/analytics', icon: <AreaChart className="w-5 h-5 flex-shrink-0" />, label: 'Analytics' },
  { to: '/admin/products', icon: <Package className="w-5 h-5 flex-shrink-0" />, label: 'Products' },
  { to: '/admin/categories', icon: <FolderTree className="w-5 h-5 flex-shrink-0" />, label: 'Categories' },
  { to: '/admin/brands', icon: <Box className="w-5 h-5 flex-shrink-0" />, label: 'Brands' },
  { to: '/admin/orders', icon: <ShoppingCart className="w-5 h-5 flex-shrink-0" />, label: 'Orders' },
  { to: '/admin/coupons', icon: <Ticket className="w-5 h-5 flex-shrink-0" />, label: 'Coupons' },
  { to: '/admin/offers', icon: <Zap className="w-5 h-5 flex-shrink-0" />, label: 'Offers' },
  { to: '/admin/support', icon: <HelpCircle className="w-5 h-5 flex-shrink-0" />, label: 'Support' },
  { to: '/admin/restock', icon: <RefreshCw className="w-5 h-5 flex-shrink-0" />, label: 'Restock' },
  { to: '/admin/social-links', icon: <LinkIcon className="w-5 h-5 flex-shrink-0" />, label: 'Social Links' },
  { to: '/admin/settings', icon: <SettingsIcon className="w-5 h-5 flex-shrink-0" />, label: 'Settings' },
];

export default function AdminDashboard() {
  const { user, token, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mr-3 font-bold text-sm">QR</div>
          QuantumRig
        </h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Panel</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
         {boardOptions.map((opt) => {
           const isActive = location.pathname.startsWith(opt.to);
           return (
             <Link 
               key={opt.to}
               to={opt.to}
               onClick={() => setMobileMenuOpen(false)}
               className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                 isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
               }`}
             >
               {React.cloneElement(opt.icon as React.ReactElement, { className: `w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}` })}
               <span>{opt.label}</span>
             </Link>
           );
         })}
      </div>

      <div className="p-4 border-t border-slate-200">
         <button 
           onClick={handleLogout}
           className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
         >
           <LogOut className="w-5 h-5" />
           <span>Logout</span>
         </button>
      </div>
    </>
  );

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row max-w-[1600px] mx-auto">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center">
            <h2 className="text-lg font-bold text-slate-900">Admin Panel</h2>
         </div>
         <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
         >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-900/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full bg-slate-50 p-4 md:p-8 min-w-0">
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
           <Routes>
             <Route path="/" element={<Navigate to="analytics" replace />} />
             <Route path="analytics" element={<AnalyticsTab />} />
             <Route path="products" element={<ProductsTab />} />
             <Route path="categories" element={<CategoriesTab />} />
             <Route path="brands" element={<BrandsTab />} />
             <Route path="orders" element={<OrdersTab />} />
             <Route path="coupons" element={<CouponsTab />} />
             <Route path="offers" element={<OffersTab />} />
             <Route path="support" element={<SupportTab />} />
             <Route path="restock" element={<RestockRequestsTab />} />
             <Route path="social-links" element={<SocialLinksTab />} />
             <Route path="settings" element={<SettingsTab />} />
           </Routes>
         </div>
      </main>
    </div>
  );
}
