import api from './api';

export const hotelService = {
  // Public methods
  getHotels: async (params = {}) => {
    const response = await api.get('/hotels', { params });
    return response.data;
  },

  getHotelById: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  },

  getRoomsByHotel: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/rooms`);
    return response.data;
  },

  // Manager methods
  getManagerHotels: async () => {
    const response = await api.get('/hotels/manager/my-hotels');
    return response.data;
  },

  createHotel: async (hotelData) => {
    const response = await api.post('/hotels', hotelData);
    return response.data;
  },

  updateHotel: async (id, hotelData) => {
    const response = await api.put(`/hotels/${id}`, hotelData);
    return response.data;
  },

  deactivateHotel: async (id) => {
    const response = await api.delete(`/hotels/${id}`);
    return response.data;
  },

  createRoom: async (hotelId, roomData) => {
    const response = await api.post(`/hotels/${hotelId}/rooms`, roomData);
    return response.data;
  },

  updateRoom: async (roomId, roomData) => {
    const response = await api.put(`/rooms/${roomId}`, roomData);
    return response.data;
  },

  deactivateRoom: async (roomId) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  },
};

export default hotelService;
