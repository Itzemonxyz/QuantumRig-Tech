import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import ProductSkeleton from '../components/ProductSkeleton';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { 
  Cpu, 
  CircuitBoard, 
  MemoryStick, 
  HardDrive, 
  Gpu, 
  PlugZap, 
  PcCase, 
  Fan, 
  Monitor, 
  Gamepad2, 
  Box,
  LayoutGrid,
  Search,
  LifeBuoy,
  ArrowRight,
  Zap,
  Headphones,
  Laptop
} from 'lucide-react';

export default function Home() {
  const { categories, products, isLoading, user, addToast } = useStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMoreMobileCats, setShowMoreMobileCats] = useState(false);
  const [mobileHeroIndex, setMobileHeroIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const mobileBanners = [
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMobileHeroIndex(pr => (pr + 1) % mobileBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [mobileBanners?.length]);

  // Complaints states
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintName, setComplaintName] = useState('');
  const [complaintEmail, setComplaintEmail] = useState('');
  const [complaintOrderId, setComplaintOrderId] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('Delivery Issue');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Pre-fill complainant details when modal opens
  useEffect(() => {
    if (isComplaintOpen && user) {
      setComplaintName(user.name || '');
      setComplaintEmail(user.email || '');
    }
  }, [isComplaintOpen, user]);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintName.trim() || !complaintEmail.trim() || !complaintDescription.trim()) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }
    setIsSubmittingComplaint(true);
    try {
      await api.post('/complaints', {
        name: complaintName,
        email: complaintEmail,
        orderId: complaintOrderId,
        category: complaintCategory,
        description: complaintDescription
      });
      addToast('Your complaint has been submitted successfully to the admin team.', 'success');
      setComplaintDescription('');
      setComplaintOrderId('');
      setIsComplaintOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Failed to submit complaint', 'error');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim() 
    ? products.filter(p => 
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) // limit to 5 results
    : [];

  const getCategoryIcon = (category: any) => {
    const slug = (category?.slug || '').toLowerCase();
    const id = (category?.id || '').toLowerCase();
    const name = (category?.name || '').toLowerCase();
    
    if (slug.includes('processor') || id === 'c1' || name.includes('processor') || name.includes('cpu')) return <Cpu className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('motherboard') || id === 'c2' || name.includes('motherboard')) return <CircuitBoard className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('ram') || id === 'c3' || name.includes('ram') || name.includes('memory')) return <MemoryStick className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('storage') || id === 'c4' || name.includes('storage') || name.includes('ssd') || name.includes('hdd')) return <HardDrive className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('graphic') || slug.includes('gpu') || id === 'c5' || name.includes('gpu') || name.includes('graphic')) return <Gpu className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('power') || slug.includes('psu') || id === 'c6' || name.includes('power') || name.includes('psu')) return <PlugZap className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('case') || slug.includes('casing') || id === 'c7' || name.includes('case') || name.includes('chassis')) return <PcCase className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('cooler') || id === 'c8' || name.includes('cooler')) return <Fan className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('monitor') || id === 'c9' || name.includes('monitor') || name.includes('display')) return <Monitor className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('laptop') || id === 'c11' || name.includes('laptop')) return <Laptop className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    if (slug.includes('accessor') || id === 'c10' || name.includes('accessor') || name.includes('mouse') || name.includes('keyboard')) return <Gamepad2 className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
    
    return <Box className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-200px)] text-slate-900 w-full shadow-2xl relative pb-8">
      
      {/* Mobile-Only Blocks */}
      <div className="md:hidden flex flex-col w-full">
        {/* Quick Access Circular Icon Grid */}
        <div className="bg-white py-4 px-4 shadow-sm relative z-10 mb-2">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {[
              { slug: 'processors', name: 'CPU', icon: <Cpu className="w-6 h-6 text-indigo-600" /> },
              { slug: 'laptops', name: 'Laptop', icon: <Laptop className="w-6 h-6 text-indigo-600" /> },
              { slug: 'motherboards', name: 'MBoard', icon: <CircuitBoard className="w-6 h-6 text-indigo-600" /> },
              { slug: 'monitors', name: 'Monitor', icon: <Monitor className="w-6 h-6 text-indigo-600" /> },
              { slug: 'accessories', name: 'Gadgets', icon: <Gamepad2 className="w-6 h-6 text-indigo-600" /> },
              { slug: 'casings', name: 'Casing', icon: <PcCase className="w-6 h-6 text-indigo-600" /> },
              { slug: 'graphics-cards', name: 'GPU', icon: <Gpu className="w-6 h-6 text-indigo-600" /> },
              { slug: 'ram', name: 'RAM', icon: <MemoryStick className="w-6 h-6 text-indigo-600" /> },
              { slug: 'storage', name: 'Drive', icon: <HardDrive className="w-6 h-6 text-indigo-600" /> },
              { slug: 'coolers', name: 'Cooler', icon: <Fan className="w-6 h-6 text-indigo-600" /> }
            ].slice(0, showMoreMobileCats ? 10 : 4).map((cat, idx) => {
              const actualCat = categories.find(c => 
                c.slug.toLowerCase().includes(cat.slug.replace(/s$/, '')) || 
                c.name.toLowerCase().includes(cat.name.toLowerCase()) ||
                cat.name.toLowerCase().includes(c.name.toLowerCase())
              );
              const fallbackMap: Record<string, string> = {
                'processors': 'c1', 'laptops': 'c11', 'motherboards': 'c2', 'monitors': 'c9',
                'accessories': 'c10', 'casings': 'c7', 'graphics-cards': 'c5', 'ram': 'c3', 
                'storage': 'c4', 'coolers': 'c8'
              };
              const targetId = actualCat ? actualCat.id : fallbackMap[cat.slug];
              return (
                <div key={idx} className="flex flex-col items-center justify-center cursor-pointer" onClick={() => targetId && navigate(`/products?category=${targetId}`)}>
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm">
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 text-center tracking-tight">{cat.name}</span>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => setShowMoreMobileCats(p => !p)} 
            className="w-full mt-3 py-1.5 text-xs font-bold text-indigo-600 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          >
            {showMoreMobileCats ? 'Show Less' : 'Show More Categories'}
          </button>
        </div>

        {/* Hero Carousel */}
        <div className="relative w-full h-[220px] overflow-hidden bg-slate-900 border-y border-slate-200">
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={mobileHeroIndex}
              src={mobileBanners[mobileHeroIndex]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              className="absolute w-full h-full object-cover mix-blend-overlay"
              alt="Banner"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent flex flex-col justify-end p-4">
             <h2 className="text-2xl font-extrabold text-white mb-1">QuantumRig Tech</h2>
             <p className="text-xs text-indigo-200 uppercase tracking-widest font-semibold mb-2">Build Your Dream Setup</p>
          </div>
          <div className="absolute bottom-4 right-4 flex space-x-1">
            {mobileBanners.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i === mobileHeroIndex ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-400'} transition-all`} />
            ))}
          </div>
        </div>

        {/* Marquee */}
        <div className="bg-indigo-600 text-white text-[10px] py-1.5 overflow-hidden w-full whitespace-nowrap shadow-sm border-b border-indigo-700">
          <div className="animate-marquee font-medium tracking-wider uppercase flex items-center">
            <span className="mx-2">🔥</span> 10% OFF with code QUANTUM24 <span className="mx-2">🔥</span> Next-day delivery available! <span className="mx-2">🔥</span> 10% OFF with code QUANTUM24
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex gap-3 px-4 py-4 mb-2 bg-white border-b border-slate-200 shadow-sm">
          <button onClick={() => navigate('/builder')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-2 flex flex-col items-center justify-center shadow-lg shadow-slate-900/10 transition-transform active:scale-95 border border-slate-800">
            <CircuitBoard className="w-6 h-6 mb-1 text-indigo-400" />
            <span className="font-bold text-xs">PC Builder</span>
          </button>
          <button onClick={() => navigate('/laptop-finder')} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl py-3 px-2 flex flex-col items-center justify-center shadow-sm transition-transform active:scale-95 border border-indigo-200">
            <Laptop className="w-6 h-6 mb-1 text-indigo-600" />
            <span className="font-bold text-xs">Laptop Finder</span>
          </button>
        </div>
      </div>

      {/* Hero Section (Desktop) */}
      <div className="hidden md:flex relative w-full h-[400px] overflow-hidden bg-slate-900 items-center justify-center">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=2000&q=80" 
            alt="Gaming PC" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Build Your Ultimate <span className="text-indigo-500">Gaming PC</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
            By Gamers, For Gamers. Discover premium PC components, expert advice, and the exact hardware you need to power your dreams.
          </p>
          <button 
            onClick={() => navigate('/builder')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Start Your Build
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto">


      {/* Portals Section - Relocated with beautiful graphic cards */}
      <div className="hidden md:block px-8 mt-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* PC Builder Card */}
          <Link 
            to="/builder" 
            id="portal-pc-builder"
            className="group relative overflow-hidden flex flex-col justify-between bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 shadow-sm border border-slate-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <CircuitBoard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">PC Builder</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-indigo-600 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              Start Assembling <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Laptop Finder Card */}
          <Link 
            to="/laptop-finder" 
            id="portal-laptop-finder"
            className="group relative overflow-hidden flex flex-col justify-between bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 shadow-sm border border-slate-100 group-hover:bg-blue-100 group-hover:border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Laptop Finder</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-blue-600 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              Find Laptop <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Track Order Card */}
          <Link 
            to="/track-order" 
            id="portal-track-order"
            className="group relative overflow-hidden flex flex-col justify-between bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-500/10 hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-200/50 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 shadow-sm border border-slate-100 group-hover:bg-slate-200 group-hover:border-slate-300 flex items-center justify-center text-slate-700 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 transition-colors">Track Order</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-slate-700 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              Track Progress <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Raise a Complaint Card */}
          <button 
            type="button"
            onClick={() => setIsComplaintOpen(true)}
            id="portal-raise-complaint"
            className="group relative overflow-hidden flex flex-col justify-between bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 text-left min-h-[180px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rose-100/50 to-transparent rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-slate-50 shadow-sm border border-slate-100 group-hover:bg-rose-100 group-hover:border-rose-200 flex items-center justify-center text-rose-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors">Raise a Complaint</h3>
            </div>
            
            <div className="mt-6 text-xs font-bold text-rose-600 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 z-10 opacity-70 group-hover:opacity-100">
              File Complaint <ArrowRight className="w-4 h-4" />
            </div>
          </button>

        </div>
      </div>

      {/* Complaint Submission Modal */}
      <AnimatePresence>
        {isComplaintOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComplaintOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-xl bg-white shadow-2xl rounded-2xl border border-slate-200 pointer-events-auto overflow-hidden text-left z-10 flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 px-6 py-6 text-white relative shrink-0">
                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-indigo-400 animate-pulse" />
                  File Official Complaint
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">We appreciate your feedback. Please submit details of the issue so we can inspect and resolve it.</p>
                <button 
                  type="button"
                  onClick={() => setIsComplaintOpen(false)}
                  className="absolute top-5 right-5 text-white/85 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors font-bold w-6 h-6 flex items-center justify-center text-xs cursor-pointer z-20"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleComplaintSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Your Name *</label>
                  <input 
                    type="text" 
                    required
                    value={complaintName}
                    onChange={(e) => setComplaintName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={complaintEmail}
                    onChange={(e) => setComplaintEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Order ID (Optional)</label>
                    <input 
                      type="text" 
                      value={complaintOrderId}
                      onChange={(e) => setComplaintOrderId(e.target.value)}
                      placeholder="e.g. QRG-123456"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category *</label>
                    <select 
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none font-medium text-slate-800"
                    >
                      <option value="Delivery Issue">Delivery Issue</option>
                      <option value="Replacement / Return">Replacement / Return</option>
                      <option value="Defective Hardware">Defective Hardware</option>
                      <option value="Billing / Promo Code">Billing / Promo Code</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Other feedback">Other feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Complaint Details *</label>
                  <textarea 
                    required
                    rows={4}
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Detail what occurred. We will inspect the logged data and reply in 24 hours..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm outline-none resize-none h-28 text-slate-800"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsComplaintOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingComplaint}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg text-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Categories Grid (Desktop) */}
      <div className="hidden md:block px-8 mt-6">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-y-10 gap-x-6">
          {categories.map((c) => (
            <motion.button 
               key={c.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3 }}
               onClick={() => navigate(`/products?category=${c.id}`)}
               className="flex flex-col items-center justify-start group"
            >
               <div className="w-16 h-16 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3 group-hover:border-indigo-500 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all">
                  {getCategoryIcon(c)}
               </div>
               <span className="text-xs text-slate-600 text-center leading-tight font-medium group-hover:text-indigo-600 transition-colors px-1">{c.name}</span>
            </motion.button>
          ))}
          <motion.button 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.1 }}
             onClick={() => navigate('/products')}
             className="flex flex-col items-center justify-start group"
          >
             <div className="w-16 h-16 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3 group-hover:border-indigo-500 group-hover:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all">
                <LayoutGrid className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
             </div>
             <span className="text-xs text-slate-600 text-center leading-tight font-medium group-hover:text-indigo-600 transition-colors px-1">All Products</span>
          </motion.button>
        </div>
      </div>

      {/* Trending Products */}
      <div className="px-4 md:px-8 mt-8 md:mt-20 mb-12 md:mb-20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trending Now</h2>
            <p className="text-slate-500 text-sm mt-1">Our most popular hardware right now.</p>
          </div>
          <Link to="/products" className="text-indigo-600 text-sm font-medium hover:text-indigo-500">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <ProductSkeleton key={`trending-skeleton-${idx}`} />
            ))
          ) : (
            products.filter(p => p.stockStatus !== 'Out of Stock').slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>
      </div>

      {/* Enhancements / Features Section */}
      <div className="px-8 mb-20">
        <div className="bg-indigo-900 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">The PC Builder's Choice</h2>
            <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
              We don't just sell parts. We provide an intuitive interactive builder ensuring all your components are 100% compatible. Expertly curate your next battlestation with zero guesswork.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-indigo-800/50 backdrop-blur border border-indigo-700 p-6 rounded-2xl">
                 <Zap className="w-8 h-8 text-amber-400 mx-auto mb-4" />
                 <h3 className="font-bold mb-2">Fast Delivery</h3>
                 <p className="text-sm text-indigo-200">Express nationwide shipping on all orders.</p>
               </div>
               <div className="bg-indigo-800/50 backdrop-blur border border-indigo-700 p-6 rounded-2xl">
                 <Box className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                 <h3 className="font-bold mb-2">Secure Packaging</h3>
                 <p className="text-sm text-indigo-200">Your precious components are boxed with extreme care.</p>
               </div>
               <div className="bg-indigo-800/50 backdrop-blur border border-indigo-700 p-6 rounded-2xl">
                 <Headphones className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                 <h3 className="font-bold mb-2">Expert Support</h3>
                 <p className="text-sm text-indigo-200">Got a question during building? Our team is available 24/7.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
