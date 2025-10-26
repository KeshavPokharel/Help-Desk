import React from 'react';
import { Calendar, User, RefreshCw } from 'lucide-react';

const TicketSidebar = ({
  ticket,
  user,
  transfers,
  isTicketCreator,
  isAssignedAgent,
  hasPendingTransfer,
  onRequestTransfer,
  onRequestReopen
}) => {
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

  return (
    <div className="space-y-6">
      {/* Status & Priority */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                  ticket?.status
                )}`}
              >
                {ticket?.status?.charAt(0).toUpperCase() + ticket?.status?.slice(1).replace('_', ' ')}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Priority</dt>
            <dd className="mt-1">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                  ticket?.priority
                )}`}
              >
                {ticket?.priority?.charAt(0).toUpperCase() + ticket?.priority?.slice(1)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(ticket?.created_at).toLocaleString()}
            </dd>
          </div>
          {ticket?.closed_at && (ticket?.status === 'closed' || ticket?.status === 'resolved') && (
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {ticket?.status === 'closed' ? 'Closed' : 'Resolved'}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(ticket.closed_at).toLocaleString()}
              </dd>
            </div>
          )}
          {ticket?.agent && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-1" />
                {ticket.agent.name}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Reopen Request Section - Only for ticket creators when ticket is resolved/closed */}
      {isTicketCreator && (ticket?.status === 'resolved' || ticket?.status === 'closed') && ticket?.status !== 'requested_reopen' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Request Reopen</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you believe this ticket needs further attention, you can request to reopen it.
          </p>
          <button
            onClick={onRequestReopen}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Reopen
          </button>
        </div>
      )}

      {/* Show reopen status if ticket is in requested_reopen state */}
      {ticket?.status === 'requested_reopen' && isTicketCreator && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reopen Request</h3>
          <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
            <p className="font-medium">Reopen request pending</p>
            <p className="mt-1">Your request to reopen this ticket is awaiting agent/admin approval.</p>
          </div>
        </div>
      )}

      {/* Transfer Request Section - Only for assigned agents */}
      {isAssignedAgent && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Request</h3>
          {hasPendingTransfer ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <p className="font-medium">Transfer request pending</p>
              <p className="mt-1">A transfer request for this ticket is currently awaiting admin approval.</p>
            </div>
          ) : (
            <button
              onClick={onRequestTransfer}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Request Transfer
            </button>
          )}
        </div>
      )}

      {/* Transfer History */}
      {transfers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer History</h3>
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="border-l-4 border-gray-200 pl-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Requested by {transfer.requested_by.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transfer.created_at).toLocaleString()}
                    </p>
                    {transfer.reason && (
                      <p className="text-sm text-gray-600 mt-1">
                        Reason: {transfer.reason}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transfer.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : transfer.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSidebar;