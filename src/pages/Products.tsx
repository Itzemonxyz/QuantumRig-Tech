import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Scale, X, Filter, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import Breadcrumbs from '../components/Breadcrumbs';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Products() {
  const { products, categories, isLoading, compareIds, toggleCompare, clearCompare } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  const isBuilderMode = searchParams.get('builder') === 'true';

  const [sortBy, setSortBy] = useState('newest');
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // New filter states
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, out-of-stock
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [localPriceRange, setLocalPriceRange] = useState({ min: '', max: '' });
  const [isFiltering, setIsFiltering] = useState(false);

  React.useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery, sortBy, selectedBrands, stockFilter, priceRange]);

  React.useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  let baseFilteredProducts = products;
  
  if (activeCategory) {
    baseFilteredProducts = baseFilteredProducts.filter(p => p.categoryId === activeCategory);
  }
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    baseFilteredProducts = baseFilteredProducts.filter(p => 
      (p.title || '').toLowerCase().includes(q) || 
      (p.description || '').toLowerCase().includes(q) || 
      (p.brand || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q)
    );
  }

  const allBrands = useMemo(() => {
    const availableProducts = baseFilteredProducts.filter(p => p.stockStatus !== 'Out of Stock' && p.inventoryCount !== 0);
    return Array.from(new Set(availableProducts.map(p => p.brand).filter(Boolean) as string[])).sort();
  }, [baseFilteredProducts]);
  
  let filteredProducts = baseFilteredProducts;

  if (stockFilter === 'in-stock') {
    filteredProducts = filteredProducts.filter(p => p.stockStatus === 'In Stock');
  } else if (stockFilter === 'out-of-stock') {
    filteredProducts = filteredProducts.filter(p => p.stockStatus === 'Out of Stock');
  }

  if (priceRange.min !== '') {
    filteredProducts = filteredProducts.filter(p => p.price >= Number(priceRange.min));
  }
  if (priceRange.max !== '') {
    filteredProducts = filteredProducts.filter(p => p.price <= Number(priceRange.max));
  }
  
  if (selectedBrands.length > 0) {
    filteredProducts = filteredProducts.filter(p => p.brand && selectedBrands.includes(p.brand));
  }
  
  const sortOptions = useMemo(() => {
    const options = [
      { value: 'newest', label: 'Newest Arrivals' },
      { value: 'default', label: 'Featured' },
      { value: 'price-asc', label: 'Price: Low to High' },
      { value: 'price-desc', label: 'Price: High to Low' },
      { value: 'name-asc', label: 'Name: A to Z' },
      { value: 'name-desc', label: 'Name: Z to A' },
    ];
    
    if (activeCategory && filteredProducts.length > 0) {
       const specKeys = new Set<string>();
       products.filter(p => p.categoryId === activeCategory).forEach(p => {
           Object.keys(p.specs || {}).forEach(k => specKeys.add(k));
       });
       
       const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').trim();
       
       Array.from(specKeys).forEach(key => {
           options.push({ value: `spec-${key}-asc`, label: `${formatKey(key)}: Low to High`});
           options.push({ value: `spec-${key}-desc`, label: `${formatKey(key)}: High to Low`});
       });
    }
    return options;
  }, [activeCategory, products, filteredProducts.length]);

  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];
    if (sortBy === 'newest') {
       sorted.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'price-asc') {
       sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
       sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
       sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'name-desc') {
       sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy !== 'default') {
       const isDesc = sortBy.endsWith('-desc');
       const specKey = sortBy.replace('spec-', '').replace('-asc', '').replace('-desc', '');
       
       sorted.sort((a, b) => {
           const valA = a.specs?.[specKey] || "";
           const valB = b.specs?.[specKey] || "";
           const numA = parseFloat(valA.toString().replace(/[^0-9.-]+/g,""));
           const numB = parseFloat(valB.toString().replace(/[^0-9.-]+/g,""));
           
           if (!isNaN(numA) && !isNaN(numB)) {
               return isDesc ? numB - numA : numA - numB;
           }
           return isDesc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
       });
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  const breadcrumbItems = [
    { label: 'Products', path: '/products' },
    ...(activeCategory ? [{ label: categories.find(c => c.id === activeCategory)?.name || 'Category' }] : [])
  ];

  const productPrices = products.map(p => Number(p.price)).filter(p => !isNaN(p));
  const minPriceLimit = productPrices.length > 0 ? Math.floor(Math.min(...productPrices)) : 0;
  const maxPriceLimit = productPrices.length > 0 ? Math.ceil(Math.max(...productPrices)) : 100000;

  const clearFilters = () => {
    setSearchParams({});
    setStockFilter('all');
    setPriceRange({ min: '', max: '' });
    setSelectedBrands([]);
  };

  const filterSidebarContent = (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-3 text-slate-900 uppercase tracking-wider">Availability</h3>
        <ul className="space-y-2 text-sm">
          {['all', 'in-stock', 'out-of-stock'].map(status => (
            <li key={status}>
               <label className="flex items-center space-x-3 cursor-pointer py-2">
                 <input 
                   type="radio" 
                   name="stockStatus" 
                   value={status}
                   checked={stockFilter === status}
                   onChange={(e) => setStockFilter(e.target.value)}
                   className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                 />
                 <span className="text-slate-700 font-medium">
                   {status === 'all' ? 'All Items' : status === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                 </span>
               </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-bold text-sm mb-3 text-slate-900 uppercase tracking-wider">Price Range</h3>
        <div className="flex items-center gap-2 mb-4">
          <input 
            type="number" 
            placeholder={String(minPriceLimit)}
            value={localPriceRange.min}
            onChange={(e) => {
              const val = e.target.value;
              setLocalPriceRange(prev => ({ ...prev, min: val }));
            }}
            onBlur={(e) => {
              const val = e.target.value;
              setPriceRange(prev => ({ ...prev, min: val }));
            }}
            onKeyDown={(e) => {
              const val = e.currentTarget.value;
              if (e.key === 'Enter') setPriceRange(prev => ({ ...prev, min: val }));
            }}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="number" 
            placeholder={String(maxPriceLimit)}
            value={localPriceRange.max}
            onChange={(e) => {
              const val = e.target.value;
              setLocalPriceRange(prev => ({ ...prev, max: val }));
            }}
            onBlur={(e) => {
              const val = e.target.value;
              setPriceRange(prev => ({ ...prev, max: val }));
            }}
            onKeyDown={(e) => {
              const val = e.currentTarget.value;
              if (e.key === 'Enter') setPriceRange(prev => ({ ...prev, max: val }));
            }}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="flex flex-col gap-1 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
           <style>{`
             .dual-range-inputs {
               position: absolute;
               width: 100%;
               background: none;
               pointer-events: none;
               -webkit-appearance: none;
               appearance: none;
               z-index: 20;
             }
             .dual-range-inputs::-webkit-slider-thumb {
               pointer-events: auto;
               position: relative;
               z-index: 30;
               width: 16px;
               height: 16px;
               border-radius: 50%;
               background: #4f46e5;
               border: 2px solid #ffffff;
               cursor: grab;
               -webkit-appearance: none;
               appearance: none;
               box-shadow: 0 2px 4px rgba(0,0,0,0.15);
               transition: transform 0.1s, background-color 0.1s;
             }
             .dual-range-inputs::-webkit-slider-thumb:hover {
               background: #6366f1;
               transform: scale(1.1);
             }
             .dual-range-inputs::-webkit-slider-thumb:active {
               cursor: grabbing;
               transform: scale(1.15);
             }
             .dual-range-inputs::-moz-range-thumb {
               pointer-events: auto;
               position: relative;
               z-index: 30;
               width: 16px;
               height: 16px;
               border-radius: 50%;
               background: #4f46e5;
               border: 2px solid #ffffff;
               cursor: grab;
               box-shadow: 0 2px 4px rgba(0,0,0,0.15);
               transition: transform 0.1s, background-color 0.1s;
             }
             .dual-range-inputs::-moz-range-thumb:hover {
               background: #6366f1;
               transform: scale(1.1);
             }
             .dual-range-inputs::-moz-range-thumb:active {
               cursor: grabbing;
               transform: scale(1.15);
             }
           `}</style>
           
           <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
             <span className="flex flex-col">
               <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Min Price</span>
               <span className="font-mono text-slate-700 font-bold text-sm">৳{localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min)}</span>
             </span>
             <span className="flex flex-col items-end">
               <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Max Price</span>
               <span className="font-mono text-slate-700 font-bold text-sm">৳{localPriceRange.max === '' ? maxPriceLimit : Number(localPriceRange.max)}</span>
             </span>
           </div>

           <div className="relative w-full h-6 mt-1 flex items-center">
             {/* Background Track */}
             <div className="absolute w-full h-1.5 bg-slate-200 rounded-lg pointer-events-none" />
             
             {/* Highlighted Active Range */}
             <div 
               className="absolute h-1.5 bg-indigo-600 rounded-lg pointer-events-none" 
               style={{ 
                 left: `${(( (localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min)) - minPriceLimit) / (maxPriceLimit - minPriceLimit || 1)) * 100}%`, 
                 width: `${(((localPriceRange.max === '' ? maxPriceLimit : Number(localPriceRange.max)) - (localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min))) / (maxPriceLimit - minPriceLimit || 1)) * 100}%` 
               }} 
             />

             {/* Slider Handles */}
             <input 
               type="range"
               min={minPriceLimit}
               max={maxPriceLimit}
               step={10}
               value={localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min)}
               onChange={(e) => {
                 const currentMaxVal = localPriceRange.max === '' ? maxPriceLimit : Number(localPriceRange.max);
                 const val = Math.min(Number(e.target.value), currentMaxVal - 10);
                 setLocalPriceRange(prev => ({ ...prev, min: String(val) }));
               }}
               onMouseUp={(e) => {
                 const currentMaxVal = localPriceRange.max === '' ? maxPriceLimit : Number(localPriceRange.max);
                 const val = Math.min(Number(e.currentTarget.value), currentMaxVal - 10);
                 setPriceRange(prev => ({ ...prev, min: String(val) }));
               }}
               onTouchEnd={(e) => {
                 const currentMaxVal = localPriceRange.max === '' ? maxPriceLimit : Number(localPriceRange.max);
                 const val = Math.min(Number(e.currentTarget.value), currentMaxVal - 10);
                 setPriceRange(prev => ({ ...prev, min: String(val) }));
               }}
               className="dual-range-inputs left-0 h-1"
             />

             <input 
               type="range"
               min={minPriceLimit}
               max={maxPriceLimit}
               step={10}
               value={localPriceRange.max === '' ? maxPriceLimit : Number(localPriceRange.max)}
               onChange={(e) => {
                 const currentMinVal = localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min);
                 const val = Math.max(Number(e.target.value), currentMinVal + 10);
                 setLocalPriceRange(prev => ({ ...prev, max: String(val) }));
               }}
               onMouseUp={(e) => {
                 const currentMinVal = localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min);
                 const val = Math.max(Number(e.currentTarget.value), currentMinVal + 10);
                 setPriceRange(prev => ({ ...prev, max: String(val) }));
               }}
               onTouchEnd={(e) => {
                 const currentMinVal = localPriceRange.min === '' ? minPriceLimit : Number(localPriceRange.min);
                 const val = Math.max(Number(e.currentTarget.value), currentMinVal + 10);
                 setPriceRange(prev => ({ ...prev, max: String(val) }));
               }}
               className="dual-range-inputs left-0 h-1"
             />
           </div>
         </div>
      </div>

      {allBrands.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-bold text-sm mb-3 text-slate-900 uppercase tracking-wider">Brands</h3>
          <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
            {allBrands.map(brand => (
              <li key={brand}>
                 <label className="flex items-center space-x-3 cursor-pointer py-2">
                   <input 
                     type="checkbox" 
                     checked={selectedBrands.includes(brand)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setSelectedBrands(prev => [...prev, brand]);
                       } else {
                         setSelectedBrands(prev => prev.filter(b => b !== brand));
                       }
                     }}
                     className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                   />
                   <span className="text-slate-700 font-medium">{brand}</span>
                 </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(stockFilter !== 'all' || priceRange.min || priceRange.max || selectedBrands.length > 0 || searchQuery) && (
        <div className="border-t border-slate-200 pt-4">
          <button 
            onClick={clearFilters}
            className="w-full py-2 text-sm text-slate-600 font-medium bg-slate-100 rounded md:hover:bg-slate-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative text-slate-900">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
         <div>
           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
             {searchQuery ? `Search Results for "${searchQuery}"` : activeCategory ? categories.find(c => c.id === activeCategory)?.name || 'Products' : 'All Products'}
           </h1>
           <p className="text-sm text-slate-500">Showing {sortedProducts.length} results</p>
         </div>
         
         <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowMobileFilters(true)}
             className="md:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium focus:ring-indigo-500"
           >
             <Filter className="w-4 h-4" /> Filters
           </button>
           <div className="flex items-center gap-2 flex-1 md:flex-none">
             <select 
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-lg focus:ring-2 focus:ring-indigo-500 block p-2 w-full md:w-auto outline-none cursor-pointer"
             >
                {sortOptions.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
           </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block col-span-1 border border-slate-200 bg-white p-5 rounded-xl h-fit sticky top-24 shadow-sm">
          {filterSidebarContent}
        </div>
        
        {/* Mobile Filters Bottom Sheet */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex md:hidden items-end"
            >
              <motion.div 
                initial={{ y: '100%' }} 
                animate={{ y: 0 }} 
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-white h-[85vh] max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                  <h2 className="font-bold text-lg text-slate-900">Filters</h2>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => {
                        setSelectedBrands([]);
                        setStockFilter('all');
                        setPriceRange({ min: '', max: '' });
                        setLocalPriceRange({ min: '', max: '' });
                        if (activeCategory || searchQuery) setSearchParams({});
                      }} 
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Clear Filters
                    </button>
                    <button 
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
                  {filterSidebarContent}
                </div>
                <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-3 text-sm font-bold">
                    <span className="text-slate-500">Products found:</span>
                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{sortedProducts.length}</span>
                  </div>
                  <button onClick={() => setShowMobileFilters(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95">
                    Show {sortedProducts.length} Results
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="col-span-1 md:col-span-3 pb-24">
          {isLoading || isFiltering ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
              <p className="text-slate-500 mb-4">Try adjusting your filters or search criteria.</p>
              <button onClick={clearFilters} className="text-indigo-600 font-medium hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {sortedProducts.map((p, index) => (
                <motion.div 
                  key={p.id || `product-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  );
}

