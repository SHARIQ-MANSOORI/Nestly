import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, MapPin, Building2, ShieldCheck, CheckCircle2, AlertCircle, Printer, XCircle, CreditCard, Lock } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import bookingService from '../services/bookingService';
import PaymentModal from '../components/PaymentModal';

const BookingDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccessBanner, setPaymentSuccessBanner] = useState(location.state?.paymentSuccess || false);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.getBookingById(id);
      setBooking(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch booking record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this reservation? Inventory will be released immediately.')) {
      try {
        await bookingService.cancelBooking(id, 'Cancelled by customer');
        await fetchBookingDetails();
      } catch (err) {
        alert(err.message || 'Failed to cancel reservation');
      }
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setPaymentSuccessBanner(true);
    await fetchBookingDetails();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading reservation receipt...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error || 'Reservation record not found'}
        </div>
        <Link to="/bookings" className="text-xs font-semibold text-blue-700 hover:underline">
          Return to My Reservations
        </Link>
      </div>
    );
  }

  const checkInFormatted = new Date(booking.checkIn).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const checkOutFormatted = new Date(booking.checkOut).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const hotelImage = booking.hotel?.images && booking.hotel.images.length > 0 ? booking.hotel.images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';

  const canCancel = booking.status === 'confirmed' && new Date(booking.checkIn) >= new Date().setHours(0, 0, 0, 0);
  const isUnpaid = booking.paymentStatus === 'unpaid' && booking.status === 'confirmed';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Back Button & Printing Option */}
      <div className="flex items-center justify-between">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Reservations
        </Link>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Payment Success Banner */}
      {paymentSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-emerald-900 text-sm">Payment Successful!</strong>
              <span className="text-emerald-700">Your transaction has been verified server-side and your reservation is confirmed.</span>
            </div>
          </div>
          <button onClick={() => setPaymentSuccessBanner(false)} className="text-xs font-bold text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Receipt Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {/* Receipt Header Banner */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reservation Reference</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">{booking.bookingReference}</h1>
            <p className="text-xs text-slate-300">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
              booking.status === 'confirmed' ? 'bg-emerald-500 text-white' :
              booking.status === 'cancelled' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white'
            }`}>
              {booking.status}
            </span>
            
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider mt-1 ${
              booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              Payment: {booking.paymentStatus}
            </span>
          </div>
        </div>

        {/* Hotel & Room Information */}
        <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start">
          <img src={hotelImage} alt={booking.hotel?.name} className="w-full sm:w-44 aspect-[4/3] rounded-xl object-cover shrink-0 border border-slate-100" />

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                {booking.room?.type || 'Room'}
              </span>
              <span className="text-xs text-slate-400">• {booking.hotel?.city}</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{booking.hotel?.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{booking.hotel?.location}</span>
            </p>

            <div className="pt-2">
              <span className="text-sm font-semibold text-slate-800 block">{booking.room?.name}</span>
              <span className="text-xs text-slate-500">Up to {booking.room?.capacity} Guests per room</span>
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50/60">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Check-in</span>
            <span className="text-sm font-bold text-slate-900 block">{checkInFormatted}</span>
            <span className="text-[10px] text-slate-500">From 14:00 hrs</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Check-out</span>
            <span className="text-sm font-bold text-slate-900 block">{checkOutFormatted}</span>
            <span className="text-[10px] text-slate-500">Until 11:00 hrs ({booking.numberOfNights} Night{booking.numberOfNights > 1 ? 's' : ''})</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Guests & Rooms</span>
            <span className="text-sm font-bold text-slate-900 block">{booking.guests} Guest(s)</span>
            <span className="text-[10px] text-slate-500">{booking.roomsBooked} Room Unit(s)</span>
          </div>
        </div>

        {/* Cancellation Notice if Cancelled */}
        {booking.status === 'cancelled' && (
          <div className="p-6 md:p-8 bg-rose-50 border-l-4 border-rose-600 space-y-1 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-bold text-rose-700">
              <XCircle className="w-4 h-4" />
              <span>Reservation Cancelled</span>
            </div>
            <p className="text-[11px] text-rose-700">
              Cancelled on {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : 'N/A'}. Reason: {booking.cancellationReason || 'Cancelled by customer'}. Inventory has been released.
            </p>
          </div>
        )}

        {/* Itemized Price Breakdown */}
        <div className="p-6 md:p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Payment & Rate Breakdown
          </h3>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>{formatPrice(booking.pricePerNight)} × {booking.numberOfNights} night(s) × {booking.roomsBooked} room(s)</span>
              <span className="font-semibold text-slate-900">{formatPrice(booking.subtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Hospitality Taxes (12%)</span>
              <span>{formatPrice(booking.taxes)}</span>
            </div>

            <div className="flex justify-between font-extrabold text-slate-900 text-base pt-3 border-t border-slate-200">
              <span>Total Price {booking.paymentStatus === 'paid' ? 'Paid' : 'Due'}</span>
              <span className="text-blue-700">{formatPrice(booking.totalAmount)}</span>
            </div>
          </div>

          {/* Pay Now CTA for Unpaid Booking */}
          {isUnpaid && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 mt-4">
              <div>
                <strong className="block font-bold text-amber-900 text-sm">Payment Pending</strong>
                <span className="text-[11px] text-amber-800">Complete your online payment now to finalize your stay receipt.</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Pay {formatPrice(booking.totalAmount)} Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {canCancel && (
          <div className="p-6 md:p-8 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need to alter your plans?</span>
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
            >
              Cancel Reservation
            </button>
          </div>
        )}

      </div>

      {/* Payment Modal */}
      {showPaymentModal && booking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={booking}
          onSuccess={handlePaymentSuccess}
        />
      )}

    </div>
  );
};

export default BookingDetailsPage;
