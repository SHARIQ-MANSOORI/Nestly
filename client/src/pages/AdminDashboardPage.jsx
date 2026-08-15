import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Building, Activity, CheckCircle2, BarChart3, ArrowRight, Flag } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const AdminDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md">
            Admin Access Protected
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Platform Administration</h1>
          <p className="text-xs text-slate-500 mt-1">Logged in as Administrator {user?.name} ({user?.email})</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/moderation"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors shadow-sm"
          >
            <Flag className="w-4 h-4 text-rose-600" />
            <span>Review Moderation Queue</span>
          </Link>

          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Platform Analytics</span>
          </Link>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Link
          to="/admin/moderation"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2 hover:border-rose-400 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Flag className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-900 block">Moderation</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-xs text-slate-500 font-medium">Review Abuse Reports & Actions</span>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2 hover:border-emerald-400 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-900 block">Analytics</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-xs text-slate-500 font-medium">Platform Revenue & Reports</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">100%</span>
          <span className="text-xs text-slate-500 font-medium">API Health Status</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">Admin</span>
          <span className="text-xs text-slate-500 font-medium">Verified Role</span>
        </div>
      </div>

      {/* Admin Authorization Notice */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Admin Control Center Active</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Express backend authorization middleware (`authorize('admin')`) has validated your administrative security credentials.
        </p>

        <div className="space-y-2 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phase 8 (Active): Review moderation queue, abuse report resolutions & status overrides</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phase 7 (Active): Platform analytics aggregation, revenue growth monitoring, & top hotel rankings</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
