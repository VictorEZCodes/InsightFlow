import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password }),
};

export const analyticsAPI = {
  getDashboardData: () =>
    api.get('/analytics/dashboard'),

  addWebsite: (domain) =>
    api.post('/analytics/websites', { domain }),

  deleteWebsite: (websiteId) =>
    api.delete(`/analytics/websites/${websiteId}`),

  trackPageView: (websiteId, data) =>
    api.post(`/analytics/${websiteId}/pageview`, data),
};