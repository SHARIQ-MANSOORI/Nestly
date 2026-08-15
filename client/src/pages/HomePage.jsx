import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, ShieldCheck, HeartHandshake, Award, ArrowRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import HotelCard from '../components/HotelCard';
import { HotelCardSkeleton } from '../components/LoadingSkeleton';
import hotelService from '../services/hotelService';

const HomePage = () => {
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeaturedHotels = async () => {
      try {
        setLoading(true);
        const data = await hotelService.getHotels({ sort: 'rating_desc' });
        setFeaturedHotels(data.data.slice(0, 6)); // Top 6 featured hotels
      } catch (err) {
        setError(err.message || 'Failed to load featured hotels');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedHotels();
  }, []);

  const popularDestinations = [
    {
      name: 'Delhi',
      subtitle: 'Capital Heritage & Luxury',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
      count: '15+ Stays',
    },
    {
      name: 'Goa',
      subtitle: 'Sun, Sand & Beach Resorts',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800',
      count: '24+ Stays',
    },
    {
      name: 'Mumbai',
      subtitle: 'Skyline & Ocean Vistas',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=800',
      count: '18+ Stays',
    },
    {
      name: 'Bengaluru',
      subtitle: 'Tech Hub & Garden Suites',
      image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800',
      count: '12+ Stays',
    },
    {
      name: 'Jaipur',
      subtitle: 'Royal Palaces & Haveli Stays',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800',
      count: '10+ Stays',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Find a comfortable place to stay</span>
          </div>

          {/* Heading */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Hospitality built on <span className="text-blue-400">trust & simplicity.</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
              Discover handpicked luxury hotels, coastal resorts, and urban suites across India's finest destinations.
            </p>
          </div>

          {/* Hero Search Box */}
          <div className="max-w-4xl mx-auto pt-4">
            <SearchBar />
          </div>

          {/* Quick Assurance Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Verified Accommodations
            </span>
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-blue-400" />
              Transparent Room Pricing
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-400" />
              High Quality Standards
            </span>
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">Handpicked Stays</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Featured Hotels</h2>
          </div>
          <Link
            to="/hotels"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            <span>View All Hotels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <HotelCardSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Destinations / Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-slate-200 pb-4">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">Top Locations</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Popular Destinations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {popularDestinations.map((dest) => (
            <Link
              key={dest.name}
              to={`/hotels?location=${encodeURIComponent(dest.name)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-xl transition-all duration-300 block"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-4 text-white">
                <div className="flex items-center gap-1 text-xs text-blue-300 font-semibold mb-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {dest.count}
                </div>
                <h3 className="text-lg font-bold group-hover:text-blue-300 transition-colors">{dest.name}</h3>
                <p className="text-[11px] text-slate-300 line-clamp-1">{dest.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
