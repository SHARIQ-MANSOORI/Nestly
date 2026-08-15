import React from 'react';

export const HotelCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col h-full">
    <div className="aspect-[16/10] bg-slate-200" />
    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-5 bg-slate-200 rounded-md w-3/4" />
        <div className="h-4 bg-slate-200 rounded-md w-1/2" />
        <div className="h-10 bg-slate-100 rounded-md w-full mt-2" />
      </div>
      <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-4">
        <div className="h-6 bg-slate-200 rounded-md w-24" />
        <div className="h-9 bg-slate-200 rounded-xl w-28" />
      </div>
    </div>
  </div>
);

export const HotelDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
    <div className="h-96 bg-slate-200 rounded-2xl w-full" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-8 bg-slate-200 rounded-md w-2/3" />
        <div className="h-4 bg-slate-200 rounded-md w-1/3" />
        <div className="h-32 bg-slate-100 rounded-xl w-full" />
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl w-full" />
    </div>
  </div>
);

export default HotelCardSkeleton;
