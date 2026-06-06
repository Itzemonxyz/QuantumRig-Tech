import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col group relative animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-slate-100 rounded-xl mb-4 w-full"></div>
      
      {/* Content Skeleton */}
      <div className="flex flex-col flex-1 gap-3">
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-2/3"></div>
          <div className="h-3 bg-slate-100 rounded w-1/3"></div>
        </div>
        
        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-end">
           <div className="h-5 bg-slate-200 rounded w-20"></div>
           <div className="h-8 bg-slate-50 rounded-lg w-8"></div>
        </div>
      </div>
    </div>
  );
}
