import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatPrice, formatRating } from '../utils/formatters';

const HotelCard = ({ hotel }) => {
  const mainImage = hotel.images && hotel.images.length > 0
    ? hotel.images[0]
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={mainImage}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-sm border border-slate-200/50">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{formatRating(hotel.rating)}</span>
          <span className="text-slate-400 text-[10px]">({hotel.reviewCount || 0})</span>
        </div>

        {/* City Tag */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
          <MapPin className="w-3 h-3 text-blue-400" />
          {hotel.city}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
              {hotel.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{hotel.location}</span>
          </p>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
            {hotel.description}
          </p>

          {/* Top Amenities Chips */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 3 && (
                <span className="inline-block bg-slate-50 text-slate-400 text-[11px] px-1.5 py-0.5 rounded-md">
                  +{hotel.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Price & CTA */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900">{formatPrice(hotel.startingPrice)}</span>
              <span className="text-xs text-slate-500 font-normal">/ night</span>
            </div>
          </div>

          <Link
            to={`/hotels/${hotel._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
