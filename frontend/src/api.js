import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (username, email, password) => 
    api.post('/api/auth/register', { username, email, password, role: 'operator' }),
  login: (username, password) => 
    api.post('/api/auth/login', { username, email: `${username}@test.com`, password, role: 'operator' }),
  getMe: () => api.get('/api/auth/me'),
};

export const consumerAPI = {
  list: () => api.get('/api/consumers/'),
  get: (id) => api.get(`/api/consumers/${id}`),
  create: (consumerData) => api.post('/api/consumers/', consumerData),
  update: (id, updateData) => api.put(`/api/consumers/${id}`, updateData),
  delete: (id) => api.delete(`/api/consumers/${id}`),
};

export const readingsAPI = {
  list: () => api.get('/api/readings/'),
  predict: (readingData) => api.post('/api/readings/predict', readingData),
  getHistory: (consumerId) => api.get(`/api/readings/consumer/${consumerId}`),
};

export const alertAPI = {
  list: (statusFilter) => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    return api.get('/api/alerts/', { params });
  },
  listActive: () => api.get('/api/alerts/active'),
  resolve: (id, resolvedBy) => api.put(`/api/alerts/${id}/resolve`, { resolved_by: resolvedBy }),
};

export default api;
