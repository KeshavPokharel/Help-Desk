import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import { ticketService, messageService, transferService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [requestingTransfer, setRequestingTransfer] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [requestingReopen, setRequestingReopen] = useState(false);
  
  // WebSocket state
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const intentionalDisconnect = useRef(false);
  const lastConnectionAttempt = useRef(0);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketAndMessages();
  }, [id]);

  useEffect(() => {
    // Connect WebSocket for real-time messaging
    if (id && user?.id) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        intentionalDisconnect.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [id, user?.id]); // Only reconnect when ticket ID or user ID changes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = () => {
    // Prevent rapid reconnection attempts (cooldown period)
    const now = Date.now();
    if (now - lastConnectionAttempt.current < 1000) {
      console.log('Connection attempt too soon, waiting...');
      return;
    }
    lastConnectionAttempt.current = now;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Prevent multiple connection attempts
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket already connecting, skipping duplicate connection');
        return;
      }
      if (wsRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, skipping duplicate connection');
        return;
      }
      
      // Close existing connection only if it's closed or closing
      console.log('Closing existing WebSocket connection');
      intentionalDisconnect.current = true;
      wsRef.current.close();
      wsRef.current = null;
      setWsConnected(false);
    }

    // Small delay to ensure previous connection is fully closed
    setTimeout(() => {
      const wsUrl = `ws://localhost:8000/messages/room/${id}?token=${token}`;
      console.log('Creating new WebSocket connection to:', wsUrl);
      intentionalDisconnect.current = false;
      wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('🔥 USER: WebSocket connected to:', wsUrl);
      console.log('🔥 USER: WebSocket readyState:', wsRef.current?.readyState);
      setWsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        console.log('🔥 USER: Received WebSocket message:', messageData);
        console.log('🔥 USER: Current messages length before update:', messages.length);
        
        if (messageData.type === 'message') {
          // Add the new message to the messages list
          const newMsg = {
            id: messageData.id,
            content: messageData.content,
            sender: {
              id: messageData.sender_id,
              name: messageData.sender_name,
              role: messageData.sender_role
            },
            sender_name: messageData.sender_name,
            timestamp: messageData.timestamp,
            created_at: messageData.timestamp
          };
          
          setMessages(prev => {
            console.log('🔥 USER: Processing message, current state has', prev.length, 'messages');
            // Check if message already exists to avoid duplicates
            const exists = prev.find(msg => msg.id === newMsg.id);
            if (exists) {
              console.log('🔥 USER: Message already exists, skipping duplicate');
              return prev;
            }
            
            // Replace optimistic message with real message if content and sender match
            const optimisticIndex = prev.findIndex(msg => 
              msg.id.toString().startsWith('temp-') && 
              msg.content === newMsg.content && 
              msg.sender?.id === newMsg.sender.id
            );
            
            if (optimisticIndex !== -1) {
              console.log('🔥 USER: Replacing optimistic message with real message');
              const updatedMessages = [...prev];
              updatedMessages[optimisticIndex] = newMsg;
              return updatedMessages;
            }
            
            console.log('🔥 USER: Adding new real-time message to state');
            const newState = [...prev, newMsg];
            console.log('🔥 USER: New state will have', newState.length, 'messages');
            return newState;
          });
        } else if (messageData.type === 'user_joined') {
          console.log(`${messageData.user_name} joined the chat`);
        } else if (messageData.type === 'user_left') {
          console.log(`${messageData.user_name} left the chat`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket disconnected with code:', event.code, 'reason:', event.reason);
      setWsConnected(false);
      
      // Don't reconnect if it was intentional or duplicate connection
      if (intentionalDisconnect.current || event.code === 1000) {
        console.log('Intentional disconnect, not reconnecting');
        intentionalDisconnect.current = false;
        return;
      }
      
      // Attempt to reconnect after 3 seconds for unexpected disconnections
      console.log('Unexpected disconnect, reconnecting in 3 seconds...');
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 3000);
    };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    }, 100); // Close setTimeout with 100ms delay
  };

  const fetchTicketAndMessages = async () => {
    try {
      setLoading(true);
      
      if (!messagesLoaded) {
        // Only load messages if not already loaded (first time)
        const [ticketData, messagesData] = await Promise.all([
          ticketService.getTicket(id),
          messageService.getMessages(id),
        ]);
        setTicket(ticketData);
        setMessages(messagesData);
        setMessagesLoaded(true);
      } else {
        // Just refresh ticket data, keep existing messages (WebSocket handles updates)
        const ticketData = await ticketService.getTicket(id);
        setTicket(ticketData);
      }
    } catch (error) {
      toast.error('Failed to fetch ticket details');
      navigate('/dashboard/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      
      if (wsConnected && wsRef.current) {
        // Send via WebSocket for real-time messaging
        console.log('Sending message via WebSocket:', { content: newMessage.trim() });
        const messageData = {
          content: newMessage.trim()
        };
        wsRef.current.send(JSON.stringify(messageData));
        
        // Add message optimistically to local state
        const optimisticMsg = {
          id: `temp-${Date.now()}`,
          content: newMessage.trim(),
          sender: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          sender_name: user.name,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        console.log('Adding optimistic message:', optimisticMsg);
        setMessages(prev => [...prev, optimisticMsg]);
      } else {
        // Fallback to HTTP API
        await messageService.sendMessage({
          ticket_id: parseInt(id),
          content: newMessage,
        });
        fetchTicketAndMessages(); // Refresh messages only for HTTP fallback
      }
      
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferReason.trim()) {
      toast.error('Please provide a reason for the transfer');
      return;
    }

    try {
      setRequestingTransfer(true);
      await transferService.requestTransfer(parseInt(id), transferReason);
      setTransferReason('');
      setShowTransferModal(false);
      toast.success('Transfer request submitted successfully');
      fetchTicketAndMessages(); // Refresh to show new transfer request
    } catch (error) {
      toast.error('Failed to submit transfer request');
    } finally {
      setRequestingTransfer(false);
    }
  };

  const handleRequestReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening this ticket');
      return;
    }

    try {
      setRequestingReopen(true);
      await ticketService.requestReopenTicket(parseInt(id), reopenReason);
      setReopenReason('');
      setShowReopenModal(false);
      toast.success('Reopen request submitted successfully');
      fetchTicketAndMessages(); // Refresh to show updated ticket status
    } catch (error) {
      toast.error('Failed to submit reopen request');
    } finally {
      setRequestingReopen(false);
    }
  };

  // Check if user is an agent assigned to this ticket
  const isAssignedAgent = user?.role === 'agent' && ticket?.agent?.id === user?.id;
  
  // Check if user is the ticket creator (check multiple possible field names)
  const isTicketCreator = user?.role === 'user' && (
    ticket?.user_id === user?.id || 
    ticket?.userId === user?.id ||
    ticket?.user?.id === user?.id
  );
  
  // Check if messaging should be available (only when ticket is assigned and user is involved)
  const canAccessMessages = ticket?.agent && (isAssignedAgent || isTicketCreator);
  
  // Check if there's a pending transfer request
  const hasPendingTransfer = transfers.some(transfer => transfer.status === 'pending');

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
      case 'requested_reopen':
        return 'bg-purple-100 text-purple-800';
      case 'reopened':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/tickets')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Ticket #{ticket.id}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{ticket.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.initial_description}</p>
          </div>

          {/* Messages */}
          {canAccessMessages ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Messages ({messages.length})
                  </h3>
                  <div className="flex items-center text-sm">
                    <div className={`h-2 w-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={wsConnected ? 'text-green-600' : 'text-red-600'}>
                      {wsConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-gray-50">
                {messages.length > 0 ? (
                  messages.map((message) => {
                    const isCurrentUser = message.sender?.id === user?.id || message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          isCurrentUser 
                            ? 'bg-blue-600 text-white rounded-br-md' 
                            : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                        }`}>
                          {!isCurrentUser && (
                            <div className="flex items-center mb-1">
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                                <span className="text-gray-600 text-xs font-medium">
                                  {(message.sender?.name || message.sender_name)?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {message.sender?.name || message.sender_name || 'Unknown User'}
                              </span>
                            </div>
                          )}
                          <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                            {message.content}
                          </p>
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at || message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-2">No messages yet</p>
                    <p className="text-gray-400 text-sm">Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Form */}
              <div className="px-6 py-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage}>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <textarea
                        rows={3}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Messages
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900">Messages not available</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {!(ticket?.agent || ticket?.agent_id)
                      ? "Messages will be available once this ticket is assigned to an agent."
                      : "You don't have permission to view messages for this ticket."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(ticket.created_at).toLocaleString()}
                </dd>
              </div>
              {ticket.closed_at && (ticket.status === 'closed' || ticket.status === 'resolved') && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {ticket.status === 'closed' ? 'Closed' : 'Resolved'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(ticket.closed_at).toLocaleString()}
                  </dd>
                </div>
              )}
              {ticket.agent && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {ticket.agent.name}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Reopen Request Section - Only for ticket creators when ticket is resolved/closed */}
          {isTicketCreator && (ticket.status === 'resolved' || ticket.status === 'closed') && ticket.status !== 'requested_reopen' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Reopen</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you believe this ticket needs further attention, you can request to reopen it.
              </p>
              <button
                onClick={() => setShowReopenModal(true)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Request Reopen
              </button>
            </div>
          )}

          {/* Show reopen status if ticket is in requested_reopen state */}
          {ticket.status === 'requested_reopen' && isTicketCreator && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reopen Request</h3>
              <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                <p className="font-medium">Reopen request pending</p>
                <p className="mt-1">Your request to reopen this ticket is awaiting agent/admin approval.</p>
              </div>
            </div>
          )}

          {/* Transfer Request Section - Only for assigned agents */}
          {isAssignedAgent && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Request</h3>
              {hasPendingTransfer ? (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <p className="font-medium">Transfer request pending</p>
                  <p className="mt-1">A transfer request for this ticket is currently awaiting admin approval.</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Transfer
                </button>
              )}
            </div>
          )}

          {/* Transfer History */}
          {transfers.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer History</h3>
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="border-l-4 border-gray-200 pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Requested by {transfer.requested_by.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transfer.created_at).toLocaleString()}
                        </p>
                        {transfer.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            Reason: {transfer.reason}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transfer.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : transfer.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Request Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Ticket Transfer</h3>
              <form onSubmit={handleRequestTransfer}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for transfer *
                  </label>
                  <textarea
                    rows={4}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Please explain why this ticket should be transferred..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferReason('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestingTransfer || !transferReason.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {requestingTransfer ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Ticket Reopen</h3>
              <form onSubmit={handleRequestReopen}>
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
                    onClick={() => {
                      setShowReopenModal(false);
                      setReopenReason('');
                    }}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;