import React from 'react';
import { User } from 'lucide-react';

const TicketSidebar = ({ ticket, user }) => {
  if (!ticket) return null;

  return (
    <div className="space-y-6">
      {/* User Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">{ticket.user?.name}</p>
              <p className="text-sm text-gray-500">{ticket.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Agent */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Agent</h3>
        <div className="space-y-3">
          {ticket.agent ? (
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{ticket.agent.name}</p>
                <p className="text-sm text-gray-500">{ticket.agent.email}</p>
                {user?.id === ticket.agent.id && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Assigned to you
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No agent assigned</p>
          )}
        </div>
      </div>

      {/* Category Information */}
      {ticket.category && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category</h3>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">{ticket.category.name}</p>
            {ticket.subcategory && (
              <p className="text-sm text-gray-500">{ticket.subcategory.name}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSidebar;