import React from 'react';

const RoleSpecificContent = ({ user, stats }) => {
  if (user?.role === 'admin') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Overview</h2>
        <p className="text-gray-600">
          System is running smoothly. All services are operational.
        </p>
      </div>
    );
  }

  if (user?.role === 'agent') {
    const pendingTickets = stats.find(s => s.name === 'Pending Tickets')?.value || 0;
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Dashboard</h2>
        <p className="text-gray-600">
          You have {pendingTickets} tickets to review.
        </p>
      </div>
    );
  }

  return null;
};

export default RoleSpecificContent;