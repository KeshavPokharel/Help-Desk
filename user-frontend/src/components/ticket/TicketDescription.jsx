import React from 'react';

const TicketDescription = ({ ticket }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
      <p className="text-gray-700 whitespace-pre-wrap">
        {ticket?.initial_description || 'No description provided'}
      </p>
    </div>
  );
};

export default TicketDescription;