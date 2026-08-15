import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Nestly</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curated hotel stays, serene resorts, and modern suites tailored for comfort, trust, and simple hospitality.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/hotels" className="hover:text-white transition-colors">All Hotels</Link></li>
              <li><Link to="/hotels?location=Delhi" className="hover:text-white transition-colors">Hotels in Delhi</Link></li>
              <li><Link to="/hotels?location=Mumbai" className="hover:text-white transition-colors">Hotels in Mumbai</Link></li>
              <li><Link to="/hotels?location=Goa" className="hover:text-white transition-colors">Resorts in Goa</Link></li>
              <li><Link to="/hotels?location=Bengaluru" className="hover:text-white transition-colors">Stays in Bengaluru</Link></li>
            </ul>
          </div>

          {/* Value Highlights */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Why Nestly</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                Verified Hotel Listings
              </li>
              <li className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0" />
                Transparent Pricing
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                Seamless Room Selection
              </li>
            </ul>
          </div>

          {/* Phase 1 Note */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">About Nestly</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nestly Phase 1 (MERN Foundation) provides a clean, fast hotel discovery experience built with React, Node.js, Express, and MongoDB.
            </p>
            <div className="text-xs text-blue-400 font-mono bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
              Phase 1 • MERN Stack Foundation
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Nestly Hospitality Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
