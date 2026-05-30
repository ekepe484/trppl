// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user:  null,

      setToken: (token) => set({ token }),
      setUser:  (user)  => set({ user }),

      login: (token, user) => set({ token, user }),

      logout: () => {
        set({ token: null, user: null });
        window.location.href = '/login';
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

      isAuthenticated: () => !!get().token,
    }),
    {
      name:    'trppl-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
