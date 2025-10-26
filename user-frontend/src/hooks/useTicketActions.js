import { useState } from 'react';
import { ticketService, transferService } from '../services';
import toast from 'react-hot-toast';

export const useTicketActions = (ticketId, refreshTicket) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [requestingTransfer, setRequestingTransfer] = useState(false);
  
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [requestingReopen, setRequestingReopen] = useState(false);

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferReason.trim()) {
      toast.error('Please provide a reason for the transfer');
      return false;
    }

    try {
      setRequestingTransfer(true);
      await transferService.requestTransfer(parseInt(ticketId), transferReason);
      setTransferReason('');
      setShowTransferModal(false);
      toast.success('Transfer request submitted successfully');
      if (refreshTicket) refreshTicket(); // Refresh to show new transfer request
      return true;
    } catch (error) {
      toast.error('Failed to submit transfer request');
      return false;
    } finally {
      setRequestingTransfer(false);
    }
  };

  const handleRequestReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening this ticket');
      return false;
    }

    try {
      setRequestingReopen(true);
      await ticketService.requestReopenTicket(parseInt(ticketId), reopenReason);
      setReopenReason('');
      setShowReopenModal(false);
      toast.success('Reopen request submitted successfully');
      if (refreshTicket) refreshTicket(); // Refresh to show updated ticket status
      return true;
    } catch (error) {
      toast.error('Failed to submit reopen request');
      return false;
    } finally {
      setRequestingReopen(false);
    }
  };

  const openTransferModal = () => setShowTransferModal(true);
  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferReason('');
  };

  const openReopenModal = () => setShowReopenModal(true);
  const closeReopenModal = () => {
    setShowReopenModal(false);
    setReopenReason('');
  };

  return {
    // Transfer state and actions
    showTransferModal,
    transferReason,
    setTransferReason,
    requestingTransfer,
    handleRequestTransfer,
    openTransferModal,
    closeTransferModal,

    // Reopen state and actions
    showReopenModal,
    reopenReason,
    setReopenReason,
    requestingReopen,
    handleRequestReopen,
    openReopenModal,
    closeReopenModal
  };
};