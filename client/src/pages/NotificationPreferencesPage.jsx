import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import notificationService from '../services/notificationService';

const NotificationPreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    emailBookingConfirmation: true,
    emailPaymentUpdates: true,
    emailCancellationUpdates: true,
    emailManagerBookingUpdates: true,
    inAppBookingUpdates: true,
    inAppPaymentUpdates: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationService.getPreferences();
      if (res.data) {
        setPreferences((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');
      await notificationService.updatePreferences(preferences);
      setSuccessMsg('Notification preferences updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Back Navigation */}
      <div>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notifications
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Notification Settings</h1>
        <p className="text-xs text-slate-500">Configure how and when Nestly communicates reservation and payment updates</p>
      </div>

      {/* Notifications Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Form */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading preferences...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Email Notifications Group */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Email Notifications</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Booking Confirmation Emails</span>
                  <span className="text-[11px] text-slate-500">Receive HTML email receipt whenever a reservation is confirmed</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailBookingConfirmation}
                  onChange={() => handleToggle('emailBookingConfirmation')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-50 pt-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Payment Updates & Receipts</span>
                  <span className="text-[11px] text-slate-500">Receive email notification when payment is verified or failed</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailPaymentUpdates}
                  onChange={() => handleToggle('emailPaymentUpdates')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-50 pt-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Cancellation Updates</span>
                  <span className="text-[11px] text-slate-500">Receive email notice when a reservation is cancelled</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailCancellationUpdates}
                  onChange={() => handleToggle('emailCancellationUpdates')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-50 pt-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Manager Property Alerts</span>
                  <span className="text-[11px] text-slate-500">Receive email when guests book or cancel stays at your properties</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailManagerBookingUpdates}
                  onChange={() => handleToggle('emailManagerBookingUpdates')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* In-App Notifications Group */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">In-App Notifications</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">In-App Booking Updates</span>
                  <span className="text-[11px] text-slate-500">Receive notification bell alerts for booking confirmations and changes</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inAppBookingUpdates}
                  onChange={() => handleToggle('inAppBookingUpdates')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-50 pt-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">In-App Payment Updates</span>
                  <span className="text-[11px] text-slate-500">Receive notification bell alerts for payment status updates</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inAppPaymentUpdates}
                  onChange={() => handleToggle('inAppPaymentUpdates')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-slate-900 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-75"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Preferences'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};

export default NotificationPreferencesPage;
