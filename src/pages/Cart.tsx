import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, CheckCircle2, Ticket, Sparkles } from 'lucide-react';
import { Coupon } from '../types';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, token, user, addToast, isLoading } = useStore();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const data = await api.get(`/coupons/validate/${couponCode}`);
      setAppliedCoupon(data);
      addToast(`Coupon "${couponCode}" applied successfully!`, 'success');
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Invalid coupon');
      setAppliedCoupon(null);
      addToast('Invalid coupon code.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    addToast('Coupon removed.', 'info');
  };

  // Pricing calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.discountPrice || item.product.price) * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.applicableProductIds?.length > 0) {
      const applicableTotal = cart.reduce((acc, item) => {
        if (appliedCoupon.applicableProductIds.includes(item.product.id)) {
          return acc + (item.product.discountPrice || item.product.price) * item.quantity;
        }
        return acc;
      }, 0);
      discountAmount = applicableTotal * (appliedCoupon.discountPercentage / 100);
    } else {
      discountAmount = subtotal * (appliedCoupon.discountPercentage / 100);
    }
  }

  const shipping = (subtotal - discountAmount) > 1000 ? 0 : 50; 
  const total = subtotal - discountAmount + shipping;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse text-slate-800" id="cart-skeleton-view">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3 w-1/3">
            <div className="w-9 h-9 bg-slate-200 rounded-full"></div>
            <div className="h-8 bg-slate-200 rounded-xl w-full"></div>
          </div>
          <div className="w-28 h-10 bg-slate-200 rounded-xl"></div>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-6 bg-slate-200 rounded-full w-16"></div>
          </div>
          
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
              <div className="w-20 h-20 bg-slate-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-3 w-full">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </div>
              <div className="w-24 h-9 bg-slate-200 rounded-lg"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div className="h-4 bg-slate-200 rounded w-1/5"></div>
            <div className="h-3 bg-slate-200 rounded w-1/6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl">
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="flex gap-2">
                <div className="h-9 bg-slate-100 rounded-lg flex-1"></div>
                <div className="h-9 bg-slate-200 rounded-lg w-16"></div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">Looks like you haven't added components yet. Let's add top-tier hardware to assemble your dream machine!</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/builder" className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/25">
            Open PC Builder
          </Link>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-200 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
            Browse Components
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="cart-parent-view">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center">
          <Link to="/" className="hover:bg-slate-200 p-2 rounded-full transition-colors mr-2 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight ml-2">Shopping Cart</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowEmptyConfirm(true)}
          className="text-slate-600 hover:text-rose-600 px-4 py-2 hover:bg-rose-50 bg-white border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition-all shadow-sm cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
          Empty Cart
        </button>
      </div>

      <div className="space-y-8">
        {/* TOP SECTION: displays products added to the cart */}
        <div className="space-y-4" id="cart-item-list-top">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Hardware Items</h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{cart.length} item(s)</span>
          </div>
          
          <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div 
                key={item.product.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 shadow-sm"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
                  <img src={item.product.imageUrl} alt={item.product.title} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 md:text-base">{item.product.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {item.product.discountPrice ? (
                      <>
                        <span className="text-slate-600 font-bold text-sm">৳{Number(item.product.discountPrice || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <span className="text-xs text-slate-400 line-through">৳{Number(item.product.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </>
                    ) : (
                      <span className="text-slate-700 font-bold text-sm">৳{Number(item.product.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 self-end sm:self-auto">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                    <button 
                      onClick={() => {
                        updateQuantity(item.product.id, Math.max(1, item.quantity - 1));
                        addToast(`Decreased "${item.product.title.substring(0, 15)}..." quantity.`, 'info');
                      }}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-l-lg transition-colors font-bold cursor-pointer"
                    >-</button>
                    <span className="px-3 py-1 text-xs font-bold border-x border-slate-200 text-slate-800 min-w-[24px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => {
                        updateQuantity(item.product.id, item.quantity + 1);
                        addToast(`Increased "${item.product.title.substring(0, 15)}..." quantity.`, 'success');
                      }}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-r-lg transition-colors font-bold cursor-pointer"
                    >+</button>
                  </div>
                  <button 
                    onClick={() => {
                      removeFromCart(item.product.id);
                      addToast(`Removed "${item.product.title.substring(0, 15)}..." from cart.`, 'error');
                    }}
                    className="text-rose-500 hover:bg-rose-50 p-2.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* MIDDLE SECTION: Order summary cards and fields */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6" id="cart-order-summary-box">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Order Summary</h2>
            <span className="text-xs font-bold text-slate-500 font-mono">ESTIMATED BILL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coupon Application Box */}
            <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-indigo-500" />
                Apply Promotional Coupon
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="COUPON CODE" 
                  value={couponCode} 
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  disabled={appliedCoupon !== null}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 placeholder:text-slate-400"
                />
                {!appliedCoupon ? (
                  <button onClick={handleApplyCoupon} disabled={couponLoading} className="bg-slate-950 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer uppercase">
                    Apply
                  </button>
                ) : (
                  <button onClick={removeCoupon} className="bg-rose-105 text-rose-600 hover:text-rose-700 hover:bg-rose-100 bg-rose-50 px-4 py-2 border border-rose-150 rounded-lg text-xs font-bold transition-colors cursor-pointer uppercase">
                    Remove
                  </button>
                )}
              </div>
              {couponError && <p className="text-rose-500 text-xs font-semibold">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Coupon code successfully activated!
                </p>
              )}
            </div>

            {/* Calculations metrics breakups */}
            <div className="space-y-3 font-medium text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span className="text-slate-900 font-semibold">৳{Number(subtotal || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center space-x-1">
                    <span>Discount ({appliedCoupon?.code})</span>
                    {appliedCoupon?.discountPercentage && (
                      <span className="text-xs font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                        {appliedCoupon.discountPercentage}% OFF
                      </span>
                    )}
                  </span>
                  <span>-৳{Number(discountAmount || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="text-slate-900 font-semibold">
                  {shipping === 0 ? <span className="text-emerald-600 font-bold">FREE SHIPPING</span> : `৳${Number(shipping || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-slate-900 text-base md:text-lg">
                <span>Total Amount</span>
                <span className="text-slate-700">৳{Number(total || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: has custom checkout button and "Add More" home-forward buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-6" id="cart-actions-bottom">
          <Link
            to="/"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-6 py-4 border-2 border-slate-200 hover:border-slate-300 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs gap-2"
          >
            Add More Products
          </Link>
          <button
            onClick={() => navigate('/checkout', { state: { coupon: appliedCoupon } })}
            className="w-full sm:w-auto flex-[2] inline-flex items-center justify-center px-6 py-4 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showEmptyConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmptyConfirm(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 pointer-events-auto"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 border border-rose-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Empty Entire Shopping Cart?</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Are you sure you want to clear all high-end components from your shopping cart? This cannot be undone.
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setShowEmptyConfirm(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setShowEmptyConfirm(false);
                      addToast('Shopping cart cleared.', 'info');
                    }}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all outline-none shadow-sm cursor-pointer"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
