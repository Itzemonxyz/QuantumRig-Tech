import React, { useEffect } from 'react';
import { useStore } from '../store';
import { motion } from 'motion/react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Offers() {
  const { offers } = useStore();
  const activeOffers = offers?.filter(o => o.active) || [];

  const breadcrumbItems = [
    { label: 'Offers' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Special Offers</h1>
      
      {activeOffers.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-lg text-slate-500 font-medium">No offers available currently</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center p-4">
                <img 
                  src={offer.imageUrl} 
                  alt={offer.title}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{offer.title}</h3>
                {offer.description && (
                  <p className="text-slate-600 text-sm">{offer.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
