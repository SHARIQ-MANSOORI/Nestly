import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Building2, BedDouble } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import bookingService from '../services/bookingService';

const BookingReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const bookingState = location.state || {};
  const { hotel, room, checkIn, checkOut, guests, roomsBooked, pricing } = bookingState;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!hotel || !room || !checkIn || !checkOut || !pricing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          Missing booking selection details. Please select dates and availability first.
        </div>
        <Link to="/hotels" className="text-xs font-semibold text-blue-700 hover:underline">
          Return to Hotel Discovery
        </Link>
      </div>
    );
  }

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        hotelId: hotel._id,
        roomId: room._id,
        checkIn,
        checkOut,
        roomsBooked: Number(roomsBooked) || 1,
        guests: Number(guests) || 1,
      };

      const res = await bookingService.createBooking(payload);
      const createdBooking = res.data;

      // Navigate to receipt page
      navigate(`/bookings/${createdBooking._id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hotelImage = hotel.images && hotel.images.length > 0 ? hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Back Link & Header */}
      <div>
        <Link
          to={`/hotels/${hotel._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hotel Details
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Review Your Reservation</h1>
        <p className="text-xs text-slate-500">Verify dates, guest details, and rate calculations before confirming</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Review Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {/* Hotel & Room Header */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start">
          <img src={hotelImage} alt={hotel.name} className="w-full sm:w-40 aspect-[4/3] rounded-xl object-cover shrink-0 border border-slate-100" />
          
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                {room.type}
              </span>
              <span className="text-xs text-slate-400">• {hotel.city}</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{hotel.name}</h2>
            <p className="text-xs text-slate-500">{hotel.location}</p>
            <p className="text-sm font-semibold text-slate-800 pt-1">{room.name}</p>
          </div>
        </div>

        {/* Stay Details Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50/50">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Check-in Date
            </span>
            <span className="text-sm font-bold text-slate-900 block">{checkIn}</span>
            <span className="text-[10px] text-slate-500">From 14:00 hrs</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Check-out Date
            </span>
            <span className="text-sm font-bold text-slate-900 block">{checkOut}</span>
            <span className="text-[10px] text-slate-500">Until 11:00 hrs ({pricing.numberOfNights} Night{pricing.numberOfNights > 1 ? 's' : ''})</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Occupancy
            </span>
            <span className="text-sm font-bold text-slate-900 block">{guests} Guest(s) • {roomsBooked} Room(s)</span>
            <span className="text-[10px] text-slate-500">Capacity verified</span>
          </div>
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="p-6 md:p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Price Breakdown
          </h3>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Accommodation ({formatPrice(pricing.pricePerNight)} × {pricing.numberOfNights} night{pricing.numberOfNights > 1 ? 's' : ''} × {roomsBooked} room{roomsBooked > 1 ? 's' : ''})</span>
              <span className="font-semibold text-slate-900">{formatPrice(pricing.subtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Hospitality Taxes & Service Fees (12%)</span>
              <span>{formatPrice(pricing.taxes)}</span>
            </div>

            <div className="flex justify-between font-extrabold text-slate-900 text-base pt-3 border-t border-slate-200">
              <span>Total Reservation Amount</span>
              <span className="text-blue-700">{formatPrice(pricing.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Status Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold block">Payment Status: Unpaid</span>
              <span className="text-[11px] text-blue-700">Reservation will be confirmed immediately. Payment gateway integration will be active in Phase 5.</span>
            </div>
          </div>
        </div>

        {/* Confirmation Actions */}
        <div className="p-6 md:p-8 bg-slate-50 flex items-center justify-between gap-4">
          <Link
            to={`/hotels/${hotel._id}`}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Modify Selection
          </Link>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmBooking}
            className="px-8 py-3 bg-slate-900 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-md disabled:opacity-75"
          >
            {loading ? 'Securing Reservation...' : 'Confirm & Reserve Room'}
          </button>
        </div>

      </div>

    </div>
  );
};

export default BookingReviewPage;
