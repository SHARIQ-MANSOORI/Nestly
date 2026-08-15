import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="text-7xl font-extrabold text-blue-600 font-mono tracking-wider">404</div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-sm text-slate-500">
          The hotel page or link you requested does not exist or has been moved.
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Explore Hotels</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
