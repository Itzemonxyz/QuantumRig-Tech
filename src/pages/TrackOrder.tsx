import React, { useState } from 'react';
import { api } from '../lib/api';
import { Search, Package, Navigation, AlertTriangle, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';

function OrderItemImage({ item, products }: { item: any; products: any[] }) {
  const [isError, setIsError] = useState(false);
  const foundProd = products.find((p: any) => p.id === item.productId || (p.title && p.title.toLowerCase() === (item.title || '').toLowerCase()));
  const imageUrl = foundProd?.imageUrl || item.imageUrl || '';

  if (!imageUrl || isError) {
    const initials = (item.title || 'PC').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-1 text-center select-none shadow-sm shrink-0">
        <Package className="w-5 h-5 text-indigo-500 mb-0.5" strokeWidth={2} />
        <span className="text-[9px] font-bold font-mono tracking-wider text-slate-700 truncate max-w-full px-1">{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1.5 shrink-0 relative shadow-sm overflow-hidden group font-sans">
      <img 
        src={imageUrl} 
        alt={item.title} 
        onError={() => setIsError(true)}
        className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" 
      />
    </div>
  );
}

export default function TrackOrder() {
  const { products } = useStore();
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  const steps = [
    { label: 'Pending', desc: 'Order placed', statusValue: 'Pending' },
    { label: 'Processing', desc: 'Prepping parts', statusValue: 'Accepted' },
    { label: 'Shipped', desc: 'Dispatched', statusValue: 'Shipped' },
    { label: 'Delivered', desc: 'Received successfully', statusValue: 'Delivered' }
  ];

  const getActiveStep = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 0;
    if (s === 'accepted' || s === 'processing' || s === 'verified') return 1;
    if (s === 'shipped') return 2;
    if (s === 'delivered') return 3;
    return 0; // fallback
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setError('');
    setOrderData(null);
    
    try {
      const data = await api.get(`/public/orders/${orderId.trim()}`);
      setOrderData(data);
    } catch (err: any) {
      if (err.statusCode === 404) {
        setError('Order not found. Please double-check your Order ID.');
      } else {
        setError('Failed to fetch order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Track Your Order</h1>
        <p className="text-slate-500">Enter your order ID below to see the current status and tracking history.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleTrack} className="flex gap-4 mb-8">
          <input
            type="text"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. ord171800..."
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 h-14 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white font-bold h-14 px-8 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center shadow-lg shadow-indigo-600/20 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? <Search className="w-5 h-5 animate-pulse" /> : 'Track Order'}
          </button>
        </form>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-slate-100 pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center">
                  <Package className="w-6 h-6 mr-2 text-indigo-600" />
                  Order Status: <span className="text-indigo-600 ml-2">{orderData.status}</span>
                </h2>
                <div className="text-sm font-mono text-slate-500">ID: {orderData.id}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-sm mb-1">Total Amount</div>
                <div className="font-bold text-xl text-slate-900">৳{Number(orderData.totalAmount || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>

            {/* Live Progress Bar Visual Indicator */}
            <div className="mb-10 bg-slate-50 border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Live Tracking Progress</span>
                {orderData.status === 'Cancelled' ? (
                  <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1 rounded-full uppercase tracking-wider">Cancelled</span>
                ) : orderData.status === 'Delivered' ? (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Delivered
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">In Progress</span>
                )}
              </div>
              
              {orderData.status === 'Cancelled' ? (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-150 text-rose-700 p-4 rounded-xl">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm">Order Cancelled</h4>
                    <p className="text-xs text-rose-600 font-medium">This order was cancelled. Please contact our support team at tech support desk if you need details.</p>
                  </div>
                </div>
              ) : (
                <div className="relative pt-2">
                  {/* Outer connection Track path line */}
                  <div className="absolute top-[22px] left-8 right-8 h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${(getActiveStep(orderData.status) / (steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Node Items */}
                  <div className="relative flex justify-between z-10">
                    {steps.map((step, index) => {
                      const activeIndex = getActiveStep(orderData.status);
                      const isCompleted = index < activeIndex;
                      const isActive = index === activeIndex;
                      const isFuture = index > activeIndex;

                      return (
                        <div key={index} className="flex flex-col items-center flex-1 text-center">
                          {/* Round Step Cap Grid */}
                          <div 
                            className={`w-11 h-11 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative ${
                              isCompleted 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25' 
                                : isActive 
                                  ? 'bg-white border-indigo-600 text-indigo-600 font-extrabold shadow-md shadow-indigo-500/10' 
                                  : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            ) : (
                              <span className="text-xs font-mono font-bold">{index + 1}</span>
                            )}
                            {/* Glowing ping marker ring for real-time item status focus */}
                            {isActive && (
                              <span className="absolute -inset-1 rounded-full animate-ping border-2 border-indigo-400/40 opacity-75 pointer-events-none" />
                            )}
                          </div>
                          
                          {/* Label descriptions */}
                          <div className="mt-3 px-1">
                            <h4 className={`text-xs md:text-sm font-extrabold tracking-tight transition-colors duration-300 ${
                              isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-800 font-bold' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-[90px] md:max-w-none leading-tight font-medium">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-10">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-slate-400" /> Tracking History
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {orderData.trackingHistory?.map((event: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 group-[.is-active]:bg-indigo-600 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-colors">
                      <div className="w-2.5 h-2.5 bg-current rounded-full" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900">{event.status}</h4>
                        <time className="text-xs text-slate-500 font-mono">{new Date(event.date).toLocaleDateString()}</time>
                      </div>
                      <p className="text-slate-600 text-sm leading-snug">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-4">Items in Order</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orderData.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <OrderItemImage item={item} products={products} />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight mb-1">{item.title}</h4>
                      <div className="text-xs text-slate-500">Qty: {item.quantity} × ৳{Number(item.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
