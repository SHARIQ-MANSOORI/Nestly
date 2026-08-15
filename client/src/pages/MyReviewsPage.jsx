import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Edit, Trash2, Calendar, Hotel, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import reviewService from '../services/reviewService';
import ReviewFormModal from '../components/ReviewFormModal';

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reviewService.getMyReviews();
      setReviews(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your submitted reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const handleEdit = (rev) => {
    setEditingReview(rev);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review? Your rating contribution will be removed.')) {
      try {
        await reviewService.deleteReview(id);
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        alert(err.message || 'Failed to delete review');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Reservations
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Stay Reviews</h1>
        <p className="text-xs text-slate-500">Manage and edit your published verified stay feedback</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading your reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Star className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Reviews Submitted Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can write verified stay reviews for any of your completed hotel stays from your reservations page.
          </p>
          <Link
            to="/bookings"
            className="inline-block px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl mt-2"
          >
            View Completed Stays
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{rev.hotel?.name || 'Hotel Property'}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Stay
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{rev.hotel?.city} • Ref: {rev.booking?.bookingReference || 'N/A'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rev)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rev._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rating & Content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  {rev.title && <h4 className="font-bold text-slate-900 text-sm">{rev.title}</h4>}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed pt-1">{rev.comment}</p>
              </div>

              {/* Manager Response */}
              {rev.managerResponse?.comment && (
                <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900 border border-purple-100 space-y-0.5">
                  <span className="font-bold block">Hotel Manager Response:</span>
                  <p className="text-purple-800">"{rev.managerResponse.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReview(null);
          }}
          bookingId={editingReview.booking?._id || editingReview.booking}
          existingReview={editingReview}
          onSuccess={fetchMyReviews}
        />
      )}

    </div>
  );
};

export default MyReviewsPage;
