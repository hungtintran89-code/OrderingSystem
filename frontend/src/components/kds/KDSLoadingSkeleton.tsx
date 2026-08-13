import React from 'react';

export const KDSLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white rounded-xl border border-slate-200 h-80 p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-6 bg-slate-200 rounded w-28"></div>
            <div className="h-6 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-10 bg-slate-100 rounded w-full"></div>
          </div>
          <div className="pt-6">
            <div className="h-12 bg-slate-200 rounded-lg w-full min-h-[48px]"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
