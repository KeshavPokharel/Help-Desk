import React from 'react';

const TicketInfo = ({ ticket }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'requested_reopen':
        return 'bg-purple-100 text-purple-800';
      case 'reopened':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!ticket) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <p className="mt-1 text-sm text-gray-900">{ticket?.initial_description || 'No description provided'}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket?.status || 'unknown')}`}>
              {ticket?.status || 'Unknown'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket?.priority || 'unknown')}`}>
              {ticket?.priority || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <p className="mt-1 text-sm text-gray-900">{ticket?.created_at ? formatDate(ticket.created_at) : 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
            <p className="mt-1 text-sm text-gray-900">{ticket?.updated_at ? formatDate(ticket.updated_at) : 'Unknown'}</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
          <div className="mt-1 flex items-center">
            {ticket?.agent ? (
              <div className="flex items-center">
                <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-medium">
                    {ticket.agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-900">{ticket.agent.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500 italic">Unassigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketInfo;