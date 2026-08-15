import React from 'react';
import { Star, Sparkles, MapPin, ShieldCheck, HeartHandshake, DollarSign } from 'lucide-react';

const RatingBreakdown = ({ averageRating = 4.5, reviewCount = 0, breakdown = {}, categoryRatings = {} }) => {
  const total = reviewCount || 1;

  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Overall Score */}
        <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Guest Rating</span>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-4xl font-extrabold text-slate-900">{averageRating.toFixed(1)}</span>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'fill-amber-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-semibold">{reviewCount} Verified Reviews</span>
            </div>
          </div>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="space-y-1.5 md:col-span-2">
          {stars.map((star) => {
            const count = breakdown[star] || 0;
            const pct = Math.round((count / total) * 100);

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-slate-600 shrink-0">{star} ★</span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-400 font-medium shrink-0">{count}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Category Ratings Bar */}
      {categoryRatings && Object.keys(categoryRatings).length > 0 && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cleanliness</span>
            <span className="text-base font-extrabold text-slate-900">★ {categoryRatings.cleanliness || averageRating}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</span>
            <span className="text-base font-extrabold text-slate-900">★ {categoryRatings.location || averageRating}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service</span>
            <span className="text-base font-extrabold text-slate-900">★ {categoryRatings.service || averageRating}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Value</span>
            <span className="text-base font-extrabold text-slate-900">★ {categoryRatings.value || averageRating}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default RatingBreakdown;
