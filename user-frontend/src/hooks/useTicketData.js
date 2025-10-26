import { useState, useEffect } from 'react';
import { ticketService } from '../services';
import toast from 'react-hot-toast';

export const useTicketData = (ticketId) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      const ticketData = await ticketService.getTicket(ticketId);
      setTicket(ticketData);
      return ticketData;
    } catch (error) {
      toast.error('Failed to fetch ticket details');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshTicket = async () => {
    try {
      const ticketData = await ticketService.getTicket(ticketId);
      setTicket(ticketData);
      return ticketData;
    } catch (error) {
      console.error('Error refreshing ticket:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId]);

  return {
    ticket,
    loading,
    transfers,
    setTransfers,
    fetchTicketData,
    refreshTicket
  };
};