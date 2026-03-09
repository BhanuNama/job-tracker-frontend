import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post('/auth/login', { email, password });
                    set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    return { success: false, error: err.response?.data?.error || 'Login failed' };
                }
            },

            register: async (name, email, password) => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post('/auth/register', { name, email, password });
                    set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    return { success: false, error: err.response?.data?.error || 'Registration failed' };
                }
            },

            demoLogin: async () => {
                set({ isLoading: true });
                try {
                    const { data } = await api.post('/auth/demo');
                    set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                    return { success: true };
                } catch (err) {
                    set({ isLoading: false });
                    return { success: false, error: 'Demo login failed' };
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                delete api.defaults.headers.common['Authorization'];
            },

            initAuth: () => {
                const { token } = get();
                if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            },
        }),
        { name: 'jobtrack-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
    )
);

export default useAuthStore;
