import React, { useState, useEffect } from 'react';
import { X, Star, AlertCircle, ShieldCheck } from 'lucide-react';
import reviewService from '../services/reviewService';

const ReviewFormModal = ({ isOpen, onClose, bookingId, existingReview, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [categories, setCategories] = useState({
    cleanliness: existingReview?.categories?.cleanliness || 5,
    location: existingReview?.categories?.location || 5,
    service: existingReview?.categories?.service || 5,
    value: existingReview?.categories?.value || 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
      setCategories({
        cleanliness: existingReview.categories?.cleanliness || 5,
        location: existingReview.categories?.location || 5,
        service: existingReview.categories?.service || 5,
        value: existingReview.categories?.value || 5,
      });
    }
  }, [existingReview]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment || comment.trim().length < 10) {
      setError('Please write at least 10 characters describing your stay.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        bookingId,
        rating,
        title,
        comment,
        categories,
      };

      if (existingReview) {
        await reviewService.updateReview(existingReview._id, payload);
      } else {
        await reviewService.createReview(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarInput = (val, setVal) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setVal(star)}
          className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
        >
          <Star className={`w-5 h-5 ${star <= val ? 'fill-amber-400' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Verified Stay Review
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              {existingReview ? 'Edit Your Review' : 'How Was Your Stay?'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Overall Rating */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900">Overall Experience Rating *</span>
            {renderStarInput(rating, setRating)}
          </div>

          {/* Optional Categories */}
          <div className="space-y-2 border-t border-b border-slate-100 py-3">
            <span className="font-bold text-slate-700 block">Rate Specific Areas (Optional)</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cleanliness</span>
                {renderStarInput(categories.cleanliness, (v) => setCategories((prev) => ({ ...prev, cleanliness: v })))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Location</span>
                {renderStarInput(categories.location, (v) => setCategories((prev) => ({ ...prev, location: v })))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Service</span>
                {renderStarInput(categories.service, (v) => setCategories((prev) => ({ ...prev, service: v })))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Value</span>
                {renderStarInput(categories.value, (v) => setCategories((prev) => ({ ...prev, value: v })))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="font-bold text-slate-900 block mb-1">Review Headline (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Excellent stay, very clean room!"
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="font-bold text-slate-900 block mb-1">Your Stay Experience *</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other guests about the room quality, hospitality, cleanliness, amenities, or location..."
              minLength={10}
              maxLength={2000}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 block mt-1 text-right">{comment.length} / 2000 characters</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm disabled:opacity-75"
            >
              {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Publish Review'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ReviewFormModal;
