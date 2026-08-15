import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BedDouble, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import bookingService from '../services/bookingService';
import useAuth from '../hooks/useAuth';

// Helper to get tomorrow's date formatted as YYYY-MM-DD
const getFormattedDate = (daysFromNow = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

const AvailabilityPicker = ({ hotel, rooms }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [selectedRoomId, setSelectedRoomId] = useState(rooms && rooms.length > 0 ? rooms[0]._id : '');
  const [checkIn, setCheckIn] = useState(getFormattedDate(1));
  const [checkOut, setCheckOut] = useState(getFormattedDate(4));
  const [guests, setGuests] = useState(2);
  const [roomsBooked, setRoomsBooked] = useState(1);

  const [checking, setChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rooms && rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0]._id);
    }
  }, [rooms, selectedRoomId]);

  const handleCheckAvailability = async (e) => {
    if (e) e.preventDefault();
    if (!selectedRoomId || !checkIn || !checkOut) {
      setError('Please select a room and valid dates');
      return;
    }

    try {
      setChecking(true);
      setError(null);
      const res = await bookingService.checkAvailability(hotel._id, selectedRoomId, {
        checkIn,
        checkOut,
        rooms: roomsBooked,
        guests,
      });
      setAvailabilityResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to check room availability');
      setAvailabilityResult(null);
    } finally {
      setChecking(false);
    }
  };

  const handleProceedToBooking = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const selectedRoom = rooms.find(r => r._id === selectedRoomId);

    // Navigate to Booking Review page with reservation state
    navigate('/bookings/review', {
      state: {
        hotel,
        room: selectedRoom,
        checkIn,
        checkOut,
        guests,
        roomsBooked,
        pricing: availabilityResult?.pricing,
      },
    });
  };

  const selectedRoomObj = rooms?.find(r => r._id === selectedRoomId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      
      {/* Widget Title */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Check Room Availability
          </h3>
          <p className="text-xs text-slate-500">Live date-range availability & rate calculator</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Picker Form */}
      <form onSubmit={handleCheckAvailability} className="space-y-4">
        
        {/* Select Room Package */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">Select Accommodation</label>
          <select
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value);
              setAvailabilityResult(null);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {rooms && rooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} ({r.type}) — {formatPrice(r.pricePerNight)}/night
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Check-in Date
            </label>
            <input
              type="date"
              required
              min={getFormattedDate(0)}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setAvailabilityResult(null);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Check-out Date
            </label>
            <input
              type="date"
              required
              min={checkIn || getFormattedDate(1)}
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setAvailabilityResult(null);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Guest & Room Count */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Guests
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={guests}
              onChange={(e) => {
                setGuests(e.target.value);
                setAvailabilityResult(null);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-blue-600" />
              Rooms
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={roomsBooked}
              onChange={(e) => {
                setRoomsBooked(e.target.value);
                setAvailabilityResult(null);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={checking}
          className="w-full py-2.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-75"
        >
          {checking ? 'Checking Dates...' : 'Check Availability'}
        </button>
      </form>

      {/* Result Display */}
      {availabilityResult && (
        <div className="pt-4 border-t border-slate-100 space-y-4 animate-fadeIn">
          {availabilityResult.available ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Room Available ({availabilityResult.availableUnits} units left)</span>
              </div>

              {/* Price Breakdown */}
              {availabilityResult.pricing && (
                <div className="text-xs space-y-1 text-slate-700 pt-2 border-t border-emerald-200/60">
                  <div className="flex justify-between">
                    <span>{formatPrice(availabilityResult.pricing.pricePerNight)} × {availabilityResult.pricing.numberOfNights} night(s)</span>
                    <span className="font-semibold">{formatPrice(availabilityResult.pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Taxes & Fees (12%)</span>
                    <span>{formatPrice(availabilityResult.pricing.taxes)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-emerald-200">
                    <span>Total Amount</span>
                    <span className="text-blue-700">{formatPrice(availabilityResult.pricing.totalAmount)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToBooking}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md mt-2"
              >
                Reserve Room Package
              </button>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Unavailable for selected dates</span>
              </div>
              <p className="text-[11px] text-rose-600">
                {!availabilityResult.capacityValid
                  ? `Guest count exceeds maximum capacity for ${roomsBooked} room(s).`
                  : 'All units of this room type are booked for these dates. Please try different dates.'}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AvailabilityPicker;
