import { useState } from 'react';
import { ticketService, transferService } from '../services';
import { toast } from 'react-hot-toast';

export const useTicketActions = (ticketId, onTicketUpdate) => {
  const [transferData, setTransferData] = useState({
    to_agent_id: '',
    reason: ''
  });
  const [resolutionNote, setResolutionNote] = useState('');

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferData.to_agent_id || !transferData.reason.trim()) {
      toast.error('Please select an agent and provide a reason');
      return;
    }

    try {
      await transferService.requestTransfer(ticketId, transferData);
      toast.success('Transfer request submitted for admin approval');
      setTransferData({ to_agent_id: '', reason: '' });
      return true; // Success
    } catch (error) {
      toast.error('Failed to submit transfer request');
      console.error('Error requesting transfer:', error);
      return false; // Failure
    }
  };

  const handleApproveReopen = async () => {
    try {
      await ticketService.approveReopenRequest(ticketId);
      toast.success('Reopen request approved successfully');
      onTicketUpdate(); // Refresh ticket details
      return true;
    } catch (error) {
      toast.error('Failed to approve reopen request');
      console.error('Error approving reopen request:', error);
      return false;
    }
  };

  const handleCloseTicket = async (e) => {
    e.preventDefault();
    try {
      await ticketService.closeTicket(ticketId, resolutionNote.trim() || null);
      toast.success('Ticket closed successfully');
      setResolutionNote('');
      onTicketUpdate(); // Refresh ticket details
      return true;
    } catch (error) {
      toast.error('Failed to close ticket');
      console.error('Error closing ticket:', error);
      return false;
    }
  };

  return {
    transferData,
    setTransferData,
    resolutionNote,
    setResolutionNote,
    handleRequestTransfer,
    handleApproveReopen,
    handleCloseTicket
  };
};