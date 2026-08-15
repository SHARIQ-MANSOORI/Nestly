import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Hotel, MapPin, Edit, Settings, ArrowRight, ShieldCheck, Power, BarChart3, BedDouble } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import hotelService from '../services/hotelService';
import useAuth from '../hooks/useAuth';

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hotelService.getManagerHotels();
      setHotels(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch manager properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyHotels();
  }, []);

  const handleToggleStatus = async (hotel) => {
    const newStatus = hotel.status === 'active' ? 'inactive' : 'active';
    const actionLabel = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${actionLabel} ${hotel.name}?`)) {
      try {
        await hotelService.updateHotel(hotel._id, { status: newStatus });
        await fetchMyHotels();
      } catch (err) {
        alert(err.message || 'Failed to update status');
      }
    }
  };

  const totalRoomsCount = hotels.reduce((acc, h) => acc + (h.roomCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
              Manager Portal
            </span>
            <span className="text-xs text-slate-400">• Ownership Verification Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">My Hotel Properties</h1>
          <p className="text-xs text-slate-500 mt-1">Logged in as {user?.name} ({user?.email})</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/manager/analytics"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Property Analytics</span>
          </Link>

          <Link
            to="/manager/hotels/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
          </Link>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Hotel className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">{hotels.length}</span>
          <span className="text-xs text-slate-500 font-medium">Owned Hotel Properties</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">{totalRoomsCount}</span>
          <span className="text-xs text-slate-500 font-medium">Active Room Options</span>
        </div>

        <Link
          to="/manager/analytics"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2 hover:border-blue-400 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-900 block">Analytics</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-xs text-slate-500 font-medium">Revenue, Occupancy % & ADR Reports</span>
        </Link>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Managed Properties</h2>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 animate-pulse">
            Loading properties...
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <Hotel className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No properties listed yet</h3>
              <p className="text-xs text-slate-500">Add your first hotel property to configure rooms and start receiving bookings.</p>
            </div>
            <Link
              to="/manager/hotels/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>List First Property</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => {
              const mainImage = hotel.images && hotel.images.length > 0
                ? hotel.images[0]
                : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';

              return (
                <div
                  key={hotel._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Hotel Image */}
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                      <img src={mainImage} alt={hotel.name} className="w-full h-full object-cover" />
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        hotel.status === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-700 text-white'
                      }`}>
                        {hotel.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{hotel.name}</h3>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="line-clamp-1">{hotel.city} • {hotel.location}</span>
                      </p>

                      <p className="text-xs text-slate-600 line-clamp-2 pt-1">{hotel.description}</p>

                      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>{hotel.roomCount || 0} Room Options</span>
                        <span className="font-bold text-slate-900">{formatPrice(hotel.startingPrice)} <span className="font-normal text-slate-400">/ night</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                    <Link
                      to={`/manager/hotels/${hotel._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      <span>Manage Rooms</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link
                        to={`/manager/hotels/${hotel._id}/edit`}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Edit Property"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(hotel)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={hotel.status === 'active' ? 'Deactivate Hotel' : 'Activate Hotel'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ManagerDashboardPage;
