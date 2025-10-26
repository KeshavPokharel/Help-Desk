import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;