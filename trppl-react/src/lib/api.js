// src/lib/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    // Normalise error message
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (formData) => api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyOtp:      (data)     => api.post('/auth/verify-otp', data),
  resendOtp:      (data)     => api.post('/auth/resend-otp', data),
  login:          (data)     => api.post('/auth/login', data),
  me:             ()         => api.get('/auth/me'),
  checkUsername:  (username) => api.get('/auth/check-username', { params: { username } }),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  get:         ()      => api.get('/profile/me'),
  update:      (data)  => api.put('/profile/update', data),
  addPhotos:   (fd)    => api.post('/profile/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (index) => api.delete(`/profile/photos/${index}`),
};

// ── Verification ──────────────────────────────────────────────────────────────
export const verifyApi = {
  phrase: ()    => api.get('/verification/phrase'),
  status: ()    => api.get('/verification/status'),
  submit: (fd)  => api.post('/verification/submit', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
};

// ── Matches ───────────────────────────────────────────────────────────────────
export const matchesApi = {
  like:       (targetId) => api.post(`/matches/like/${targetId}`),
  getAll:     ()         => api.get('/matches'),
  getTrppls:  ()         => api.get('/matches/trppl'),
  gameResult: (trpplId, data) => api.post(`/matches/trppl/${trpplId}/game-result`, data),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create:   (data) => api.post('/bookings', data),
  getAll:   ()     => api.get('/bookings'),
  respond:  (id, data) => api.put(`/bookings/${id}/respond`, data),
  complete: (id)   => api.put(`/bookings/${id}/complete`),
  cancel:   (id)   => api.delete(`/bookings/${id}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll:    ()   => api.get('/notifications'),
  markAllRead:()  => api.put('/notifications/read'),
  markRead:  (id) => api.put(`/notifications/${id}/read`),
};

// ── Trivia ────────────────────────────────────────────────────────────────────
export const triviaApi = {
  questions: (country) => api.post('/trivia/questions', { country }),
};
