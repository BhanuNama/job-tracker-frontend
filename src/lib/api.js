import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on each request
api.interceptors.request.use((config) => {
    try {
        const stored = JSON.parse(localStorage.getItem('jobtrack-auth') || '{}');
        const token = stored?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('jobtrack-auth');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
