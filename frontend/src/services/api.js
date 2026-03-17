import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bahari_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bahari_token');
      localStorage.removeItem('bahari_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// Locations
export const locationAPI = {
  getAll: (params) => api.get('/locations', { params }),
  getOne: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Devices
export const deviceAPI = {
  getAll: (params) => api.get('/devices', { params }),
  getOne: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  regenerateKey: (id) => api.post(`/devices/${id}/regenerate-key`),
};

// Readings
export const readingAPI = {
  getAll: (params) => api.get('/readings', { params }),
  getLatest: (params) => api.get('/readings/latest', { params }),
  getStats: (params) => api.get('/readings/stats', { params }),
  getAlerts: (params) => api.get('/readings/alerts', { params }),
};

// Users
export const userAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Groups
export const groupAPI = {
  getAll: () => api.get('/groups'),
  getOne: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  addMember: (id, data) => api.post(`/groups/${id}/members`, data),
  updateMemberRole: (id, userId, data) => api.put(`/groups/${id}/members/${userId}`, data),
  removeMember: (id, userId) => api.delete(`/groups/${id}/members/${userId}`),
  assignDevices: (id, data) => api.put(`/groups/${id}/devices`, data),
};

// Posts
export const postAPI = {
  getPublished: (params) => api.get('/posts', { params }),
  getBySlug: (slug) => api.get(`/posts/${slug}`),
  getAllAdmin: () => api.get('/posts/admin/all'),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/id/${id}`, data),
  delete: (id) => api.delete(`/posts/id/${id}`),
};

export default api;
