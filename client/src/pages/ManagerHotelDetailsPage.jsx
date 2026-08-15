import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, MapPin, Star, Building2, BedDouble, Check, Trash2, Power } from 'lucide-react';
import RoomFormModal from '../components/RoomFormModal';
import { formatPrice, formatRating } from '../utils/formatters';
import hotelService from '../services/hotelService';

const ManagerHotelDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Room CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  const fetchHotelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hotelService.getHotelById(id);
      setHotel(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch hotel details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHotelData();
    }
  }, [id]);

  const handleOpenAddRoom = () => {
    setSelectedRoom(null);
    setIsEditingRoom(false);
    setModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setSelectedRoom(room);
    setIsEditingRoom(true);
    setModalOpen(true);
  };

  const handleSaveRoom = async (roomData) => {
    if (isEditingRoom && selectedRoom) {
      await hotelService.updateRoom(selectedRoom._id, roomData);
    } else {
      await hotelService.createRoom(id, roomData);
    }
    await fetchHotelData();
  };

  const handleDeactivateRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to deactivate this room package?')) {
      try {
        await hotelService.deactivateRoom(roomId);
        await fetchHotelData();
      } catch (err) {
        alert(err.message || 'Failed to deactivate room');
      }
    }
  };

  const handleToggleHotelStatus = async () => {
    if (!hotel) return;
    const newStatus = hotel.status === 'active' ? 'inactive' : 'active';
    const actionLabel = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${actionLabel} ${hotel.name}?`)) {
      try {
        await hotelService.updateHotel(hotel._id, { status: newStatus });
        await fetchHotelData();
      } catch (err) {
        alert(err.message || 'Failed to update hotel status');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading manager property workspace...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error || 'Hotel property not found'}
        </div>
        <Link to="/manager" className="text-xs font-semibold text-blue-700 hover:underline">
          Return to Manager Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/manager"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Manager Dashboard
        </Link>

        {/* Property Overview Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                hotel.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {hotel.status}
              </span>
              <span className="text-xs text-slate-400">• {hotel.city}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{hotel.name}</h1>

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{hotel.location}</span>
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to={`/manager/hotels/${hotel._id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Property</span>
            </Link>

            <button
              onClick={handleToggleHotelStatus}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                hotel.status === 'active'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{hotel.status === 'active' ? 'Deactivate Hotel' : 'Activate Hotel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Property Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Starting Rate</span>
          <span className="text-2xl font-bold text-slate-900 block">{formatPrice(hotel.startingPrice)}</span>
          <span className="text-[11px] text-slate-500">Calculated from available room packages</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Room Packages</span>
          <span className="text-2xl font-bold text-slate-900 block">{hotel.rooms ? hotel.rooms.length : 0}</span>
          <span className="text-[11px] text-slate-500">Configured accommodation types</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Guest Rating</span>
          <span className="text-2xl font-bold text-slate-900 block flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            {formatRating(hotel.rating)}
          </span>
          <span className="text-[11px] text-slate-500">{hotel.reviewCount || 0} reviews</span>
        </div>
      </div>

      {/* Room Inventory Management Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Room Inventory & Pricing</h2>
            <p className="text-xs text-slate-500">Manage room specifications, capacity, and rates</p>
          </div>

          <button
            onClick={handleOpenAddRoom}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room Package</span>
          </button>
        </div>

        {/* Room List */}
        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="space-y-4">
            {hotel.rooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center md:items-start justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {room.type}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      room.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {room.status}
                    </span>
                    <span className="text-xs text-slate-400">• Up to {room.capacity} Guests</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{room.description}</p>

                  {/* Amenities */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {room.amenities.map((a, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6 gap-3 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-xl font-bold text-slate-900">{formatPrice(room.pricePerNight)}</span>
                    <span className="text-xs text-slate-400 block">/ night • {room.totalRooms || 10} units</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditRoom(room)}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Edit Room"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {room.status === 'available' && (
                      <button
                        onClick={() => handleDeactivateRoom(room._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Deactivate Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <BedDouble className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">No room options created for this property yet.</p>
            <button
              onClick={handleOpenAddRoom}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Room</span>
            </button>
          </div>
        )}
      </div>

      {/* Room Creation & Edit Modal */}
      <RoomFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveRoom}
        initialRoom={selectedRoom}
        isEditing={isEditingRoom}
      />

    </div>
  );
};

export default ManagerHotelDetailsPage;
