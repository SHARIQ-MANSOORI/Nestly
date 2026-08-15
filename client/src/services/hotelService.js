import api from './api';

export const hotelService = {
  // Fetch list of hotels with query params
  getHotels: async (params = {}) => {
    const response = await api.get('/hotels', { params });
    return response.data;
  },

  // Fetch single hotel details by ID
  getHotelById: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  },

  // Fetch rooms for a hotel
  getRoomsByHotel: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/rooms`);
    return response.data;
  },
};

export default hotelService;
