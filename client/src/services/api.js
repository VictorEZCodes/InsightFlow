import axios from 'axios';
import config from '../config.js';

const api = axios.create({
  baseURL: config.API_URL,
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

// Add WebSocket connection
export const initWebSocket = () => {
  const ws = new WebSocket(config.WS_URL);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(initWebSocket, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
};