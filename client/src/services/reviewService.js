import api from './api';

const reviewService = {
  // Check verified stay review eligibility
  checkEligibility: async (bookingId) => {
    const response = await api.get(`/reviews/bookings/${bookingId}/review-eligibility`);
    return response.data;
  },

  // Submit verified review
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Public hotel reviews list
  getPublicHotelReviews: async (hotelId, page = 1, limit = 10, sort = 'recent') => {
    const response = await api.get(`/reviews/hotels/${hotelId}/reviews`, {
      params: { page, limit, sort },
    });
    return response.data;
  },

  // Customer submitted reviews
  getMyReviews: async () => {
    const response = await api.get('/reviews/my');
    return response.data;
  },

  // Edit review
  updateReview: async (id, reviewData) => {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  // Delete review
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  // Report review
  reportReview: async (id, reason, description = '') => {
    const response = await api.post(`/reviews/${id}/report`, { reason, description });
    return response.data;
  },

  // Manager property reviews
  getManagerReviews: async () => {
    const response = await api.get('/reviews/manager/all');
    return response.data;
  },

  // Post manager response
  postManagerResponse: async (id, comment) => {
    const response = await api.post(`/reviews/${id}/response`, { comment });
    return response.data;
  },

  // Admin reports list
  getAdminReports: async () => {
    const response = await api.get('/reviews/admin/reports');
    return response.data;
  },

  // Admin resolve report
  resolveAdminReport: async (id, action) => {
    const response = await api.patch(`/reviews/admin/reports/${id}`, { action });
    return response.data;
  },

  // Admin update status
  updateReviewStatusByAdmin: async (id, status) => {
    const response = await api.patch(`/reviews/admin/reviews/${id}/status`, { status });
    return response.data;
  },
};

export default reviewService;
