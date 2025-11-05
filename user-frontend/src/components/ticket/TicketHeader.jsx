import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TicketHeader = ({ ticket, onNavigateBack }) => {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={onNavigateBack}
        className="text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Ticket #{ticket?.id || 'Unknown'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{ticket?.title || 'Untitled'}</p>
      </div>
    </div>
  );
};

export default TicketHeader;