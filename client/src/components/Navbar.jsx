import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Menu, X, Compass, Home, MapPin } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">Nestly</span>
            <span className="text-[10px] tracking-wider uppercase font-medium text-slate-500">Hotels & Stays</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/')}`}>
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link to="/hotels" className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/hotels')}`}>
            <Compass className="w-4 h-4" />
            Explore Hotels
          </Link>
          <Link to="/hotels?location=Goa" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            <MapPin className="w-4 h-4" />
            Goa Stays
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/hotels"
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Find Stays
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Home className="w-4 h-4 text-slate-500" />
            Home
          </Link>
          <Link
            to="/hotels"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            Explore Hotels
          </Link>
          <Link
            to="/hotels?location=Goa"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            <MapPin className="w-4 h-4 text-slate-500" />
            Goa Stays
          </Link>
          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/hotels"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block text-center px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Find Stays
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
