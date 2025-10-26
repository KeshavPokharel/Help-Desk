import React from 'react';
import Modal from '../ui/Modal';

const TransferModal = ({ 
  isOpen, 
  onClose, 
  agents, 
  transferData, 
  setTransferData, 
  onSubmit 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Transfer">
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer to Agent *
          </label>
          <select
            value={transferData.to_agent_id}
            onChange={(e) => setTransferData({ ...transferData, to_agent_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Transfer *
          </label>
          <textarea
            value={transferData.reason}
            onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please explain why you want to transfer this ticket..."
            required
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Submit Transfer Request
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferModal;