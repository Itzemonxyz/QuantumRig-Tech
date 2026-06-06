import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { useStore } from '../store';
import { ArrowLeftRight, Check, Eye, X, ShoppingCart, Share2, TrendingDown, TrendingUp, Trash2, Loader2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
  onRemove?: () => void;
}

export default function ProductCard({ product, onRemove }: ProductCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isBuilderMode = searchParams.get('builder') === 'true';
  const { compareIds, toggleCompare, addToCart, removeFromCart, addToBuilder, token, cart, user, updateUser, addToast } = useStore();
  const [toastMessage, setToastMessage] = React.useState('');
  const [showQuickView, setShowQuickView] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  const isComparing = compareIds.includes(product.id);
  const isInCart = cart.some(item => item.product.id === product.id);
  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isComparing && compareIds.length >= 4) {
      setToastMessage('Limit reached (Max 4)');
      setTimeout(() => setToastMessage(''), 2000);
      return;
    }
    toggleCompare(product.id);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/products/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} at QuantumRig`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      setToastMessage('Link copied to clipboard!');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const isSaved = user?.savedProductIds?.includes(product.id) || false;
  
  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    // Optimistic update
    const previousSavedIds = user.savedProductIds || [];
    const isCurrentlySaved = previousSavedIds.includes(product.id);
    const newSavedIds = isCurrentlySaved 
      ? previousSavedIds.filter(id => id !== product.id)
      : [...previousSavedIds, product.id];
      
    updateUser({ ...user, savedProductIds: newSavedIds });

    try {
      if (isCurrentlySaved) {
        await api.delete(`/users/me/saved-products/${product.id}`, token);
        addToast("Removed.", 'info');
      } else {
        await api.post('/users/me/saved-products', { productId: product.id }, token);
        addToast("Added to save product successfully", 'success');
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      updateUser({ ...user, savedProductIds: previousSavedIds });
      addToast('Failed to update wishlist.', 'error');
    }
  };

  const isOutOfStock = product.stockStatus === 'Out of Stock' || product.inventoryCount === 0;
  const isLowStock = !isOutOfStock && product.inventoryCount !== undefined && product.inventoryCount < 5;
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice > 0;
  const displayPrice = hasDiscount ? product.discountPrice! : product.price;
  const saveAmount = hasDiscount ? (product.price - product.discountPrice!) : 0;
  const stockTrend = product.inventoryCount !== undefined ? (product.inventoryCount < 10 ? 'depleting' : 'replenishing') : 'unknown';

  return (
    <>
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/products/${product.id}`)}
      className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col group cursor-pointer relative transition-all md:hover:border-indigo-500/50 md:hover:shadow-md"
    >
      {saveAmount > 0 && (
         <div className="absolute top-0 left-0 bg-rose-600 text-white text-[11px] sm:text-xs px-3 py-1 rounded-br-2xl font-medium z-10">
            Save: {Number(saveAmount || 0).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}৳
         </div>
      )}

      {/* Badges mapped to top left, just under the save badge if it exists, or left normally */}
      {(isOutOfStock || stockTrend !== 'unknown') && (
        <div className={`absolute left-0 z-10 ${saveAmount > 0 ? 'top-7 rounded-none rounded-br-2xl' : 'top-0 rounded-br-2xl'} text-white text-[11px] sm:text-xs px-2.5 py-1 font-bold flex items-center gap-1 ${isOutOfStock ? 'bg-rose-600' : (stockTrend === 'depleting' ? 'bg-amber-500' : 'bg-emerald-500')}`}>
          {isOutOfStock ? 'Out of Stock' : stockTrend === 'depleting' ? (
            <><TrendingDown className="w-3 h-3" /> Low Stock</>
          ) : (
            <><TrendingUp className="w-3 h-3" /> In Stock</>
          )}
        </div>
      )}

      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
        <button 
          onClick={handleCompareClick}
          title={isComparing ? "Remove from Compare" : "Add to Compare"}
          className={`p-1.5 sm:p-2 rounded-full transition-all shadow-sm hover:scale-105 ${isComparing ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
        >
          {isComparing ? <Check className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
        </button>
        <button 
          onClick={handleShareClick}
          title="Share Product"
          className="p-1.5 sm:p-2 rounded-full transition-all shadow-sm hover:scale-105 bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleSave}
          title={isSaved ? "Remove from Saved" : "Save Product"}
          className={`p-1.5 sm:p-2 rounded-full transition-all shadow-sm ${isSaved ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'} opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center`}
        >
          <motion.div
            animate={isSaved ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Heart className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
          </motion.div>
        </motion.button>
        {onRemove && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove from Saved"
            className="p-1.5 sm:p-2 rounded-full transition-all shadow-sm hover:scale-105 bg-white text-rose-500 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {toastMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <div className="aspect-square relative overflow-hidden bg-white p-4 sm:p-6 flex items-center justify-center border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors">
          <img loading="lazy" src={product.imageUrl} alt={product.title} className="w-full h-full object-contain md:group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-multiply" />
          
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowQuickView(true); }}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center shadow-lg hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 text-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Quick View
            </button>
          </div>
      </div>
      <div className="p-3 sm:p-4 flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
        <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 md:hover:text-indigo-600 transition-all duration-300" title={product.title}>{product.title}</h3>
        
        {product.code && (
          <div className="text-xs text-slate-500 mb-2 font-sans select-none">
            Product Code: <strong className="font-semibold text-slate-700">{product.code}</strong>
          </div>
        )}
        
        {/* Fake Bullet Points based on specs */}
        {product.specs && Object.keys(product.specs).length > 0 && (
           <ul className="text-xs text-slate-500 mb-3 space-y-1 list-disc pl-4 line-clamp-3">
              {Object.entries(product.specs).slice(0, 3).map(([key, val]) => (
                <li key={key}>{key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}: {val as string}</li>
              ))}
           </ul>
        )}
        
        <div className="mt-auto pt-3 border-t border-slate-200 flex flex-col justify-between gap-3 grow-0 shrink-0">
          <div className="flex flex-row items-center justify-between">
             <div className="flex flex-col">
                <span className="text-sm sm:text-lg font-normal text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md mt-auto w-fit">৳{Number(displayPrice).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
             </div>
             
             {isBuilderMode ? (
               <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToBuilder(product.categoryId, product);
                    navigate('/builder');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
               >
                  Select
               </button>
             ) : (
                <div className="flex items-center gap-1.5 z-10 relative">
                   {isAdded && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] sm:text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-900 z-50"
                     >
                       Product added to cart
                     </motion.div>
                   )}
                   <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isInCart) {
                           removeFromCart(product.id);
                           return;
                        }
                        if (isOutOfStock) {
                           setToastMessage('Out of stock');
                           setTimeout(() => setToastMessage(''), 2000);
                           return;
                        }
                        setIsAdding(true);
                        setTimeout(() => {
                           addToCart(product);
                           setIsAdding(false);
                           setIsAdded(true);
                           setTimeout(() => setIsAdded(false), 2000);
                        }, 400); // 400ms simulated loading before adding
                      }}
                      className={`px-3 py-1.5 h-8 rounded-lg text-[11px] font-bold flex flex-1 sm:flex-none items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${isAdded ? 'bg-emerald-500 text-white' : isInCart ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : isOutOfStock ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 shadow-sm border border-transparent'}`}
                      title={isInCart ? "Remove from Cart" : "Add to Cart"}
                      disabled={isAdding}
                   >
                      {isAdding ? (
                         <div className="flex items-center space-x-1.5">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Adding...</span>
                         </div>
                      ) : isAdded ? (
                         <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center space-x-1.5">
                            <Check className="w-4 h-4" />
                            <span>Added</span>
                         </motion.div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                           <ShoppingCart className="w-4 h-4" fill={isInCart ? "currentColor" : "none"} />
                           <span>{isInCart ? 'Remove from Cart' : 'Add to Cart'}</span>
                        </div>
                      )}
                   </button>
                </div>
             )}
          </div>
          
          <button 
            onClick={handleCompareClick} 
            className="md:hidden flex items-center justify-center text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 py-1.5 rounded-md w-full transition-colors"
          >
            {isComparing ? 'Remove from Compare' : '+ Add to Compare'}
          </button>
        </div>
      </div>
    </motion.div>
    
    <AnimatePresence>
      {showQuickView && (() => {
        const allImages = [product.imageUrl, ...(product.additionalImages || [])];
        
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowQuickView(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowQuickView(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors z-20 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full md:w-1/2 bg-slate-50 relative flex flex-col border-b md:border-b-0 md:border-r border-slate-200 min-h-[300px] md:min-h-[500px]">
                <div className="absolute inset-0 p-8 flex items-center justify-center">
                  <img src={allImages[activeImageIndex]} alt={product.title} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
                      }}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-colors z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-200 text-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-colors z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-6 left-0 right-0 gap-2 flex justify-center z-10">
                      {allImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(idx);
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === activeImageIndex ? 'bg-indigo-600' : 'bg-slate-300 hover:bg-slate-400'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="text-sm font-bold tracking-widest text-indigo-600 uppercase">{product.brand || 'Premium'}</div>
                {product.code && (
                  <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200/50 rounded-full px-2.5 py-0.5 inline-block font-sans select-none">
                    Product Code: <strong className="font-bold text-slate-800">{product.code}</strong>
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{product.title}</h2>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-normal text-indigo-700 bg-indigo-50/70 px-3 py-1 rounded-lg">৳{Number(displayPrice || 0).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                {hasDiscount && (
                  <span className="text-lg text-slate-400 line-through">৳{Number(product.price || 0).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                )}
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-4">{product.description}</p>
              
              <div className="mt-auto space-y-3">
                <button
                  onClick={() => {
                    if (isInCart) {
                       setShowQuickView(false);
                       navigate('/cart');
                       return;
                    }
                    if (!token) {
                      setShowQuickView(false);
                      navigate('/login', { state: { from: location } });
                      return;
                    }
                    setIsAdded(true);
                    addToCart(product, 1);
                    setTimeout(() => {
                      setIsAdded(false);
                      setShowQuickView(false);
                    }, 800);
                  }}
                  disabled={isOutOfStock && !isInCart}
                  className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold text-lg transition-all z-10 relative overflow-hidden ${(isOutOfStock && !isInCart) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isAdded ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : isInCart ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95'}`}
                >
                  {isAdded ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center">
                      <Check className="w-6 h-6 mr-3" />
                      Added!
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-3" fill={isInCart ? "currentColor" : "none"} />
                      {(isOutOfStock && !isInCart) ? 'Out of Stock' : isInCart ? 'View in Cart' : 'Add to Cart'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        );
      })()}
    </AnimatePresence>
    </>
  );
}
