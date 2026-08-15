import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, iconColor = 'text-blue-600', tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          {tooltip && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 bottom-full mb-2 w-56 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none leading-normal">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        {subtext && <div className="text-xs text-slate-500 font-medium mt-1">{subtext}</div>}
      </div>
    </div>
  );
};

export default MetricCard;
