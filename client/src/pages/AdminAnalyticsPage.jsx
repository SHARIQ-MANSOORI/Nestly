import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Calendar, DollarSign, Shield, ArrowLeft, RefreshCw, AlertCircle, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import analyticsService from '../services/analyticsService';
import DateRangePicker from '../components/DateRangePicker';
import MetricCard from '../components/MetricCard';

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getAdminOverview(filter, customFrom, customTo);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAnalytics();
  }, [filter]);

  const handleCustomChange = (type, val) => {
    if (type === 'from') setCustomFrom(val);
    if (type === 'to') setCustomTo(val);
  };

  useEffect(() => {
    if (filter === 'custom' && customFrom && customTo) {
      fetchAdminAnalytics();
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
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Control Center
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Platform Analytics & Insights</h1>
          <p className="text-xs text-slate-500">Platform-wide financial earnings, user metrics, hotel rankings, and booking volume</p>
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
            onClick={fetchAdminAnalytics}
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
          <button onClick={fetchAdminAnalytics} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold">
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
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Platform Gross Revenue"
              value={formatCurrency(kpis.grossRevenue)}
              subtext={`Avg Booking: ${formatCurrency(kpis.averageBookingValue)}`}
              icon={DollarSign}
              iconColor="text-emerald-600"
            />
            <MetricCard
              title="Total Reservations"
              value={kpis.totalBookings || 0}
              subtext={`Cancellation Rate: ${kpis.cancellationRate || 0}%`}
              icon={Calendar}
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Active Properties"
              value={kpis.activeHotels || 0}
              subtext={`Total Properties: ${kpis.totalHotels || 0} | Rooms: ${kpis.totalRooms || 0}`}
              icon={Building2}
              iconColor="text-purple-600"
            />
            <MetricCard
              title="Platform Users"
              value={(kpis.totalCustomers || 0) + (kpis.totalManagers || 0)}
              subtext={`Customers: ${kpis.totalCustomers || 0} | Managers: ${kpis.totalManagers || 0}`}
              icon={Users}
              iconColor="text-amber-600"
            />
          </div>

          {/* Platform Growth Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Platform Revenue Trend */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform Revenue Trend</h3>
                  <p className="text-xs text-slate-500">Gross revenue earnings across all platform properties</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  {formatCurrency(kpis.grossRevenue)}
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {data.monthlyTrends?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No platform revenue recorded for this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyTrends}>
                      <defs>
                        <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(val) => [`₹${val}`, 'Platform Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#adminRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Platform Booking Volume */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform Booking Volume</h3>
                  <p className="text-xs text-slate-500">Total reservations created over time</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {kpis.totalBookings} Reservations
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                {data.monthlyTrends?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No booking data recorded for this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="bookings" name="Bookings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Top Performing Hotels Ranking Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Performing Properties</h3>
                <p className="text-xs text-slate-500">Ranked by total net revenue generated in the selected period</p>
              </div>
            </div>

            {data.topHotels?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No hotel performance rankings available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Rank</th>
                      <th className="p-3">Hotel Property</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Confirmed Bookings</th>
                      <th className="p-3 rounded-r-xl">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.topHotels.map((hotel, idx) => (
                      <tr key={hotel.hotelId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[11px] ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{hotel.name}</td>
                        <td className="p-3 text-slate-500">{hotel.city}</td>
                        <td className="p-3 font-semibold text-slate-700">{hotel.bookings}</td>
                        <td className="p-3 font-extrabold text-emerald-600">{formatCurrency(hotel.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default AdminAnalyticsPage;
