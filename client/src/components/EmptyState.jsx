import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

const EmptyState = ({
  title = "No hotels found",
  message = "We couldn't find any hotels matching your search or filter criteria. Try adjusting your location or price range.",
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
        <SearchX className="w-8 h-8" />
      </div>
      
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      </div>

      {onReset && (
        <div className="pt-2">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
