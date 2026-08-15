import api from './api';

export const paymentService = {
  createOrder: async (bookingId) => {
    const response = await api.post('/payments/create-order', { bookingId });
    return response.data;
  },

  verifyPayment: async (verificationData) => {
    const response = await api.post('/payments/verify', verificationData);
    return response.data;
  },

  getMyPayments: async () => {
    const response = await api.get('/payments/my');
    return response.data;
  },

  getManagerPayments: async () => {
    const response = await api.get('/payments/manager/all');
    return response.data;
  },
};

export default paymentService;
