import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Calendar, Percent, TrendingUp, BedDouble, AlertCircle, ArrowLeft, RefreshCw, Users, ShieldCheck, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import analyticsService from '../services/analyticsService';
import DateRangePicker from '../components/DateRangePicker';
import MetricCard from '../components/MetricCard';

const ManagerAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getManagerOverview(filter, customFrom, customTo);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load manager analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const handleCustomChange = (type, val) => {
    if (type === 'from') setCustomFrom(val);
    if (type === 'to') setCustomTo(val);
  };

  const handleApplyCustom = () => {
    if (filter === 'custom' && customFrom && customTo) {
      fetchAnalytics();
    }
  };

  useEffect(() => {
    if (filter === 'custom' && customFrom && customTo) {
      fetchAnalytics();
    }
  }, [customFrom, customTo]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const kpis = data?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            to="/manager"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manager Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Property Performance Analytics</h1>
          <p className="text-xs text-slate-500">Real-time revenue, occupancy %, ADR, and room inventory metrics for your properties</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker
            selectedFilter={filter}
            onFilterChange={setFilter}
            customFrom={customFrom}
            customTo={customTo}
            onCustomChange={handleCustomChange}
          />
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAnalytics} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl p-5" />
          ))}
        </div>
      ) : (
        <>
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Net Revenue"
              value={formatCurrency(kpis.netRevenue)}
              subtext={`Gross: ${formatCurrency(kpis.grossRevenue)} | Refunds: ${formatCurrency(kpis.refunds)}`}
              icon={DollarSign}
              iconColor="text-emerald-600"
            />
            <MetricCard
              title="Total Bookings"
              value={kpis.totalBookings || 0}
              subtext={`Confirmed: ${kpis.confirmedBookings || 0} | Cancelled: ${kpis.cancelledBookings || 0}`}
              icon={Calendar}
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Occupancy Rate"
              value={`${kpis.occupancyRate || 0}%`}
              subtext={`Avg Stay: ${kpis.averageStay || 0} nights`}
              icon={Percent}
              iconColor="text-purple-600"
              tooltip="Calculated as Booked Room Nights ÷ Total Available Room Nights × 100 for the selected period."
            />
            <MetricCard
              title="Avg Daily Rate (ADR)"
              value={formatCurrency(kpis.adr)}
              subtext={`RevPAR: ${formatCurrency(kpis.revpar)}`}
              icon={TrendingUp}
              iconColor="text-amber-600"
              tooltip="Average Daily Rate (ADR) = Room Revenue ÷ Sold Room Nights. Measures average rate earned per occupied room."
            />
          </div>

          {/* Secondary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">RevPAR</span>
              <span className="text-base font-extrabold text-slate-900">{formatCurrency(kpis.revpar)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Revenue / Avail Room</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Booking Value</span>
              <span className="text-base font-extrabold text-slate-900">{formatCurrency(kpis.averageBookingValue)}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Net Rev / Reservation</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cancellation Rate</span>
              <span className="text-base font-extrabold text-rose-600">{kpis.cancellationRate || 0}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{kpis.cancelledBookings} cancelled</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Stay</span>
              <span className="text-base font-extrabold text-slate-900">{kpis.averageStay || 0} Nights</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Per reservation</span>
            </div>
          </div>

          {/* Revenue & Booking Trends Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue Trend Line/Area Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revenue Trend</h3>
                  <p className="text-xs text-slate-500">Daily financial earnings for the selected period</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {formatCurrency(kpis.netRevenue)} Total
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {data.revenueTrends?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No revenue data recorded for this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueTrends}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(val) => [`₹${val}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Booking Volume Trend Bar Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Booking Volume Trend</h3>
                  <p className="text-xs text-slate-500">Total vs confirmed reservation count</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {kpis.totalBookings} Total Bookings
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {data.bookingTrends?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No booking data recorded for this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bookingTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="bookings" name="Total Bookings" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="confirmedBookings" name="Confirmed Stays" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Room Type Performance Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Room Type Performance</h3>
              <p className="text-xs text-slate-500">Breakdown of revenue, reservations, and occupancy % by room option</p>
            </div>

            {data.roomPerformance?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No room performance data available for this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Room Option</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Bookings</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3 rounded-r-xl">Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.roomPerformance.map((room) => (
                      <tr key={room.roomId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{room.name}</td>
                        <td className="p-3 text-slate-500 capitalize">{room.type}</td>
                        <td className="p-3 font-medium text-slate-700">{room.bookings}</td>
                        <td className="p-3 font-extrabold text-emerald-600">{formatCurrency(room.revenue)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, room.occupancy)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 text-[11px]">{room.occupancy}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Operational Widgets: Upcoming Stays & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Stays Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Guest Stays</h3>
                </div>
                <Link to="/manager/bookings" className="text-xs font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              {data.upcomingStays?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No upcoming guest check-ins scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {data.upcomingStays.map((b) => (
                    <div key={b._id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{b.user?.name || 'Guest'}</span>
                        <span className="text-[11px] text-slate-500">{b.room?.name} • {b.guests} guests</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-blue-600 block">
                          {new Date(b.checkIn).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">{b.bookingReference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Verified Payments Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Verified Receipts
                </span>
              </div>

              {data.recentTransactions?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent transactions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentTransactions.map((tx) => (
                    <div key={tx.paymentId} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{tx.guestName}</span>
                        <span className="text-[11px] text-slate-500">{tx.hotelName} • {tx.bookingReference}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 block">{formatCurrency(tx.amount)}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default ManagerAnalyticsPage;
