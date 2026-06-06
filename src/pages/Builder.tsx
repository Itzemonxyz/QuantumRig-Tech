import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { Product } from '../types';
import { Check, AlertTriangle, Plus, ShoppingBag, Copy, CheckCircle2, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Box, Gpu, PlugZap, PcCase, Fan, Gamepad2, Laptop } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';

const getCategoryIcon = (category: any) => {
  const slug = (category?.slug || '').toLowerCase();
  const id = (category?.id || '').toLowerCase();
  const name = (category?.name || '').toLowerCase();
  
  if (slug.includes('processor') || id === 'c1' || name.includes('processor') || name.includes('cpu')) return <Cpu className="w-5 h-5" />;
  if (slug.includes('motherboard') || id === 'c2' || name.includes('motherboard')) return <CircuitBoard className="w-5 h-5" />;
  if (slug.includes('ram') || id === 'c3' || name.includes('ram') || name.includes('memory')) return <MemoryStick className="w-5 h-5" />;
  if (slug.includes('storage') || id === 'c4' || name.includes('storage') || name.includes('ssd') || name.includes('hdd')) return <HardDrive className="w-5 h-5" />;
  if (slug.includes('graphic') || slug.includes('gpu') || id === 'c5' || name.includes('gpu') || name.includes('graphic')) return <Gpu className="w-5 h-5" />;
  if (slug.includes('power') || slug.includes('psu') || id === 'c6' || name.includes('power') || name.includes('psu')) return <PlugZap className="w-5 h-5" />;
  if (slug.includes('case') || slug.includes('casing') || id === 'c7' || name.includes('case') || name.includes('chassis')) return <PcCase className="w-5 h-5" />;
  if (slug.includes('cooler') || id === 'c8' || name.includes('cooler')) return <Fan className="w-5 h-5" />;
  if (slug.includes('monitor') || id === 'c9' || name.includes('monitor') || name.includes('display')) return <Monitor className="w-5 h-5" />;
  if (slug.includes('laptop') || id === 'c11' || name.includes('laptop')) return <Laptop className="w-5 h-5" />;
  if (slug.includes('accessor') || id === 'c10' || name.includes('accessor') || name.includes('mouse') || name.includes('keyboard')) return <Gamepad2 className="w-5 h-5" />;
  
  return <Box className="w-5 h-5" />;
};

