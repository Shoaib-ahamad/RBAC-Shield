// src/services/api.ts
import axios from 'axios';

// In-Memory storage of the short-lived access token (Highly Secure)
let accessTokenMemory: string | null = null;
let logoutCallback: (() => void) | null = null;

export const setLocalAccessToken = (token: string | null) => {
  accessTokenMemory = token;
};

export const registerLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true // Transmit HTTP-Only cookies (refreshToken) with every request
});

// Request Interceptor: Attach the short-lived Access Token in headers
api.interceptors.request.use(
  (config) => {
    if (accessTokenMemory && config.headers) {
      config.headers.Authorization = `Bearer ${accessTokenMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Trap 401 errors and attempt automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried retrying this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint to rotate cookies and get a new access token
        const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        
        // Save the new access token in memory
        setLocalAccessToken(data.accessToken);

        // Update headers and retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh failed (refresh token expired/blacklisted), log out user
        setLocalAccessToken(null);
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
