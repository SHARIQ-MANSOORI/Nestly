import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, ShieldCheck, ArrowLeft, AlertCircle, Check, X } from 'lucide-react';
import reviewService from '../services/reviewService';

const ManagerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchManagerReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reviewService.getManagerReviews();
      setReviews(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load guest reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerReviews();
  }, []);

  const handleOpenResponseModal = (rev) => {
    setRespondingId(rev._id);
    setResponseText(rev.managerResponse?.comment || '');
  };

  const handlePublishResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    try {
      setSubmitting(true);
      await reviewService.postManagerResponse(respondingId, responseText);
      await fetchManagerReviews();
      setRespondingId(null);
      setResponseText('');
    } catch (err) {
      alert(err.message || 'Failed to publish response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/manager"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manager Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Guest Reviews & Reputation</h1>
          <p className="text-xs text-slate-500">Monitor guest feedback and post official management responses for your properties</p>
        </div>

        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 self-start sm:self-center">
          {reviews.length} Guest Reviews Received
        </span>
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
          Loading guest reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Star className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Guest Reviews Yet</h3>
          <p className="text-xs text-slate-500">
            Reviews will appear here once guests complete stay reservations at your listed properties.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{rev.hotel?.name}</h3>
                    <span className="text-xs text-slate-400">• {rev.hotel?.city}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    By <span className="font-semibold text-slate-900">{rev.user?.name || 'Guest'}</span> on{' '}
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenResponseModal(rev)}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  {rev.managerResponse?.comment ? 'Edit Response' : 'Respond to Guest'}
                </button>
              </div>

              {/* Rating & Comment */}
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

              {/* Official Response */}
              {rev.managerResponse?.comment && (
                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-purple-900 font-bold">
                    <span>Your Response:</span>
                    <span className="text-[10px] font-normal text-purple-500">
                      {new Date(rev.managerResponse.respondedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-purple-800">"{rev.managerResponse.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {respondingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Post Official Management Response</h3>
            <p className="text-xs text-slate-500">Your response will be displayed publicly under the guest's review on Nestly.</p>

            <form onSubmit={handlePublishResponse} className="space-y-4">
              <textarea
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Thank the guest for their feedback and address any specific questions or concerns..."
                required
                maxLength={1000}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRespondingId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-sm disabled:opacity-75"
                >
                  {submitting ? 'Publishing...' : 'Publish Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerReviewsPage;
