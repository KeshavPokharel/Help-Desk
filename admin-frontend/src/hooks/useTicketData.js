import { useState, useEffect } from 'react';
import { ticketService, userService } from '../services';
import { toast } from 'react-hot-toast';

export const useTicketData = (ticketId, user) => {
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTicketDetails = async () => {
    try {
      const data = await ticketService.getTicket(ticketId);
      setTicket(data);
      return data;
    } catch (error) {
      toast.error('Failed to fetch ticket details');
      console.error('Error fetching ticket:', error);
      throw error;
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await userService.getUsers();
      const agentUsers = data.filter(u => u.role === 'agent' && u.id !== user?.id);
      setAgents(agentUsers);
      return agentUsers;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  };

  const fetchNotes = async () => {
    try {
      const data = await ticketService.getNotes(ticketId);
      setNotes(data);
      return data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const fetchPromises = [
        fetchTicketDetails(),
        fetchAgents()
      ];
      
      // Only fetch notes for non-admin users
      if (user?.role !== 'admin') {
        fetchPromises.push(fetchNotes());
      }
      
      await Promise.all(fetchPromises);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchInitialData();
    }
  }, [ticketId, user?.role]);

  return {
    ticket,
    agents,
    notes,
    loading,
    refetchTicket: fetchTicketDetails,
    refetchNotes: fetchNotes,
    refetchAll: fetchInitialData
  };
};