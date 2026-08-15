import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Building2, ArrowLeft, BedDouble, Search, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import bookingService from '../services/bookingService';

const ManagerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchManagerBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.getManagerBookings();
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch manager bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.bookingReference?.toLowerCase().includes(term) ||
      b.user?.name?.toLowerCase().includes(term) ||
      b.hotel?.name?.toLowerCase().includes(term) ||
      b.room?.name?.toLowerCase().includes(term) ||
      b.paymentStatus?.toLowerCase().includes(term)
    );
  });

  const totalValue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const paidCount = bookings.filter(b => b.paymentStatus === 'paid').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Back Navigation */}
      <div>
        <Link
          to="/manager"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Manager Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100 uppercase tracking-wider">
              Manager Reservation Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Property Reservations & Payments</h1>
            <p className="text-xs text-slate-500">Monitor guest bookings and online payment statuses across your properties</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <span className="text-2xl font-bold text-slate-900 block">{bookings.length}</span>
          <span className="text-[11px] text-slate-500">Across all owned properties</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Online Paid Reservations</span>
          <span className="text-2xl font-bold text-emerald-600 block">
            {paidCount} / {bookings.length}
          </span>
          <span className="text-[11px] text-slate-500">Verified server transactions</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Confirmed Gross Value</span>
          <span className="text-2xl font-bold text-slate-900 block">{formatPrice(totalValue)}</span>
          <span className="text-[11px] text-slate-500">Includes taxes & service fees</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by booking reference, guest name, property, or payment status..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading property reservations...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BedDouble className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">No guest reservations match your query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Property & Room</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredBookings.map((b) => {
                  const checkInFmt = new Date(b.checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                  const checkOutFmt = new Date(b.checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/bookings/${b._id}`} className="hover:text-blue-700 hover:underline">
                          {b.bookingReference}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{b.user?.name || 'Guest'}</span>
                        <span className="text-[11px] text-slate-400 block">{b.user?.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{b.hotel?.name || 'Property'}</span>
                        <span className="text-[11px] text-slate-500">{b.room?.name || 'Room'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span>{checkInFmt} → {checkOutFmt}</span>
                        <span className="text-[10px] text-slate-400 block">({b.numberOfNights} night{b.numberOfNights > 1 ? 's' : ''})</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatPrice(b.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          b.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {b.paymentStatus || 'unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          b.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerBookingsPage;
