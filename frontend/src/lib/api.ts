import axios from 'axios';

const URL = "http://localhost:8000";

const api = axios.create({
  baseURL: URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// refresh tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If already tried refresh once, don't retry again
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refresh = localStorage.getItem('refreshToken');
            if (!refresh) return Promise.reject(error);

            const response = await api.post('/api/token/refresh/', { refresh });
            const newAccess = response.data.access;

            if (newAccess) {
                localStorage.setItem('accessToken', newAccess);
                originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                return api(originalRequest); // Retry original request
            }
        }

        return Promise.reject(error);
    }
)

export default api;
