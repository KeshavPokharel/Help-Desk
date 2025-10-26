import React from 'react';
import Modal from '../ui/Modal';

const CloseTicketModal = ({ 
  isOpen, 
  onClose, 
  resolutionNote, 
  setResolutionNote, 
  onSubmit 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Ticket">
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Summary (Optional)
          </label>
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Briefly describe how the issue was resolved..."
          />
          <p className="text-sm text-gray-500 mt-1">
            This note will be visible to the customer and will help with future similar issues.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Close Ticket
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CloseTicketModal;