import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import RoomCard from '../components/RoomCard';
import AvailabilityPicker from '../components/AvailabilityPicker';
import RatingBreakdown from '../components/RatingBreakdown';
import ReviewCard from '../components/ReviewCard';
import { HotelDetailsSkeleton } from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import { formatPrice, formatRating } from '../utils/formatters';
import hotelService from '../services/hotelService';
import reviewService from '../services/reviewService';

const HotelDetailsPage = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ reviews: [], page: 1, total: 0, totalPages: 1 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSort, setReviewsSort] = useState('recent');
  const [reviewsPage, setReviewsPage] = useState(1);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hotelService.getHotelById(id);
      setHotel(res.data);
    } catch (err) {
      setError(err.message || 'Hotel not found or error loading details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const res = await reviewService.getPublicHotelReviews(id, reviewsPage, 10, reviewsSort);
      setReviewsData(res.data || { reviews: [], page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      // Quiet fail if network glitch
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [id, reviewsPage, reviewsSort]);

  if (loading) {
    return <HotelDetailsSkeleton />;
  }

  if (error || !hotel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <ErrorAlert message={error || "Hotel could not be found."} />
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all hotels
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back Button & Breadcrumbs */}
      <div>
        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hotels
        </Link>

        {/* Header Title & Rating */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold uppercase tracking-wider">
              <span>{hotel.city}</span>
              <span>•</span>
              <span>{hotel.country}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{hotel.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{hotel.location}</span>
            </p>
          </div>

          <a
            href="#guest-reviews"
            className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0 hover:border-blue-400 transition-colors"
          >
            <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-200/60 flex items-center gap-1 font-bold text-lg">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{formatRating(hotel.averageRating || hotel.rating)}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Verified Stay Ratings</span>
              <span className="text-xs text-blue-700 font-semibold underline">{hotel.reviewCount || 0} reviews</span>
            </div>
          </a>
        </div>
      </div>

      {/* Image Gallery */}
      <ImageGallery images={hotel.images} />

      {/* Main Content: Overview + Availability Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Description & Amenities */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Hotel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">About this Hotel</h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
              {hotel.description}
            </p>
          </div>

          {/* Amenities & Facilities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">Popular Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {hotel.amenities && hotel.amenities.length > 0 ? (
                hotel.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Standard luxury amenities provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Live Availability & Rate Calculator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-24">
            <AvailabilityPicker hotel={hotel} rooms={hotel.rooms} />
          </div>
        </div>
      </div>

      {/* Available Rooms Section */}
      <div id="available-rooms" className="space-y-6 pt-4 border-t border-slate-200">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">Accommodation Options</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Configured Rooms & Packages</h2>
        </div>

        {hotel.rooms && hotel.rooms.length > 0 ? (
          <div className="space-y-4">
            {hotel.rooms.map((room) => (
              <RoomCard key={room._id} room={room} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            No specific room packages configured yet for this property.
          </div>
        )}
      </div>

      {/* Verified Guest Reviews Section */}
      <div id="guest-reviews" className="space-y-6 pt-8 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">Authentic Feedback</span>
            <h2 className="text-2xl font-extrabold text-slate-900">Verified Guest Reviews</h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Sort By:</label>
            <select
              value={reviewsSort}
              onChange={(e) => {
                setReviewsSort(e.target.value);
                setReviewsPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Rating Breakdown Component */}
        <RatingBreakdown
          averageRating={hotel.averageRating || hotel.rating || 4.5}
          reviewCount={hotel.reviewCount || 0}
          breakdown={hotel.ratingBreakdown || {}}
          categoryRatings={hotel.categoryRatings || {}}
        />

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading reviews...
          </div>
        ) : reviewsData.reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Reviews Published Yet</h3>
            <p className="text-xs text-slate-500">Be the first guest to share your experience after completing a stay!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsData.reviews.map((rev) => (
              <ReviewCard key={rev._id} review={rev} onReportSuccess={fetchReviews} />
            ))}

            {/* Pagination Controls */}
            {reviewsData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={reviewsPage === 1}
                  onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-slate-100 disabled:opacity-50 text-xs font-bold rounded-xl"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  Page {reviewsPage} of {reviewsData.totalPages}
                </span>
                <button
                  disabled={reviewsPage >= reviewsData.totalPages}
                  onClick={() => setReviewsPage((p) => p + 1)}
                  className="px-4 py-2 bg-slate-100 disabled:opacity-50 text-xs font-bold rounded-xl"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default HotelDetailsPage;
