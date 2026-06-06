import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../lib/api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Ticket, Info, Copy, Mail, ShieldAlert } from 'lucide-react';
import { Coupon } from '../types';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export default function Checkout() {
  const { cart, removeFromCart, clearCart, token, user, addToast } = useStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Coupon state initialized from the cart summary transition
  const [appliedCoupon] = useState<Coupon | null>(location.state?.coupon || null);

  // Delivery state
  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    instructions: ''
  });

  // Prefill when user is loaded
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // Billing states
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Manual Payment'>('Cash on Delivery');
  const [transactionId, setTransactionId] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Totals calculations
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

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01759231313');
    setCopiedPhone(true);
    addToast('Payment phone number copied to clipboard!', 'success');
    setTimeout(() => setCopiedPhone(false), 2000);
  };



  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      addToast('Your cart is empty.', 'error');
      return;
    }
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
      addToast('Please fill in all required delivery fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Build order payload
      const orderPayload = {
        items: cart.map(i => ({
          productId: i.product.id,
          title: i.product.title,
          price: i.product.discountPrice || i.product.price,
          quantity: i.quantity,
          imageUrl: i.product.imageUrl
        })),
        totalAmount: total,
        couponCode: appliedCoupon?.code,
        discountAmount: discountAmount,
        deliveryDetails: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          instructions: form.instructions,
          email: user?.email || '' // Automatically match the user's logged-in email
        },
        paymentMethod,
        transactionId: paymentMethod === 'Manual Payment' ? transactionId : undefined
      };

      const res = await api.post('/orders', orderPayload, token);
      const generatedOrderId = res.id || Math.floor(100000 + Math.random() * 900000).toString();
      setSuccessOrderId(generatedOrderId);



      setSuccess(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#22d3ee', '#10b981', '#f43f5e', '#eab308']
      });
      clearCart();
    } catch (err: any) {
      console.error(err);
      addToast(err?.response?.data?.error || 'Failed to place order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Order Placed Successfully!</h1>
        <p className="text-slate-600 mb-2">Your order has been received and is being processed.</p>
        {successOrderId && (
          <p className="text-sm font-mono text-slate-500 mb-8 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 inline-block">
            Order Reference: #{successOrderId}
          </p>
        )}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/profile" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 text-sm">
            Track Order Status
          </Link>
          <Link to="/" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No active items in checkout</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">Your cart is empty. Let's add some custom PC parts before attempting checkout.</p>
        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-300">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="checkout-view-root">
      <div className="flex items-center mb-8">
        <Link to="/cart" className="hover:bg-slate-200 p-2 rounded-full transition-colors mr-2 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight ml-2">Checkout Delivery & Payment</h1>
      </div>

      {!token ? (
        <div className="max-w-lg mx-auto text-center py-12 px-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100/50 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Authentication Required</h2>
          <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
            Please log in or register an account to enter shipping configurations and place verified hardware orders.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: "/checkout" } }}
            className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 text-sm"
          >
            Log In to Checkout
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-1">Shipping & Delivery Details</h2>
                <p className="text-xs text-slate-500">Your order will be packaged securely and shipped to the address provided below.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Full Name <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={form.fullName} 
                    onChange={e => setForm({...form, fullName: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Phone Number <span className="text-rose-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all font-medium" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Manually Entered Address <span className="text-rose-500">*</span></label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder="Street address, apartment, city, state, postal code"
                  value={form.address} 
                  onChange={e => setForm({...form, address: e.target.value})} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all resize-none font-medium text-slate-800" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Additional Instructions <span className="text-slate-400 font-normal shadow-none">(Optional)</span></label>
                <textarea 
                  rows={2} 
                  value={form.instructions} 
                  onChange={e => setForm({...form, instructions: e.target.value})} 
                  placeholder="e.g. Leave with security, call when outside, or preferred delivery timing" 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-all resize-none font-medium" 
                />
              </div>



              {/* Payment Section */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Select Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`block p-4 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'Cash on Delivery' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-indigo-200 bg-white'}`}>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio" 
                        className="accent-indigo-600 w-4 h-4 flex-shrink-0" 
                        name="paymentType" 
                        value="Cash on Delivery" 
                        checked={paymentMethod === 'Cash on Delivery'} 
                        onChange={() => setPaymentMethod('Cash on Delivery')} 
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-900">Cash on Delivery</span>
                        <span className="block text-xs text-slate-500 mt-0.5">Pay with cash upon package receipt</span>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`block p-4 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'Manual Payment' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-indigo-200 bg-white'}`}>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio" 
                        className="accent-indigo-600 w-4 h-4 flex-shrink-0" 
                        name="paymentType" 
                        value="Manual Payment" 
                        checked={paymentMethod === 'Manual Payment'} 
                        onChange={() => setPaymentMethod('Manual Payment')} 
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-900 leading-tight">Manual Payment</span>
                        <span className="block text-xs text-slate-500 mt-0.5">bKash, Nagad, Rocket Instant Gateways</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'Manual Payment' && (
                <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <div className="text-sm text-amber-900">
                    <div className="font-bold mb-3 flex flex-wrap items-center gap-2">
                      Please send total amount to our bKash/Nagad Personal Number: 
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm align-middle">
                        <strong className="text-indigo-600 tracking-wider font-mono text-sm">01759231313</strong>
                        <button type="button" onClick={handleCopyPhone} className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none" title="Copy Phone Number">
                          {copiedPhone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Enter your Transaction ID below to verify your payment. Your credentials will be processed & confirmed within 12 hours.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">Transaction ID (TrxID) <span className="text-rose-500">*</span></label>
                    <input 
                      required={paymentMethod === 'Manual Payment'} 
                      type="text" 
                      value={transactionId} 
                      onChange={e => setTransactionId(e.target.value)} 
                      placeholder="e.g. TFQ8Q2WXV"
                      className="w-full border border-amber-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white placeholder-amber-400/40 font-mono" 
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-75 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {loading ? 'Processing Order Placements...' : `Complete Order & Place Receipt (৳${Number(total || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})})`}
              </button>
            </form>
          </div>

          {/* Sidebar Summary & Promo coupons */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Checkout Invoice</h2>
              
              {/* Small cart items summary list */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Order Summary</h3>
                <div className="max-h-52 overflow-y-auto space-y-3 pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 text-sm items-center">
                      <div className="w-10 h-10 rounded border border-slate-100 shrink-0 p-1 flex items-center justify-center bg-slate-50">
                        <img src={item.product.imageUrl} alt={item.product.title} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-xs">{item.product.title}</p>
                        <p className="text-slate-500 text-xs font-medium">Qty: {item.quantity} × ৳{Number(item.product.discountPrice || item.product.price).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      </div>
                      <span className="font-semibold text-slate-800 text-xs">৳{Number((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipts pricing summary metrics */}
              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Items subtotal</span>
                  <span>৳{Number(subtotal || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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
                <div className="flex justify-between text-slate-600">
                  <span>Shipping delivery</span>
                  <span>{shipping === 0 ? <span className="text-emerald-650 font-bold">FREE</span> : `৳${Number(shipping || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                  <span>Invoice Total</span>
                  <span>৳{Number(total || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
