import React from 'react';
import { Filter, RotateCcw, Star, DollarSign, MapPin } from 'lucide-react';

const FilterSidebar = ({
  filters,
  onChange,
  onReset,
  cities = [],
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Filter Hotels</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          City / Location
        </label>
        <select
          value={filters.location || ''}
          onChange={(e) => onChange('location', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Destinations</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
          {!cities.includes('Delhi') && <option value="Delhi">Delhi</option>}
          {!cities.includes('Mumbai') && <option value="Mumbai">Mumbai</option>}
          {!cities.includes('Goa') && <option value="Goa">Goa</option>}
          {!cities.includes('Bengaluru') && <option value="Bengaluru">Bengaluru</option>}
          {!cities.includes('Jaipur') && <option value="Jaipur">Jaipur</option>}
        </select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-blue-600" />
          Price Range (₹ / night)
        </label>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Min Price</span>
            <input
              type="number"
              placeholder="₹ Min"
              value={filters.minPrice || ''}
              onChange={(e) => onChange('minPrice', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              min="0"
              step="500"
            />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Max Price</span>
            <input
              type="number"
              placeholder="₹ Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              min="0"
              step="500"
            />
          </div>
        </div>

        {/* Quick price presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => { onChange('minPrice', ''); onChange('maxPrice', '4000'); }}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
          >
            Under ₹4,000
          </button>
          <button
            type="button"
            onClick={() => { onChange('minPrice', '4000'); onChange('maxPrice', '7000'); }}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
          >
            ₹4,000 – ₹7,000
          </button>
        </div>
      </div>

      {/* Minimum Rating Filter */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-blue-600" />
          Minimum Guest Rating
        </label>
        
        <div className="space-y-2">
          {[
            { label: 'All Ratings', value: '' },
            { label: '4.5 ★ & above (Exceptional)', value: '4.5' },
            { label: '4.0 ★ & above (Very Good)', value: '4.0' },
            { label: '3.5 ★ & above (Good)', value: '3.5' },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
            >
              <input
                type="radio"
                name="minRating"
                value={option.value}
                checked={(filters.minRating || '') === option.value}
                onChange={() => onChange('minRating', option.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
