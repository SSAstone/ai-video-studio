import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
              refreshToken,
            });
            if (data.success && data.data?.tokens) {
              localStorage.setItem('access_token', data.data.tokens.accessToken);
              localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
              return api(originalRequest);
            }
          } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_session');
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

