import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import { transferService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TransferRequests = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const data = await transferService.getTransferRequests();
      setTransfers(data);
    } catch (error) {
      toast.error('Failed to fetch transfer requests');
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transferId) => {
    try {
      await transferService.approveTransfer(transferId);
      toast.success('Transfer request approved successfully');
      fetchTransfers(); // Refresh the list
    } catch (error) {
      toast.error('Failed to approve transfer request');
      console.error('Error approving transfer:', error);
    }
  };

  const handleReject = async (transferId) => {
    try {
      await transferService.rejectTransfer(transferId);
      toast.success('Transfer request rejected');
      fetchTransfers(); // Refresh the list
    } catch (error) {
      toast.error('Failed to reject transfer request');
      console.error('Error rejecting transfer:', error);
    }
  };

  const filteredTransfers = transfers.filter((transfer) => {
    if (selectedStatus === 'all') return true;
    return transfer?.status === selectedStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user?.role === 'admin' ? 'Transfer Requests' : 'My Transfer Requests'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin' 
              ? 'Manage ticket transfer requests from agents'
              : 'View your submitted transfer requests'
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            className="block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transfer Requests List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredTransfers.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredTransfers.map((transfer) => (
              <li key={transfer.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          Ticket #{transfer?.ticket?.id || 'Unknown'}: {transfer?.ticket?.title || 'No title'}
                        </h3>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            transfer?.status || 'unknown'
                          )}`}
                        >
                          {transfer?.status ? transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1) : 'Unknown'}
                        </span>
                        {/* Show transfer direction for agents */}
                        {user?.role === 'agent' && (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transfer?.from_agent_id === user?.id ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {transfer?.from_agent_id === user?.id ? 'Outgoing' : 'Incoming'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Transfer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <span>
                            {user?.role === 'admin' ? 
                              `Requested by: ${transfer?.requested_by?.name || transfer?.from_agent?.name || 'Unknown'}` :
                              (transfer?.from_agent_id === user?.id ? 
                                `Transferring to: ${transfer?.to_agent?.name || 'Unknown'}` :
                                `Requested by: ${transfer?.from_agent?.name || 'Unknown'}`
                              )
                            }
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Requested: {transfer?.created_at ? new Date(transfer.created_at).toLocaleString() : 'Unknown'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Ticket Status: {transfer?.ticket?.status || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Current Agent:</span> {transfer?.ticket?.agent?.name || 'Unassigned'}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Category:</span> {transfer?.ticket?.category?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Priority:</span> {transfer?.ticket?.priority || 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {transfer?.reason && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Transfer Reason:
                        </h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {transfer.reason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons - Only show for pending requests and admins */}
                    {transfer?.status === 'pending' && user?.role === 'admin' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApprove(transfer?.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(transfer?.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    )}

                    {/* Status Message for completed requests */}
                    {transfer?.status !== 'pending' && (
                      <div className="text-sm text-gray-500">
                        {transfer?.status === 'approved' && 'This transfer request has been approved.'}
                        {transfer?.status === 'rejected' && 'This transfer request has been rejected.'}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transfer requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStatus === 'all' 
                ? 'No transfer requests have been submitted yet.'
                : `No ${selectedStatus} transfer requests found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferRequests;