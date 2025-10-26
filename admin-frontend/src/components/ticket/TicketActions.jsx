import React from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';

const TicketActions = ({ ticket, user, onTransferClick, onCloseClick }) => {
  // Don't render anything if not an agent
  if (user?.role !== 'agent') return null;

  return (
    <div className="flex items-center space-x-3">
      {ticket?.agent?.id === user?.id ? (
        <>
          {/* Request Transfer Button - only show for tickets that can be transferred */}
          {(ticket?.status !== 'closed' && ticket?.status !== 'resolved') && (
            <button
              onClick={onTransferClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Request Transfer
            </button>
          )}
          
          {/* Close Ticket Button - show for assigned agent on tickets that can be closed */}
          {(ticket?.status === 'assigned' || ticket?.status === 'in_progress' || ticket?.status === 'transferred' || ticket?.status === 'reopened') && (
            <button
              onClick={onCloseClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Close Ticket
            </button>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
          {ticket?.agent ? (
            <>Only the assigned agent ({ticket?.agent?.name || 'Unknown'}) can request transfers</>
          ) : (
            <>This ticket is unassigned - only admins can initiate transfers</>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketActions;