import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-xs text-slate-500">Sign in to manage your bookings and profile</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Credentials Quick-Fill Bar for Local Testing */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
          <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">Development Test Credentials</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => { setEmail('customer@example.com'); setPassword('password123'); }}
              className="bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 font-medium text-slate-700 transition-colors"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setEmail('manager@example.com'); setPassword('password123'); }}
              className="bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 font-medium text-slate-700 transition-colors"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => { setEmail('admin@example.com'); setPassword('password123'); }}
              className="bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 font-medium text-slate-700 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-75"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-700 hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
