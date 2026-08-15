import React from 'react';
import { ShieldCheck, Users, Building, Activity, CheckCircle2 } from 'lucide-react';
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
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">3</span>
          <span className="text-xs text-slate-500 font-medium">Seed Accounts</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">12</span>
          <span className="text-xs text-slate-500 font-medium">Listed Hotels</span>
        </div>

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
        <h3 className="text-lg font-bold text-slate-900">Admin Authorization Active</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          You are viewing the **Admin Protected Route** (`/admin`). Express backend authorization middleware (`authorize('admin')`) has validated your administrative security credentials.
        </p>

        <div className="space-y-2 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phase 2 (Completed): Admin Identity & Access Control System</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Phase 7 (Upcoming): Admin platform control, User management, & Revenue dashboards</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
