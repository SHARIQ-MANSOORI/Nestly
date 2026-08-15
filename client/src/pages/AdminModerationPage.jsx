import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Flag, CheckCircle, EyeOff, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import reviewService from '../services/reviewService';

const AdminModerationPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reviewService.getAdminReports();
      setReports(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load reported reviews for moderation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleResolve = async (reportId, action) => {
    const actionText = action === 'action_taken' ? 'hide this review publicly and mark report as action taken' : 'dismiss this abuse report';
    if (window.confirm(`Are you sure you want to ${actionText}?`)) {
      try {
        await reviewService.resolveAdminReport(reportId, action);
        await fetchReports();
      } catch (err) {
        alert(err.message || 'Failed to resolve report');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Control Center
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Review Moderation Center</h1>
          <p className="text-xs text-slate-500">Inspect user-reported reviews, enforce community guidelines, and hide inappropriate content</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
            {reports.length} Pending Reports
          </span>
          <button
            onClick={fetchReports}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
            title="Refresh Reports"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading reported content...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Moderation Queue Clean!</h3>
          <p className="text-xs text-slate-500">There are currently no pending abuse reports requiring administrative action.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const rev = report.review;
            if (!rev) return null;

            return (
              <div key={report._id} className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-4">
                
                {/* Report Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-xs">
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <Flag className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Report Reason: <span className="uppercase text-rose-700">{report.reason}</span></span>
                    {report.description && <span className="font-normal text-rose-800">({report.description})</span>}
                  </div>

                  <span className="text-slate-500 text-[11px]">
                    Reported by <span className="font-semibold text-slate-900">{report.reportedBy?.name}</span> on{' '}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Review Snippet */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-900">{rev.hotel?.name || 'Hotel Property'}</span>
                    <span>Review Author: {rev.user?.name} ({rev.user?.email})</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">
                      ★ {rev.rating} — {rev.title || 'Untitled Review'}
                    </div>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{rev.comment}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 text-xs">
                  <button
                    onClick={() => handleResolve(report._id, 'dismissed')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleResolve(report._id, 'action_taken')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide & Take Action
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default AdminModerationPage;
