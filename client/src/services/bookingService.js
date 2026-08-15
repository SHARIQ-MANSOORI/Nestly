import api from './api';

export const bookingService = {
  checkAvailability: async (hotelId, roomId, params) => {
    const response = await api.get(`/hotels/${hotelId}/rooms/${roomId}/availability`, { params });
    return response.data;
  },

  getQuote: async (quoteData) => {
    const response = await api.post('/bookings/quote', quoteData);
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id, cancellationReason = '') => {
    const response = await api.post(`/bookings/${id}/cancel`, { cancellationReason });
    return response.data;
  },

  getManagerBookings: async () => {
    const response = await api.get('/bookings/manager/all');
    return response.data;
  },
};

export default bookingService;
