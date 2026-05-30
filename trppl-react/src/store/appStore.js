// src/store/appStore.js
import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Notifications
  notifications:  [],
  unreadCount:    0,
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
  }),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    unreadCount:   0,
  })),

  // Active Trppl
  activeTrppl:   null,
  setActiveTrppl: (t) => set({ activeTrppl: t }),

  // Selected love language for discover
  selectedLL:    '',
  setSelectedLL: (ll) => set({ selectedLL: ll }),

  // Current profile index on discover
  profileIdx:    0,
  setProfileIdx: (i) => set({ profileIdx: i }),
  nextProfile:   () => set((s) => ({ profileIdx: s.profileIdx + 1 })),
}));
