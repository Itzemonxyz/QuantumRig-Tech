import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Scale, X, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function CompareWidget() {
  const { compareIds, products, showCompareModal, setShowCompareModal, clearCompare, toggleCompare } = useStore();

  const comparedProducts = useMemo(() => {
    return compareIds.map(id => products.find(p => p.id === id)!).filter(Boolean);
  }, [compareIds, products]);

  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    comparedProducts.forEach(p => {
      if (p.specs) {
        Object.keys(p.specs).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [comparedProducts]);

  if (compareIds.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {!showCompareModal && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            className="fixed bottom-20 sm:bottom-8 left-1/2 z-50 w-full px-4 sm:px-0 sm:w-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 p-3 flex flex-col sm:flex-row items-center gap-4 max-w-[calc(100vw-2rem)] sm:max-w-xl">
              <div className="flex gap-2 items-center shrink-0">
                <div className="px-3 py-1 font-bold text-sm text-indigo-600 bg-indigo-50 rounded-full shadow-sm whitespace-nowrap border border-indigo-100">
                  {compareIds.length} / 4
                </div>
                {comparedProducts.map((p, i) => (
                  <div key={p.id} className="relative group shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 bg-slate-50">
                    <img 
                      src={p.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover transition-all duration-200 group-hover:blur-[2px] group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/5 cursor-pointer"
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleCompare(p.id);
                         }}>
                      <div className="bg-white text-rose-500 rounded-full p-1 shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowCompareModal(true)}
                  disabled={compareIds.length < 2}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    compareIds.length >= 2 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25 whitespace-nowrap' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed whitespace-nowrap'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Compare
                </button>
                <button
                  onClick={clearCompare}
                  className="px-3 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                  title="Clear All"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && comparedProducts.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                  <Scale className="w-5 h-5 mr-2 text-indigo-600" />
                  Compare Products ({comparedProducts.length})
                </h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => clearCompare()}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors border border-rose-200"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={() => setShowCompareModal(false)}
                    className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full p-2 transition-colors border border-slate-200 shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto bg-white flex-1">
                <div className={`grid ${comparedProducts.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : comparedProducts.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-6 relative`}>
                   {comparedProducts.map((p, idx) => (
                     <div key={p.id} className="flex flex-col relative bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                       <button
                          onClick={() => {
                            if (comparedProducts.length <= 2) {
                              setShowCompareModal(false);
                            }
                            toggleCompare(p.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 bg-white text-rose-500 hover:bg-rose-50 rounded-full shadow-sm border border-slate-200 z-10"
                          title="Remove from comparison"
                       >
                          <X className="w-4 h-4" />
                       </button>
                       <div className="aspect-video bg-white rounded-xl p-4 mb-4 flex items-center justify-center border border-slate-100 shadow-inner group">
                         <img src={p.imageUrl} alt={p.title} className="max-h-36 object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                       </div>
                       <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">{p.title}</h3>
                       <div className="mb-4 flex flex-wrap items-center gap-2">
                         {p.discountPrice ? (
                           <>
                             <span className="text-xl font-bold text-slate-600">৳{Number(p.discountPrice).toLocaleString("en-IN", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                             <span className="text-xs font-medium text-slate-400 line-through">৳{Number(p.price).toLocaleString("en-BD", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                           </>
                         ) : (
                           <span className="text-xl font-bold text-slate-700">৳{Number(p.price).toLocaleString("en-BD", {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                         )}
                       </div>
                       
                       <div className="space-y-4">
                         <div>
                           <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Stock Status</h4>
                           <p className="font-medium text-slate-700">{p.stockStatus}</p>
                         </div>
                         
                         {p.socket && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Socket</h4>
                            <p className="font-medium text-slate-700">{p.socket}</p>
                          </div>
                         )}

                         {p.wattage !== undefined && p.wattage > 0 && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Wattage</h4>
                            <p className="font-medium text-slate-700">{p.wattage}W</p>
                          </div>
                         )}

                         {allSpecKeys.map((key: string) => (
                           <div key={key}>
                             <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                               {key.replace(/([A-Z])/g, ' $1').trim()}
                             </h4>
                             <p className="font-medium text-slate-700">
                               {(p.specs as any)[key] || '-'}
                             </p>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                </div>

                {(() => {
                  const getNumericValue = (val: any) => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                      const match = val.match(/[\d.]+/);
                      return match ? parseFloat(match[0]) : null;
                    }
                    return null;
                  };

                  const numericSpecKeys = allSpecKeys.filter(key => {
                    return comparedProducts.some(p => {
                      const val = getNumericValue((p.specs as any)[key]);
                      return val !== null;
                    });
                  });

                  const chartData = numericSpecKeys.map(key => {
                    const dataObj: any = {
                      name: key.replace(/([A-Z])/g, ' $1').trim()
                    };
                    comparedProducts.forEach((p, i) => {
                      dataObj[`Product ${i + 1}`] = getNumericValue((p.specs as any)[key]) || 0;
                    });
                    return dataObj;
                  });

                  if (comparedProducts.some(p => p.wattage && p.wattage > 0)) {
                    const dataObj: any = { name: 'Wattage' };
                    comparedProducts.forEach((p, i) => {
                      dataObj[`Product ${i + 1}`] = p.wattage || 0;
                    });
                    chartData.unshift(dataObj);
                  }

                  if (chartData.length === 0) return null;

                  const CompareTooltip = ({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-slate-200 p-3 shadow-xl rounded-xl text-xs font-sans text-slate-800 z-50 min-w-[220px] select-none">
                          <p className="font-bold text-slate-500 mb-2 tracking-wider uppercase text-[10px]">{label}</p>
                          <div className="space-y-1.5">
                            {payload.map((p: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
                                  {p.name}:
                                </span>
                                <span className="font-mono font-bold text-slate-900">{p.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  };

                  return (
                    <div className="mt-12 border-t border-slate-200 pt-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 text-center">Hardware Metrics Comparison</h3>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                            <Tooltip 
                              cursor={{fill: '#f1f5f9'}}
                              content={<CompareTooltip />}
                            />
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            {comparedProducts.map((p, idx) => {
                              const colors = ["#4f46e5", "#38bdf8", "#f43f5e", "#f59e0b"];
                              return (
                                <Bar 
                                  key={p.id} 
                                  dataKey={`Product ${idx + 1}`} 
                                  name={p.title} 
                                  fill={colors[idx % colors.length]} 
                                  radius={[4, 4, 0, 0]} 
                                />
                              );
                            })}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
