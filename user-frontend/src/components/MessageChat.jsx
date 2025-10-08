import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, RefreshCw } from 'lucide-react';
import { messageService } from '../services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const MessageChat = ({ ticketId, initialMessages = [] }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { user, token } = useAuth();
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 2000;

  useEffect(() => {
    // Reset state when ticketId changes
    setMessages([]);
    setMessagesLoaded(false);
    setLoadingMessages(false);
    setIsConnected(false);
    setConnectionAttempts(0);
    
    // Disconnect old connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [ticketId]);

  const connectToTicketRoom = useCallback(() => {
    if (!ticketId || !user || !token) {
      console.log('Missing requirements for WebSocket connection:', { ticketId, user: !!user, token: !!token });
      return;
    }

    // Check if user has permission to access this ticket's messages
    // Users can only access their own tickets, but we'll let the backend validate this
    if (!user.id) {
      console.log('User ID missing, cannot connect to ticket room');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected to ticket room');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting to ticket room');
      return;
    }

    try {
      console.log(`Connecting to ticket room ${ticketId}...`);
      const wsUrl = `ws://localhost:8000/messages/room/${ticketId}?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`Connected to ticket room ${ticketId}`);
        setIsConnected(true);
        setConnectionAttempts(0);
        toast.success('Connected to chat', { duration: 2000 });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message in ticket room:', data);
          
          if (data.type === 'message') {
            const newMsg = {
              id: data.id,
              content: data.content,
              sender: {
                id: data.sender_id,
                name: data.sender_name,
                role: data.sender_role
              },
              timestamp: data.timestamp,
              created_at: data.timestamp
            };
            
            setMessages(prevMessages => {
              // Check if message already exists to prevent duplicates
              const exists = prevMessages.some(msg => msg.id === newMsg.id);
              if (exists) {
                console.log('Message already exists, skipping duplicate');
                return prevMessages;
              }
              console.log('Adding new real-time message to state');
              return [...prevMessages, newMsg];
            });
          } else if (data.type === 'user_joined') {
            console.log(`${data.user_name} joined the chat`);
            toast.success(`${data.user_name} joined the chat`);
          } else if (data.type === 'user_left') {
            console.log(`${data.user_name} left the chat`);
            toast.info(`${data.user_name} left the chat`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected from ticket room ${ticketId}:`, event.code, event.reason);
        setIsConnected(false);
        
        // Don't reconnect on permission errors (1008) or policy violations
        if (event.code === 1008) {
          console.log('WebSocket closed due to policy violation - not reconnecting');
          toast.error('Unable to connect to chat. Please check your permissions.');
          return;
        }
        
        // Auto-reconnect if not a normal closure and user is still authenticated
        if (event.code !== 1000 && user && token) {
          setConnectionAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts <= MAX_RECONNECT_ATTEMPTS) {
              console.log(`Attempting to reconnect to ticket room... (${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
              reconnectTimeoutRef.current = setTimeout(() => {
                connectToTicketRoom();
              }, RECONNECT_DELAY);
            }
            return newAttempts;
          });
        } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          toast.error('Lost connection to chat. Please refresh the page.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error in ticket room ${ticketId}:`, error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection to ticket room:', error);
      setIsConnected(false);
    }
  }, [ticketId, user?.id, token]); // Removed connectionAttempts to prevent recreation loops

  const disconnectFromTicketRoom = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      console.log(`Disconnecting from ticket room ${ticketId}...`);
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionAttempts(0);
  }, [ticketId]);

  const loadInitialMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);
      console.log('Loading initial messages for ticket:', ticketId);
      const allMessages = await messageService.getMessages(ticketId);
      console.log('Loaded messages:', allMessages);
      setMessages(allMessages);
      setMessagesLoaded(true);
    } catch (error) {
      console.error('Error loading initial messages:', error);
      setMessagesLoaded(true);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [ticketId]);

  useEffect(() => {
    // Load messages when component mounts or ticketId changes
    if (ticketId && !messagesLoaded && !loadingMessages) {
      loadInitialMessages();
    }
  }, [ticketId, loadInitialMessages, messagesLoaded, loadingMessages]);

  // Connect to ticket room when ticket is available
  useEffect(() => {
    if (ticketId && user && token) {
      connectToTicketRoom();
    }

    return () => {
      disconnectFromTicketRoom();
    };
  }, [ticketId, user, token, connectToTicketRoom, disconnectFromTicketRoom]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // Only scroll when message count changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    
    try {
      // Try WebSocket first if connected
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          content: messageContent
        }));
        setNewMessage('');
      } else {
        // Fallback to HTTP if WebSocket is not connected
        console.log('WebSocket not connected, using HTTP fallback');
        const response = await messageService.sendMessage({
          content: messageContent,
          ticket_id: ticketId
        });
        
        // Add message to UI immediately if HTTP send was successful
        const newMsg = {
          id: response.id || Date.now(),
          content: messageContent,
          sender: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        setMessages(prevMessages => [...prevMessages, newMsg]);
        setNewMessage('');
        toast.success('Message sent');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getUserRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Chat with Support</h3>
        </div>
      </div>
      
      <div className="p-6">
        {/* Messages List */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id || index} className={`flex space-x-3 ${
                message.sender?.id === user?.id ? 'justify-end' : 'justify-start'
              }`}>
                {message.sender?.id !== user?.id && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {message.sender?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                  </div>
                )}
                <div className={`flex-1 max-w-xs lg:max-w-md ${
                  message.sender?.id === user?.id ? 'text-right' : 'text-left'
                }`}>
                  <div className={`p-3 rounded-lg ${
                    message.sender?.id === user?.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.sender?.id !== user?.id && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.sender?.name || 'Support Agent'}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          getUserRoleBadge(message.sender?.role)
                        }`}>
                          {message.sender?.role || 'agent'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender?.id === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatDate(message.timestamp || message.created_at)}
                    </p>
                  </div>
                </div>
                {message.sender?.id === user?.id && (
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage}>
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageChat;