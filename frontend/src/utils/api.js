import axios from 'axios';

// ✅ IMPORTANT: Backend URL (AWS)
const API = axios.create({
  baseURL: 'http://54.236.57.147:10000/api',
});

// 🔐 Token interceptor
API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('skystay_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================= AUTH =================
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (token, data) => API.put(`/auth/reset-password/${token}`, data),
  toggleWishlist: (data) => API.post('/auth/wishlist/toggle', data),
  getWishlist: () => API.get('/auth/wishlist'),

  // Notifications
  getNotifications: () => API.get('/users/notifications'),
  markNotifRead: (id) => API.put(`/auth/notifications/${id}/read`),
  markAllRead: () => API.put('/auth/notifications/read-all'),
  clearAllNotifs: () => API.delete('/auth/notifications/clear-all'),
  deleteNotif: (id) => API.delete(`/auth/notifications/${id}`),

  // Saved passengers
  getSavedPassengers: () => API.get('/users/saved-passengers'),
  savePassenger: (data) => API.post('/users/saved-passengers', data),
};

// ================= HOTELS =================
export const hotelAPI = {
  getAll: (params) => API.get('/hotels', { params }),
  getById: (id) => API.get(`/hotels/${id}`),
  search: (q) => API.get('/hotels/search', { params: { q } }),
  getFeatured: () => API.get('/hotels/featured'),
  create: (data) => API.post('/hotels', data),
  update: (id, data) => API.put(`/hotels/${id}`, data),
  delete: (id) => API.delete(`/hotels/${id}`),
  addReview: (id, data) => API.post(`/hotels/${id}/reviews`, data),
};

// ================= UPLOAD =================
export const uploadAPI = {
  hotelImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return API.post('/upload/hotel-image', formData);
  },
  postImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return API.post('/upload/post-image', formData);
  },
  avatar: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return API.post('/upload/avatar', formData);
  },
  deleteHotelImage: (filename) =>
    API.delete(`/upload/hotel-image/${filename}`),
};

// ================= FLIGHTS =================
export const flightAPI = {
  search: (params) => API.get('/flights/search', { params }),
  getById: (id) => API.get(`/flights/${id}`),
  getAll: (params) => API.get('/flights', { params }),
  create: (data) => API.post('/flights', data),
  update: (id, data) => API.put(`/flights/${id}`, data),
  delete: (id) => API.delete(`/flights/${id}`),
  setStatus: (id, data) =>
    API.put(`/flights/${id}/status`, data),
  setPriceAlert: (id, data) =>
    API.post(`/flights/${id}/price-alert`, data),
};

// ================= POSTS =================
export const postAPI = {
  getAll: (params) => API.get('/posts', { params }),
  create: (data) => API.post('/posts', data),
  toggleLike: (id) => API.post(`/posts/${id}/like`),
  addComment: (id, text) =>
    API.post(`/posts/${id}/comment`, { text }),
  delete: (id) => API.delete(`/posts/${id}`),
};

// ================= BOOKINGS =================
export const bookingAPI = {
  create: (data) => API.post('/bookings', data),
  getMyBookings: () => API.get('/bookings/my'),
  getMyRefunds: () => API.get('/bookings/my/refunds'),
  getById: (id) => API.get(`/bookings/${id}`),
  refund: (id, data) => API.post(`/bookings/${id}/refund`, data),
  cancel: (id, reason) =>
    API.put(`/bookings/${id}/cancel`, { reason }),
  checkIn: (id) => API.put(`/bookings/${id}/checkin`),
  getAll: (params) => API.get('/bookings', { params }),
  updateStatus: (id, data) =>
    API.put(`/bookings/${id}/status`, data),
  getBill: (id) => API.get(`/bookings/${id}/bill`),
};

// ================= ADMIN =================
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getAllUsers: (params) => API.get('/admin/users', { params }),
  getAdmins: () => API.get('/admin/admins'),
  createAdmin: (data) => API.post('/admin/admins', data),
  setAsDefault: (id) =>
    API.put(`/admin/admins/${id}/default`),
  sendResetEmail: (id) =>
    API.post(`/admin/users/${id}/reset-password`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  toggleUser: (id) =>
    API.put(`/admin/users/${id}/toggle`),
};

// ================= AI =================
export const aiAPI = {
  chat: (message, history) =>
    API.post('/ai/chat', { message, history }),
  tripPlanner: (data) =>
    API.post('/ai/trip-planner', data),
  search: (q) =>
    API.post('/ai/nl-search', { q }),
};