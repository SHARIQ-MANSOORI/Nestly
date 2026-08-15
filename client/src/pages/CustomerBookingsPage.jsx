import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle2, AlertCircle, Clock, XCircle, ArrowRight, BedDouble } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import bookingService from '../services/bookingService';

const CustomerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this reservation? Inventory will be released immediately.')) {
      try {
        await bookingService.cancelBooking(bookingId, 'Cancelled by customer');
        await fetchBookings();
      } catch (err) {
        alert(err.message || 'Failed to cancel reservation');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Reservations</h1>
        <p className="text-xs text-slate-500 mt-1">View past and upcoming hotel stays</p>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading your reservations...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No reservations found</h3>
            <p className="text-xs text-slate-500">You have no upcoming or past hotel bookings yet.</p>
          </div>
          <Link
            to="/hotels"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Explore Hotels & Reserve
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const hotelImage = b.hotel?.images && b.hotel.images.length > 0 ? b.hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';
            const checkInFormatted = new Date(b.checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const checkOutFormatted = new Date(b.checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            const isUpcoming = new Date(b.checkIn) >= new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >
                {/* Info Block */}
                <div className="flex flex-col sm:flex-row gap-4 items-start flex-1">
                  <img src={hotelImage} alt={b.hotel?.name} className="w-full sm:w-36 aspect-[4/3] rounded-xl object-cover shrink-0 border border-slate-100" />
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md font-mono">
                        {b.bookingReference}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        b.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.status}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {b.paymentStatus}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{b.hotel?.name || 'Hotel Property'}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{b.hotel?.city} • {b.room?.name || 'Room'}</span>
                    </p>

                    <div className="text-xs text-slate-600 pt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {checkInFormatted} → {checkOutFormatted} ({b.numberOfNights} night{b.numberOfNights > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Actions Block */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-xl font-extrabold text-slate-900 block">{formatPrice(b.totalAmount)}</span>
                    <span className="text-[11px] text-slate-400">{b.roomsBooked} room(s) • {b.guests} guest(s)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/bookings/${b._id}`}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
                    >
                      View Receipt
                    </Link>

                    {b.status === 'confirmed' && isUpcoming && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors border border-rose-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default CustomerBookingsPage;
