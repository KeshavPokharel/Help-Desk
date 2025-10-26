import React from 'react';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({ onCreateCategory }) => {
  return (
    <div className="text-center py-12">
      <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <div className="text-gray-500">
        <p className="text-lg font-medium">No categories found</p>
        <p className="text-sm mb-4">Create your first category to get started</p>
        <button
          onClick={onCreateCategory}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Create Category
        </button>
      </div>
    </div>
  );
};

export default EmptyState;