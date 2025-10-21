import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if it's not a login request
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// User services
export const userService = {
  getUsers: () => api.get('/users/'),
  createUser: (userData) => api.post('/users/', userData),
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/me', userData),
  changePassword: (passwordData) => api.put('/users/me/password', passwordData),
};

// Ticket services
export const ticketService = {
  getTickets: (params) => api.get('/tickets/', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  createTicket: (ticketData) => api.post('/tickets/', ticketData),
  updateTicket: (id, ticketData) => api.put(`/tickets/${id}`, ticketData),
  updateTicketStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  assignTicket: (id, agentId) => api.post(`/tickets/${id}/assign`, { agent_id: agentId }),
  requestResolution: (id) => api.post(`/tickets/${id}/request-resolution`),
  resolveTicket: (id) => api.post(`/tickets/${id}/resolve`),
  reopenTicket: (id) => api.post(`/tickets/${id}/reopen`),
  requestReopenTicket: (id, reason) => api.post(`/tickets/${id}/request/reopen`, { reason }),
  getMyTickets: () => api.get('/tickets/user/me'),
};

// Message services
export const messageService = {
  getMessages: (ticketId) => api.get(`/tickets/${ticketId}/messages`),
  sendMessage: (messageData) => api.post('/messages/', messageData),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// Category services
export const categoryService = {
  getCategories: () => api.get('/categories/'),
  createCategory: (categoryData) => api.post('/categories/', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};