import React from 'react';
import { RotateCcw } from 'lucide-react';

const ReopenRequestAlert = ({ ticket, user, onApproveReopen }) => {
  // Only show for admin users when ticket has reopen request
  if (ticket?.status !== 'requested_reopen' || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
        <RotateCcw className="h-5 w-5 mr-2" />
        Reopen Request Pending
      </h3>
      <p className="text-sm text-purple-700 mb-4">
        This ticket has been requested to be reopened by the customer. 
        As an admin, you can approve this request.
      </p>
      <button
        onClick={onApproveReopen}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Approve Reopen Request
      </button>
    </div>
  );
};

export default ReopenRequestAlert;