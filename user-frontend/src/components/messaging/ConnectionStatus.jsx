import React from 'react';
import { RefreshCw } from 'lucide-react';

const ConnectionStatus = ({ user, isConnected, connectionAttempts, refreshing, onRefresh }) => {
  const getConnectionStatus = () => {
    if (user?.role === 'admin') return 'Admin View';
    if (isConnected) return 'Connected';
    if (connectionAttempts > 0) return 'Reconnecting...';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (user?.role === 'admin') return 'blue';
    return isConnected ? 'green' : 'red';
  };

  const statusColor = getStatusColor();

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-sm">
        <div className={`h-2 w-2 rounded-full mr-2 bg-${statusColor}-500`}></div>
        <span className={`text-${statusColor}-600`}>
          {getConnectionStatus()}
        </span>
      </div>
      {user?.role === 'admin' && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;