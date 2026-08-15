import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search } from 'lucide-react';

const SearchBar = ({ initialLocation = '', initialCheckIn = '', initialCheckOut = '', initialGuests = 2 }) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (location.trim()) queryParams.set('location', location.trim());
    if (checkIn) queryParams.set('checkIn', checkIn);
    if (checkOut) queryParams.set('checkOut', checkOut);
    if (guests) queryParams.set('guests', guests);

    navigate(`/hotels?${queryParams.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-3 items-center"
    >
      {/* Location Input */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors">
        <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Destination</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where are you going? (e.g. Delhi, Goa)"
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none truncate"
          />
        </div>
      </div>

      {/* Check-In Date */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors">
        <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Check-In</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Check-Out Date */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors">
        <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Check-Out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Guests & Submit Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors">
          <Users className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Guests</label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4+ Guests</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="h-full min-h-[48px] px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-150 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
