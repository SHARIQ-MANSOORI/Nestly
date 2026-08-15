import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import RoomCard from '../components/RoomCard';
import AvailabilityPicker from '../components/AvailabilityPicker';
import { HotelDetailsSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import { formatPrice, formatRating } from '../utils/formatters';
import hotelService from '../services/hotelService';

const HotelDetailsPage = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await hotelService.getHotelById(id);
        setHotel(res.data);
      } catch (err) {
        setError(err.message || 'Hotel not found or error loading details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  if (loading) {
    return <HotelDetailsSkeleton />;
  }

  if (error || !hotel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ErrorAlert message={error || "Hotel could not be found."} />
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all hotels
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back Button & Breadcrumbs */}
      <div>
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hotels
        </Link>

        {/* Header Title & Rating */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold uppercase tracking-wider">
              <span>{hotel.city}</span>
              <span>•</span>
              <span>{hotel.country}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{hotel.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{hotel.location}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-200/60 flex items-center gap-1 font-bold text-lg">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{formatRating(hotel.rating)}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Exceptional</span>
              <span className="text-xs text-slate-400">{hotel.reviewCount || 0} verified reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery images={hotel.images} />

      {/* Main Content: Overview + Availability Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Description & Amenities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Hotel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">About this Hotel</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
              {hotel.description}
            </p>
          </div>

          {/* Amenities & Facilities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Popular Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {hotel.amenities && hotel.amenities.length > 0 ? (
                hotel.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Standard luxury amenities provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Live Availability & Rate Calculator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-24">
            <AvailabilityPicker hotel={hotel} rooms={hotel.rooms} />
          </div>
        </div>
      </div>

      {/* Available Rooms Section */}
      <div id="available-rooms" className="space-y-6 pt-4 border-t border-slate-200">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">Accommodation Options</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Configured Rooms & Packages</h2>
        </div>

        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="space-y-4">
            {hotel.rooms.map((room) => (
              <RoomCard key={room._id} room={room} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            No specific room packages configured yet for this property.
          </div>
        )}
      </div>

    </div>
  );
};

export default HotelDetailsPage;
