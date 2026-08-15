import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const options = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom Range', value: 'custom' },
];

const DateRangePicker = ({ selectedFilter, onFilterChange, customFrom, customTo, onCustomChange }) => {
  const [showCustom, setShowCustom] = useState(selectedFilter === 'custom');

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
    onFilterChange(val);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative inline-flex items-center">
        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <select
          value={selectedFilter}
          onChange={handleChange}
          className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <input
            type="date"
            value={customFrom || ''}
            onChange={(e) => onCustomChange('from', e.target.value)}
            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:outline-none"
          />
          <span className="text-xs text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={customTo || ''}
            onChange={(e) => onCustomChange('to', e.target.value)}
            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
