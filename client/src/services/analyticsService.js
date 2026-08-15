import api from './api';

const analyticsService = {
  // Get Manager Analytics Overview
  getManagerOverview: async (filter = '30d', from = null, to = null) => {
    const params = { filter };
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get('/analytics/manager/overview', { params });
    return response.data;
  },

  // Get Admin Platform Analytics Overview
  getAdminOverview: async (filter = '30d', from = null, to = null) => {
    const params = { filter };
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get('/analytics/admin/overview', { params });
    return response.data;
  },
};

export default analyticsService;
