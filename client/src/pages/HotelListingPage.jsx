import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, MapPin, X } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import HotelCard from '../components/HotelCard';
import FilterSidebar from '../components/FilterSidebar';
import SortDropdown from '../components/SortDropdown';
import { HotelCardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import hotelService from '../services/hotelService';

const HotelListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Extract filter parameters from URL
  const locationParam = searchParams.get('location') || '';
  const searchParam = searchParams.get('search') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const sortParam = searchParams.get('sort') || 'rating_desc';

  const [filters, setFilters] = useState({
    location: locationParam,
    search: searchParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    minRating: minRatingParam,
  });

  const [sortOption, setSortOption] = useState(sortParam);

  // Keep local filter state synced with URL params
  useEffect(() => {
    setFilters({
      location: searchParams.get('location') || '',
      search: searchParams.get('search') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      minRating: searchParams.get('minRating') || '',
    });
    setSortOption(searchParams.get('sort') || 'rating_desc');
  }, [searchParams]);

  // Fetch hotels whenever searchParams change
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          location: searchParams.get('location') || undefined,
          search: searchParams.get('search') || undefined,
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined,
          minRating: searchParams.get('minRating') || undefined,
          sort: searchParams.get('sort') || 'rating_desc',
        };

        const res = await hotelService.getHotels(params);
        setHotels(res.data || []);
        if (res.cities) setCities(res.cities);
      } catch (err) {
        setError(err.message || 'Failed to fetch hotels.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [searchParams]);

  // Handle individual filter updates
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Handle sort update
  const handleSortChange = (newSort) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Explore Hotels</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {locationParam ? `Hotels in "${locationParam}"` : 'Browse handpicked hotels & luxury suites'}
            </p>
          </div>
        </div>

        <SearchBar
          initialLocation={locationParam}
          initialCheckIn={searchParams.get('checkIn') || ''}
          initialCheckOut={searchParams.get('checkOut') || ''}
          initialGuests={Number(searchParams.get('guests')) || 2}
        />
      </div>

      {/* Main Grid: Filters + Hotels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24">
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            cities={cities}
          />
        </aside>

        {/* Main Content Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar: Total Count + Mobile Filter Trigger + Sort */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </button>

              <span className="text-xs font-semibold text-slate-600">
                {loading ? 'Searching...' : `Showing ${hotels.length} Hotel${hotels.length === 1 ? '' : 's'}`}
              </span>
            </div>

            <SortDropdown value={sortOption} onChange={handleSortChange} />
          </div>

          {/* Active Filter Chips */}
          {(locationParam || minPriceParam || maxPriceParam || minRatingParam) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-400">Active filters:</span>
              {locationParam && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
                  <MapPin className="w-3 h-3" />
                  {locationParam}
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900 ml-1" onClick={() => handleFilterChange('location', '')} />
                </span>
              )}
              {(minPriceParam || maxPriceParam) && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
                  Price: ₹{minPriceParam || 0} – ₹{maxPriceParam || 'Any'}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-blue-900 ml-1"
                    onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', ''); }}
                  />
                </span>
              )}
              {minRatingParam && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
                  {minRatingParam}★ & above
                  <X className="w-3 h-3 cursor-pointer hover:text-blue-900 ml-1" onClick={() => handleFilterChange('minRating', '')} />
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs font-medium text-slate-500 hover:text-blue-700 underline underline-offset-2 ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Hotel Grid / Loading / Empty / Error */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <HotelCardSkeleton key={n} />
              ))}
            </div>
          ) : error ? (
            <ErrorAlert message={error} onRetry={handleResetFilters} />
          ) : hotels.length === 0 ? (
            <EmptyState onReset={handleResetFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Filter Hotels</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterSidebar
              filters={filters}
              onChange={(key, val) => {
                handleFilterChange(key, val);
                setMobileFilterOpen(false);
              }}
              onReset={() => {
                handleResetFilters();
                setMobileFilterOpen(false);
              }}
              cities={cities}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelListingPage;
