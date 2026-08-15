import React, { useState } from 'react';
import { Star, ShieldCheck, Flag, MessageSquare, AlertCircle } from 'lucide-react';
import reviewService from '../services/reviewService';
import useAuth from '../hooks/useAuth';

const ReviewCard = ({ review, onReportSuccess }) => {
  const { user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [reportError, setReportError] = useState(null);

  const formattedDate = new Date(review.createdAt).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to report a review.');
      return;
    }

    try {
      setReporting(true);
      setReportError(null);
      await reviewService.reportReview(review._id, reason, description);
      setReportMsg('Thank you. This review has been reported for moderation.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportMsg('');
        if (onReportSuccess) onReportSuccess();
      }, 2000);
    } catch (err) {
      setReportError(err.message || 'Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      
      {/* User Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <img
            src={review.user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
            alt={review.user?.name || 'Guest'}
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{review.user?.name || 'Verified Guest'}</span>
              {review.isVerifiedStay && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Stay
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">Reviewed on {formattedDate}</span>
          </div>
        </div>

        {/* Report Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1"
          title="Report Inappropriate Review"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>

      {/* Star Rating & Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400' : 'text-slate-200'}`}
              />
            ))}
          </div>
          {review.title && <h4 className="font-bold text-slate-900 text-sm">{review.title}</h4>}
        </div>

        {/* Review Comment */}
        <p className="text-xs text-slate-700 leading-relaxed pt-1 whitespace-pre-line">{review.comment}</p>
      </div>

      {/* Optional Category Ratings Pills */}
      {review.categories && (review.categories.cleanliness || review.categories.service) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-500">
          {review.categories.cleanliness && (
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Cleanliness: {review.categories.cleanliness}★</span>
          )}
          {review.categories.location && (
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Location: {review.categories.location}★</span>
          )}
          {review.categories.service && (
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Service: {review.categories.service}★</span>
          )}
          {review.categories.value && (
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg">Value: {review.categories.value}★</span>
          )}
        </div>
      )}

      {/* Official Manager Response Box */}
      {review.managerResponse && review.managerResponse.comment && (
        <div className="mt-4 p-4 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-purple-900 text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            <span>Response from Property Management</span>
            <span className="text-[10px] font-normal text-purple-500 ml-auto">
              {new Date(review.managerResponse.respondedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed pt-1 whitespace-pre-line">
            "{review.managerResponse.comment}"
          </p>
        </div>
      )}

      {/* Report Review Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">Report Inappropriate Review</h3>

            {reportMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-medium">{reportMsg}</div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                {reportError && <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">{reportError}</div>}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reason for Report</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="spam">Spam or Advertisement</option>
                    <option value="offensive">Offensive or Inappropriate Content</option>
                    <option value="harassment">Harassment or Hate Speech</option>
                    <option value="fake">Fake or Fraudulent Stay Review</option>
                    <option value="irrelevant">Irrelevant to Property Stay</option>
                    <option value="other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Additional Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details for platform moderation team..."
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
                  >
                    {reporting ? 'Reporting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ReviewCard;
