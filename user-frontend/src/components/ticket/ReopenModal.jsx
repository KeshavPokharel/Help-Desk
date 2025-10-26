import React from 'react';
import Modal from '../ui/Modal';

const ReopenModal = ({
  isOpen,
  onClose,
  reopenReason,
  setReopenReason,
  onSubmit,
  requestingReopen
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Ticket Reopen">
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for reopening *
          </label>
          <textarea
            rows={4}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Please explain why this ticket should be reopened..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={requestingReopen || !reopenReason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {requestingReopen ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReopenModal;