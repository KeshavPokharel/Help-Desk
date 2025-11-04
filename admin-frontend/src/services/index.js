import api from './api';

export const authService = {
  // Login
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

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const userService = {
  // Get all users
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  // Get user by ID
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users/add_user', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Create agent (admin only)
  createAgent: async (agentData) => {
    const response = await api.post('/users/add_agent', agentData);
    return response.data;
  },
};

export const ticketService = {
  // Get all tickets
  getTickets: async () => {
    const response = await api.get('/tickets/');
    return response.data;
  },

  // Get ticket by ID
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Create ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets/', ticketData);
    return response.data;
  },

  // Update ticket
  updateTicket: async (id, ticketData) => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  // Assign ticket to agent
  assignTicket: async (ticketId, agentId) => {
    const response = await api.put(`/tickets/${ticketId}/assign`, { agent_id: agentId });
    return response.data;
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, status) => {
    const response = await api.put(`/tickets/${ticketId}/status`, { status });
    return response.data;
  },

  // Request ticket resolution (for agents)
  requestResolution: async (ticketId) => {
    const response = await api.post(`/tickets/${ticketId}/request-resolution`);
    return response.data;
  },

  // Resolve ticket (for admins)
  resolveTicket: async (ticketId) => {
    const response = await api.post(`/tickets/${ticketId}/resolve`);
    return response.data;
  },

  // Close ticket (for assigned agents)
  closeTicket: async (ticketId, resolutionNote = null) => {
    const response = await api.post(`/tickets/${ticketId}/close`, {
      resolution_note: resolutionNote
    });
    return response.data;
  },

  // Reopen ticket (for admins)
  reopenTicket: async (ticketId) => {
    const response = await api.post(`/tickets/${ticketId}/reopen`);
    return response.data;
  },

  // Get reopen requests (for admins)
  getReopenRequests: async (searchQuery = '') => {
    const response = await api.get('/tickets/reopen/requests', {
      params: { search_query: searchQuery }
    });
    return response.data;
  },

  // Approve reopen request (for agents/admins)
  approveReopenRequest: async (ticketId) => {
    const response = await api.post(`/tickets/${ticketId}/reopen`);
    return response.data;
  },

  // Get notes for a ticket
  getNotes: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}/notes`);
    return response.data;
  },

  // Create a note for a ticket
  createNote: async (ticketId, noteData) => {
    const response = await api.post(`/tickets/${ticketId}/note`, noteData);
    return response.data;
  },
};

export const transferService = {
  // Get all transfer requests (for admins)
  getTransferRequests: async () => {
    const response = await api.get('/tickets_transfers/');
    return response.data;
  },

  // Request a ticket transfer (for agents)
  requestTransfer: async (ticketId, transferData) => {
    const response = await api.post(`/tickets_transfers/${ticketId}/transfer`, transferData);
    return response.data;
  },

  // Approve a transfer request (for admins)
  approveTransfer: async (transferId) => {
    const response = await api.post(`/tickets_transfers/${transferId}/transfer/approve`);
    return response.data;
  },

  // Reject a transfer request (for admins)
  rejectTransfer: async (transferId) => {
    const response = await api.post(`/tickets_transfers/${transferId}/transfer/reject`);
    return response.data;
  },
};

export const assignmentService = {
  // Admin manual assignment of ticket to agent
  adminAssignTicket: async (ticketId, agentId) => {
    const response = await api.patch(`/tickets/${ticketId}/assign`, { 
      agent_id: agentId 
    });
    return response.data;
  },

  // Assign agent to category
  assignAgentToCategory: async (categoryId, agentId) => {
    const response = await api.post(`/categories/${categoryId}/assign-agent`, {
      agent_id: agentId
    });
    return response.data;
  },

  // Unassign agent from category
  unassignAgentFromCategory: async (categoryId, agentId) => {
    const response = await api.delete(`/categories/${categoryId}/unassign-agent`, {
      data: { agent_id: agentId }
    });
    return response.data;
  },

  // Get agents assigned to a category
  getCategoryAgents: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}/agents`);
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

  // Create category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories/', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  // Get subcategories for a category
  getSubcategoriesByCategory: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}/subcategories`);
    return response.data;
  },

  // Create subcategory
  createSubcategory: async (categoryId, subcategoryData) => {
    const response = await api.post(`/categories/${categoryId}/subcategories`, subcategoryData);
    return response.data;
  },

  // Assign agent to category
  assignAgentToCategory: async (categoryId, agentId) => {
    const response = await api.post(`/categories/${categoryId}/assign-agent`, {
      agent_id: agentId,
    });
    return response.data;
  },

  // Unassign agent from category
  unassignAgentFromCategory: async (categoryId, agentId) => {
    const response = await api.delete(`/categories/${categoryId}/unassign-agent/${agentId}`);
    return response.data;
  },
};

export const messageService = {
  // Get messages for a ticket
  getMessages: async (ticketId) => {
    const response = await api.get(`/messages/${ticketId}`);
    return response.data;
  },

  // Send a message via HTTP POST
  sendMessage: async (messageData) => {
    const response = await api.post('/messages/', messageData);
    return response.data;
  },
};

export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/tickets/stats/dashboard');
    return response.data;
  },
  
  // Get agent statistics
  getAgentStats: async () => {
    const response = await api.get('/tickets/stats/agent');
    return response.data;
  },

  // Get enhanced dashboard statistics with charts data
  getEnhancedStats: async (daysBack = 30) => {
    const response = await api.get(`/tickets/stats/enhanced?days_back=${daysBack}`);
    return response.data;
  },
};