export default function Builder() {
  const { categories, products, builderCart = {}, addToBuilder, removeFromBuilder, addToCart, isLoading, token, addToast } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (activeCategory) {
      setLoadingCategory(activeCategory);
      const timer = setTimeout(() => {
        setLoadingCategory(null);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLoadingCategory(null);
    }
  }, [activeCategory]);

  useEffect(() => {
    const buildParam = searchParams.get('build');
    if (buildParam && products.length > 0) {
      const parts = buildParam.split(',');
      parts.forEach(part => {
        const [catId, prodId] = part.split(':');
        const product = products.find(p => p.id === prodId);
        if (product) {
          addToBuilder(catId, product);
        }
      });
    }
  }, []); // Only parse on mount

  const handleCopyLink = () => {
    const buildParam = Object.entries(builderCart || {})
      .filter(([_, product]) => Boolean(product))
      .map(([catId, product]) => `${catId}:${product?.id}`)
      .join(',');
    
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('build', buildParam);
    
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Builder Logic Check
  const compatibility = useMemo(() => {
    let warnings: string[] = [];
    const cartItems = Object.values(builderCart || {}).filter(Boolean);
    const cpu = cartItems.find(p => ['c1', 'processors'].includes(p?.categoryId || ''));
    const mobo = cartItems.find(p => ['c2', 'motherboards'].includes(p?.categoryId || ''));
    const psu = cartItems.find(p => ['c6', 'power-supplies'].includes(p?.categoryId || ''));

    const totalWattage = cartItems.reduce((acc, p) => acc + (p?.wattage || 0), 0);

    if (cpu && mobo && cpu.socket && mobo.socket) {
      if (cpu.socket !== mobo.socket) {
        warnings.push(`Socket Mismatch: CPU needs ${cpu.socket} but Motherboard is ${mobo.socket}`);
      }
    }

    if (psu && psu.wattage) {
       if (totalWattage > psu.wattage) {
         warnings.push(`Power Warning: Selected components use ~${totalWattage}W which exceeds PSU (${psu.wattage}W)`);
       }
    }

    return { totalWattage, warnings };
  }, [builderCart]);

  const totalCost = Object.values(builderCart || {}).filter(Boolean).reduce((acc, p) => acc + ((p?.discountPrice || p?.price) || 0), 0);

  const addAllToCart = () => {
    if (!token) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setIsAdded(true);
    Object.values(builderCart || {}).filter(Boolean).forEach(p => addToCart(p, 1, true));
    addToast('Awesome! Your entire rig has been securely loaded into your cart.', 'success');
    setTimeout(() => {
      navigate('/cart');
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Custom PC Builder</h1>
          <p className="text-slate-500 mt-2">Select parts to assemble your dream PC. We'll check basic compatibility.</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-w-[250px]">
          <div className="text-sm text-slate-500 mb-1">Estimated Total</div>
          <div className="text-3xl font-bold text-slate-700">৳{Number(totalCost || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className="text-xs text-slate-400 mt-1">Est. Wattage: {compatibility.totalWattage}W</div>
          <div className="flex gap-2 mt-4 w-full">
            <motion.button 
              layout
              whileHover={Object.values(builderCart || {}).filter(Boolean).length > 0 ? { scale: 1.02 } : {}}
              whileTap={Object.values(builderCart || {}).filter(Boolean).length > 0 ? { scale: 0.95 } : {}}
              animate={isAdded ? {
                scale: [1, 1.1, 1],
                backgroundColor: ['#0f172a', '#10b981', '#10b981'],
              } : {}}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={addAllToCart}
              disabled={Object.values(builderCart || {}).filter(Boolean).length === 0}
              className={`relative overflow-hidden flex-1 transition-colors duration-300 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 ${isAdded ? 'bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg' : 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white disabled:shadow-none shadow-md'}`}
            >
              <AnimatePresence mode='wait'>
                {isAdded ? (
                  <motion.div
                    key="added"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.div>
                    <span>Added!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add All to Cart</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <button
              onClick={handleCopyLink}
              disabled={Object.values(builderCart || {}).filter(Boolean).length === 0}
              className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              title="Copy shareable link"
            >
              {copiedLink ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {compatibility.warnings.length > 0 && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-800">Compatibility Warnings</h4>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-rose-700">
              {compatibility.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          {categories.length === 0 && !isLoading && (
             <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
               <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-900 mb-1">No Categories Found</h3>
               <p className="text-slate-500">Categories could not be loaded at this time.</p>
             </div>
          )}
          {isLoading && categories.length === 0 && (
             <div className="space-y-4">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                 </div>
               ))}
             </div>
          )}
          {categories.filter(c => c && !(c.name || '').toLowerCase().includes('laptop') && !['c11', 'laptop', 'laptops'].includes((c.id || '').toLowerCase())).map(category => {
            const selected = (builderCart || {})[category.id];
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50`}
                  onClick={() => navigate(`/products?category=${category.id}&builder=true`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                       {selected ? <Check className="w-5 h-5" /> : getCategoryIcon(category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{category.name}</h3>
                      {selected ? (
                        <p className="text-sm font-medium text-indigo-600 line-clamp-1">{selected.title}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Not selected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      {selected && (
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-800 text-sm">৳{Number(selected.discountPrice || selected.price).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                        </div>
                      )}
                      {selected && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFromBuilder(category.id); }}
                          className="text-xs text-rose-500 hover:underline mt-1 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {!selected && (
                      <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0 md:pl-8">
           <h3 className="font-bold text-lg mb-4 text-slate-900 tracking-tight">Your Build Summary</h3>
           {Object.values(builderCart || {}).filter(Boolean).length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center">
               <div className="w-16 h-16 bg-white text-slate-300 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                 <CircuitBoard className="w-8 h-8" />
               </div>
               <h4 className="text-slate-900 font-bold mb-1 text-sm">Start your build</h4>
               <p className="text-slate-500 text-xs leading-relaxed">
                 Select components from the categories on the left to assemble your custom machine.
               </p>
             </div>
           ) : (
             <div className="space-y-4">
                {Object.values(builderCart || {}).filter(Boolean).map((p: any) => (
                  <div key={p.id} className="flex justify-between items-start text-sm">
                    <span className="text-slate-600 max-w-[200px] line-clamp-2">{p.title}</span>
                    <span className="font-bold text-slate-900 block ml-4 whitespace-nowrap">৳{Number(p.discountPrice || p.price || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200 mt-6 flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>৳{Number(totalCost || 0).toLocaleString("en-BD", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
             </div>
           )}
        </div>
      </div>
      <ScrollToTopButton />

      {/* Mobile Sticky Summary Bar */}
      <div className="lg:hidden fixed bottom-[88px] sm:bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Est. Total</span>
            <span className="text-lg font-extrabold text-indigo-700">৳{Number(totalCost || 0).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
            <span className="text-[10px] text-slate-400 font-medium">({Object.values(builderCart || {}).filter(Boolean).length} parts) • {compatibility.totalWattage}W</span>
          </div>
          <button 
             onClick={addAllToCart}
             disabled={Object.values(builderCart || {}).filter(Boolean).length === 0}
             className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-colors text-sm ${isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500'}`}
          >
            {isAdded ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
            {isAdded ? 'Added' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
