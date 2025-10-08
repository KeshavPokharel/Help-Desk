import api from './api';

export const authService = {
  // Login for users and agents
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const ticketService = {
  // Get user's tickets or assigned tickets for agents
  getMyTickets: async () => {
    const response = await api.get('/tickets/');
    return response.data;
  },

  // Get all tickets (for agents)
  getTickets: async () => {
    const response = await api.get('/tickets/');
    return response.data;
  },

  // Get ticket by ID
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Create ticket (for users)
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets/', ticketData);
    return response.data;
  },

  // Update ticket
  updateTicket: async (id, ticketData) => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  // Update ticket status (for agents)
  updateTicketStatus: async (ticketId, status) => {
    const response = await api.put(`/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  //request reopen (for users)
  requestReopenTicket: async (ticketId, reason) => {
    const response = await api.post(`/tickets/${ticketId}/request/reopen`, {
      reason: reason
    });
    return response.data;
  },

  // Assign ticket to agent (for agents)
  assignTicket: async (ticketId, agentId) => {
    const response = await api.put(`/tickets/${ticketId}/assign`, { agent_id: agentId });
    return response.data;
  },
};

export const transferService = {
  // Get transfer requests for a specific ticket (if this endpoint exists)
  getTicketTransfers: async (ticketId) => {
    try {
      const response = await api.get(`/tickets_transfers/ticket/${ticketId}`);
      return response.data;
    } catch (error) {
      // Return empty array if endpoint doesn't exist
      return [];
    }
  },

  // Request a ticket transfer (for agents)
  requestTransfer: async (ticketId, transferData) => {
    const response = await api.post(`/tickets_transfers/${ticketId}/transfer`, transferData);
    return response.data;
  },

  // Get all transfer requests (for agents/admins)
  getTransferRequests: async () => {
    const response = await api.get('/tickets_transfers/');
    return response.data;
  },
};

export const categoryService = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories/');
    return response.data;
  },

  // Get category by ID
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Get subcategories for a category
  getSubcategoriesByCategory: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}/subcategories`);
    return response.data;
  },
};

export const messageService = {
  // Get messages for a ticket
  getMessages: async (ticketId) => {
    const response = await api.get(`/messages/${ticketId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (messageData) => {
    const response = await api.post('/messages/', messageData);
    return response.data;
  },
};

export const userService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  // Upload profile photo
  uploadProfilePhoto: async (formData) => {
    const response = await api.put('/users/me/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/users/me/password', passwordData);
    return response.data;
  },

  // Get agents (for ticket assignment - agent view only)
  getAgents: async () => {
    const response = await api.get('/users/?role=agent');
    return response.data;
  },
};