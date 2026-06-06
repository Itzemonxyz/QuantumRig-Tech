import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from './store';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
import { api } from './lib/api';
import Layout from './components/Layout';
// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Builder from './pages/Builder';
import LaptopFinder from './pages/LaptopFinder';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import TrackOrder from './pages/TrackOrder';
import Offers from './pages/Offers';
import ErrorBoundary from './components/ErrorBoundary';
import SupportChat from './components/SupportChat';

export default function App() {
  const { setCategories, setBrands, setProducts, setOffers, setSettings, setSocialLinks, token, login, logout, isLoading, setIsLoading } = useStore();

  useEffect(() => {
    // Ensure no account is left logged in by default upon entering the website
    const isNewEntry = !sessionStorage.getItem('entered_quantumrig');
    if (isNewEntry) {
      localStorage.removeItem('token');
      logout();
      sessionStorage.setItem('entered_quantumrig', 'true');
    }

    // Initial fetch
    const boot = async () => {
      setIsLoading(true);
      try {
        const [cats, brnds, prods, ofrs, sets, slinks] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
          api.get('/products'),
          api.get('/offers'),
          api.get('/settings'),
          api.get('/social-links')
        ]);
        
        setCategories(cats || []);
        setBrands(brnds || []);
        setProducts(prods || []);
        setOffers(ofrs || []);
        setSettings(sets || null);
        setSocialLinks(slinks || []);
        
        // Also fetch user if token exists (and isn't cleared)
        const activeToken = localStorage.getItem('token');
        if (activeToken) {
          try {
            const u = await api.get('/users/me', activeToken);
            if (u) login(u as any, activeToken);
          } catch (e: any) {
             if (e.message !== "Unauthorized") {
               console.error("User fetch failed", e);
             }
             logout();
          }
        }
      } catch (err) {
        console.error("Failed to boot app catalog", err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [setCategories, setBrands, setProducts, setOffers, setSettings, setSocialLinks, login, logout, setIsLoading]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-50">
        <div className="h-16 w-full bg-white border-b border-slate-200 animate-pulse flex items-center px-4 sm:px-6 lg:px-8">
          <div className="w-8 h-8 bg-slate-200 rounded-md"></div>
          <div className="ml-4 w-32 h-5 bg-slate-200 rounded-md"></div>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <div className="w-1/4 h-8 bg-slate-200 rounded-md animate-pulse mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm h-80 animate-pulse flex flex-col">
                <div className="w-full h-32 bg-slate-100 rounded-xl mb-4"></div>
                <div className="w-2/3 h-4 bg-slate-200 rounded-md mb-2"></div>
                <div className="w-1/2 h-3 bg-slate-100 rounded-md mb-6"></div>
                <div className="mt-auto flex justify-between items-center">
                  <div className="w-16 h-5 bg-slate-200 rounded-md"></div>
                  <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SupportChat />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="builder" element={
            <ErrorBoundary>
              <Builder />
            </ErrorBoundary>
          } />
          <Route path="laptop-finder" element={<LaptopFinder />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="login" element={<Login />} />
          <Route path="admin-login" element={<AdminLogin />} />
          <Route path="profile" element={<Profile />} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="offers" element={<Offers />} />
          <Route path="admin/*" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
