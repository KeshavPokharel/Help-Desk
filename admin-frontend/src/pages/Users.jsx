import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, Shield, Users2, User as UserIcon } from 'lucide-react';
import { userService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Components
import {
  LoadingSpinner,
  UserStatsCards,
  UserFilters,
  UsersTable,
  CreateAgentModal
} from '../components/ui';

// Constants
const ROLE_CONFIG = {
  admin: { color: 'bg-red-100 text-red-800', icon: Shield, label: 'Admin', avatarColor: 'bg-red-600' },
  agent: { color: 'bg-blue-100 text-blue-800', icon: Users2, label: 'Agent', avatarColor: 'bg-blue-600' },
  user: { color: 'bg-green-100 text-green-800', icon: UserIcon, label: 'User', avatarColor: 'bg-green-600' },
  default: { color: 'bg-gray-100 text-gray-800', icon: UserIcon, label: 'Unknown', avatarColor: 'bg-gray-600' }
};

const INITIAL_AGENT_FORM = {
  name: '',
  email: '',
  password: ''
};

const Users = () => {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [agentFormData, setAgentFormData] = useState(INITIAL_AGENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();


  // Computed values
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = (user?.name?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                           (user?.email?.toLowerCase() || '').includes((searchTerm || '').toLowerCase());
      const matchesRole = selectedRole === 'all' || user?.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const userStats = useMemo(() => {
    return users.reduce((acc, user) => {
      const role = user?.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  // Handlers
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteUser = useCallback(async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to delete user');
        console.error('Error deleting user:', error);
      }
    }
  }, [fetchUsers]);

  const validateAgentForm = useCallback(() => {
    const { name, email, password } = agentFormData;
    
    if (!name?.trim()) return 'Name is required';
    if (!email?.trim()) return 'Email is required';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    
    return null;
  }, [agentFormData]);

  const handleCreateAgent = useCallback(async (e) => {
    e.preventDefault();
    
    const validationError = validateAgentForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const agentCreateData = {
        ...agentFormData,
        role: 'agent'
      };
      await userService.createAgent(agentCreateData);
      toast.success('Agent created successfully');
      setShowCreateAgentModal(false);
      setAgentFormData(INITIAL_AGENT_FORM);
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to create agent';
      toast.error(errorMessage);
      console.error('Error creating agent:', error);
    } finally {
      setSubmitting(false);
    }
  }, [agentFormData, validateAgentForm, fetchUsers]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setAgentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const closeModal = useCallback(() => {
    setShowCreateAgentModal(false);
    setAgentFormData(INITIAL_AGENT_FORM);
  }, []);

  const getRoleConfig = useCallback((role) => {
    return ROLE_CONFIG[role] || ROLE_CONFIG.default;
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading users..." />;
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all users in the help desk system
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateAgentModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Agent
          </button>
          <Link
            to="/users/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards userStats={userStats} totalUsers={users.length} />

      {/* Filters */}
      <UserFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />

      {/* Users Table */}
      <UsersTable 
        filteredUsers={filteredUsers}
        getRoleConfig={getRoleConfig}
        formatDate={formatDate}
        onDeleteUser={handleDeleteUser}
        searchTerm={searchTerm}
        selectedRole={selectedRole}
      />

      {/* Create Agent Modal */}
      <CreateAgentModal 
        isOpen={showCreateAgentModal}
        onClose={closeModal}
        onSubmit={handleCreateAgent}
        formData={agentFormData}
        onChange={handleFormChange}
        submitting={submitting}
      />
    </div>
  );
};

export default Users;