import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { LayoutGrid, Zap, Monitor, ShoppingBag, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function BottomNav() {
  const { cart, user } = useStore();
  const location = useLocation();
  
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [isShaking, setIsShaking] = useState(false);
  const prevCartCount = useRef(cartItemsCount);

  useEffect(() => {
    if (cartItemsCount > prevCartCount.current) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartItemsCount;
  }, [cartItemsCount]);

  const isActive = (path: string) => location.pathname === path;
  
  // Handlers for menu logic
  const isMenu = isActive('/profile') || isActive('/login') || isActive('/admin');
  const dest = user ? (user.role === 'admin' ? '/admin' : '/profile') : '/login';

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 z-50 px-2 py-2 flex justify-between items-center sm:hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-2xl pb-safe"
    >
      <Link to="/products" className={`flex flex-col items-center justify-center p-2 w-16 ${location.pathname.startsWith('/products') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
        <LayoutGrid className="w-5 h-5 mb-1" />
        <span className="text-[11px] font-semibold">Products</span>
      </Link>
      
      <Link to="/offers" className={`flex flex-col items-center justify-center p-2 w-16 ${isActive('/offers') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
        <Zap className="w-5 h-5 mb-1" />
        <span className="text-[11px] font-semibold">Offers</span>
      </Link>

      <div className="relative w-16 h-full flex justify-center">
        <Link 
          to="/" 
          className="absolute -top-7 flex flex-col items-center justify-center w-14 h-14 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.15)] hover:bg-slate-50 transition-colors border-[3px] border-indigo-50"
        >
          <img src="/favicon.svg" alt="Home" className="w-7 h-7 object-contain" />
        </Link>
      </div>
      
      <Link to="/cart" className={`flex flex-col items-center justify-center p-2 w-16 relative ${isActive('/cart') ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
        <div className="relative">
          <motion.div animate={isShaking ? { rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.4 }}>
            <ShoppingBag className="w-5 h-5 mb-1" />
          </motion.div>
          <AnimatePresence mode="popLayout">
            {cartItemsCount > 0 && (
              <motion.span 
                key={cartItemsCount}
                initial={{ scale: 0, y: -10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm">
                {cartItemsCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[11px] font-semibold">Cart</span>
      </Link>
      
      <Link to={dest} className={`flex flex-col items-center justify-center p-2 w-16 ${isMenu ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
        <User className="w-5 h-5 mb-1" />
        <span className="text-[11px] font-semibold">Menu</span>
      </Link>
    </motion.div>
  );
}
