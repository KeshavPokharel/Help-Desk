import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Clock, User, ChevronRight } from 'lucide-react';
import { ticketService, messageService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsWithMessages, setTicketsWithMessages] = useState([]);

  useEffect(() => {
    fetchTicketsAndMessages();
  }, []);

  const fetchTicketsAndMessages = async () => {
    try {
      setLoading(true);
      
      // Get user's tickets
      const ticketsData = await ticketService.getMyTickets();
      setTickets(ticketsData);

      // Get messages for each ticket to see which ones have conversations
      const ticketsWithMsgPromises = ticketsData.map(async (ticket) => {
        try {
          const messages = await messageService.getMessages(ticket.id);
          return {
            ...ticket,
            messages: messages,
            lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
            messageCount: messages.length,
          };
        } catch (error) {
          console.error(`Error fetching messages for ticket ${ticket.id}:`, error);
          return {
            ...ticket,
            messages: [],
            lastMessage: null,
            messageCount: 0,
          };
        }
      });

      const results = await Promise.all(ticketsWithMsgPromises);
      // Filter to only show tickets that have messages AND are assigned to an agent
      const withMessages = results.filter(ticket => 
        ticket.messageCount > 0 && ticket.agent // Only show tickets with messages and assigned agent
      );
      setTicketsWithMessages(withMessages);
      
    } catch (error) {
      toast.error('Failed to fetch messages');
      console.error('Error fetching tickets and messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your ticket conversations
        </p>
      </div>

      {ticketsWithMessages.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No message conversations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any active ticket conversations yet. Messages are only available for tickets that have been assigned to an agent.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard/tickets/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create a ticket to start messaging
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {ticketsWithMessages.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/dashboard/tickets/${ticket.id}`}
                  className="block hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                #{ticket.id} - {ticket.title || 'No title'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {ticket.messageCount} message{ticket.messageCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          {ticket.lastMessage && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 truncate">
                                <span className="font-medium">
                                  {ticket.lastMessage.sender_name || 'Unknown'}:
                                </span>{' '}
                                {ticket.lastMessage.content}
                              </p>
                              <div className="flex items-center mt-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(ticket.lastMessage.created_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Messages;