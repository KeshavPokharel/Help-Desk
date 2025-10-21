import React from 'react';
import { RefreshCw } from 'lucide-react';

const ConnectionStatus = ({ user, isConnected, connectionAttempts, refreshing, onRefresh }) => {
  const getConnectionStatus = () => {
    if (user?.role === 'admin') return 'Admin View';
    if (isConnected) return 'Connected';
    if (connectionAttempts > 0) return 'Reconnecting...';
    if (typeof WebSocket !== 'undefined' && WebSocket.CONNECTING) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (user?.role === 'admin') return 'bg-blue-500';
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getTextColor = () => {
    if (user?.role === 'admin') return 'text-blue-600';
    return isConnected ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-sm">
        <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor()}`}></div>
        <span className={getTextColor()}>
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