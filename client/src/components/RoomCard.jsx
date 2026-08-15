import React, { useState } from 'react';
import { Users, Check, Maximize2, BedDouble } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import BookingNoticeModal from './BookingNoticeModal';

const RoomCard = ({ room, hotel }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const roomImage = room.images && room.images.length > 0
    ? room.images[0]
    : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800';

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Room Photo */}
        <div className="w-full md:w-56 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 shrink-0">
          <img
            src={roomImage}
            alt={room.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Room Info */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              {room.type || 'Standard Room'}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Up to {room.capacity} Guests</span>
            </div>
          </div>

          <h4 className="text-lg font-bold text-slate-900">{room.name}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{room.description}</p>

          {/* Amenities Grid */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-2">
              {room.amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Box */}
        <div className="w-full md:w-48 pt-4 md:pt-0 md:border-l md:border-slate-100 md:pl-6 flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Price per night</span>
            <span className="text-2xl font-bold text-slate-900">{formatPrice(room.pricePerNight)}</span>
            <span className="text-[11px] text-emerald-600 block font-medium pt-0.5">Taxes included</span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-auto md:w-full py-2.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm text-center"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Phase 4 Information Notice Modal */}
      <BookingNoticeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        room={room}
        hotel={hotel}
      />
    </>
  );
};

export default RoomCard;
