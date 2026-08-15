import React from 'react';
import { Building, Plus, Hotel, ShieldCheck, CheckCircle2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const ManagerDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-md">
            Manager Access Protected
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Hotel Management Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Logged in as {user?.name} ({user?.email})</p>
        </div>

        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-500 font-medium text-xs rounded-xl cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property (Phase 3)</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Hotel className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">12</span>
          <span className="text-xs text-slate-500 font-medium">Assigned Properties</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">36</span>
          <span className="text-xs text-slate-500 font-medium">Configured Rooms</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-slate-900 block">Active</span>
          <span className="text-xs text-slate-500 font-medium">RBAC Security Status</span>
        </div>
      </div>

      {/* Roadmap Phase 3 Preview Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Phase 2 Authorization Verified</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          You are currently viewing the **Manager Protected Route** (`/manager`). Backend authorization middleware (`authorize('manager')`) has verified your account role.
        </p>

        <div className="space-y-2 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phase 2 (Completed): Backend RBAC & Manager Role Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Phase 3 (Upcoming): Full Hotel CRUD UI, Room inventory manager & Property editing</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ManagerDashboardPage;
