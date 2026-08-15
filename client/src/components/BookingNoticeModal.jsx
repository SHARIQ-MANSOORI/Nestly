import React from 'react';
import { Info, X, Calendar, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/formatters';

const BookingNoticeModal = ({ isOpen, onClose, room, hotel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative transform transition-all scale-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Info className="w-6 h-6" />
          </div>

          <div>
            <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md mb-2">
              Phase 1 Preview
            </span>
            <h3 className="text-xl font-bold text-slate-900">Booking Engine Status</h3>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Selected Room</p>
            <p className="text-sm font-bold text-slate-800">{room?.name || 'Room Option'}</p>
            {hotel && <p className="text-xs text-slate-600">{hotel.name} • {hotel.city}</p>}
            <p className="text-sm font-semibold text-blue-700 pt-1">
              {formatPrice(room?.pricePerNight)} <span className="text-xs text-slate-500 font-normal">/ night</span>
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Actual reservation, availability verification, and payment transactions belong to **Phase 4 & Phase 5** of the Nestly roadmap.
          </p>

          <div className="space-y-2 pt-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Phase 1 (Current): Hotel discovery & Room browsing</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Phase 4: Live Booking Engine & Lock Engine</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex gap-3">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingNoticeModal;
