import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, RefreshCw, Calendar, User, MessageSquare } from 'lucide-react';
import { ticketService } from '../services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ReopenRequests = () => {
  const [reopenRequests, setReopenRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchReopenRequests();
  }, []);

  const fetchReopenRequests = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getReopenRequests(searchQuery);
      setReopenRequests(data);
    } catch (error) {
      toast.error('Failed to fetch reopen requests');
      console.error('Error fetching reopen requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReopen = async (ticketId) => {
    try {
      await ticketService.approveReopenRequest(ticketId);
      toast.success('Reopen request approved successfully');
      fetchReopenRequests(); // Refresh the list
    } catch (error) {
      toast.error('Failed to approve reopen request');
      console.error('Error approving reopen request:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReopenRequests();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested_reopen':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reopen Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage ticket reopen requests from users
          </p>
        </div>
        <button
          onClick={fetchReopenRequests}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by ticket ID, title, or user name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
      </div>

      {/* Reopen Requests List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {reopenRequests.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reopen requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no pending reopen requests at this time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reopenRequests.map((ticket) => (
              <li key={ticket.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          #{ticket.id} - {ticket.title}
                        </h3>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          Reopen Requested
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)} Priority
                        </span>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">User:</span>
                        <span className="ml-1">{ticket.user?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="font-medium">Created:</span>
                        <span className="ml-1">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">Assigned:</span>
                        <span className="ml-1">{ticket.agent?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Ticket Description */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Description:</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {ticket.initial_description || 'No description provided'}
                      </p>
                    </div>

                    {/* Action Buttons - Only show for admins or assigned agents */}
                    {(user?.role === 'admin' || 
                      (user?.role === 'agent' && ticket.agent?.id === user?.id)) && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApproveReopen(ticket.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Reopen
                        </button>
                      </div>
                    )}

                    {/* Show message if user cannot approve */}
                    {user?.role === 'agent' && ticket.agent?.id !== user?.id && (
                      <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        Only the assigned agent or an admin can approve this reopen request.
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReopenRequests;