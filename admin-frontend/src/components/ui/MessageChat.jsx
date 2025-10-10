import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, RefreshCw } from 'lucide-react';
import { messageService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const MessageChat = ({ ticketId, ticket, initialMessages = [] }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { user, token } = useAuth();
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const intentionalDisconnect = useRef(false);
  const lastConnectionAttempt = useRef(0);

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
    
    // Load initial messages for new ticket
    if (ticketId) {
      loadInitialMessages();
    }
  }, [ticketId]);

  const connectToTicketRoom = useCallback(() => {
    
    // Prevent rapid reconnection attempts (cooldown period)
    const now = Date.now();
    if (now - lastConnectionAttempt.current < 1000) {
      return;
    }
    lastConnectionAttempt.current = now;

    // Admins cannot connect to WebSocket - they have read-only access via HTTP
    if (user?.role === 'admin') {
      return;
    }

    if (!ticketId || !user || !token) {
      return;
    }

    // Check if user has access to this ticket before attempting connection
    if (ticket) {
      const ticketUserId = ticket.user?.id;
      const ticketAgentId = ticket.agent?.id;
      
      const isTicketCreator = user.role === 'user' && ticketUserId === user.id;
      const isAssignedAgent = user.role === 'agent' && ticketAgentId === user.id;
      const hasAccess = isTicketCreator || isAssignedAgent;
      
      if (!hasAccess) {
        return;
      }
    }

    // Prevent multiple connection attempts
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected to ticket room');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting to ticket room');
      return;
    }

    // Close any existing connection before creating new one
    if (wsRef.current) {
      console.log('Closing existing WebSocket connection before creating new one');
      intentionalDisconnect.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      console.log(`Connecting to ticket room ${ticketId}...`);
      console.log('User role:', user?.role, 'User ID:', user?.id);
      const wsUrl = `ws://localhost:8000/messages/room/${ticketId}?token=${token}`;
      intentionalDisconnect.current = false;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionAttempts(0);
        toast.success('Connected to real-time messaging', { duration: 2000 });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const newMsg = {
              id: data.id,
              content: data.content,
              sender: {
                id: data.sender_id,
                name: data.sender_name,
                role: data.sender_role
              },
              sender_name: data.sender_name,
              timestamp: data.timestamp,
              created_at: data.timestamp
            };
            
            setMessages(prevMessages => {
              // Check if message already exists to prevent duplicates
              const exists = prevMessages.some(msg => msg.id === newMsg.id);
              if (exists) {
                return prevMessages;
              }
              
              // Replace optimistic message with real message if content and sender match
              const optimisticIndex = prevMessages.findIndex(msg => 
                msg.id.toString().startsWith('temp-') && 
                msg.content === newMsg.content && 
                msg.sender?.id === newMsg.sender.id
              );
              
              if (optimisticIndex !== -1) {
                const updatedMessages = [...prevMessages];
                updatedMessages[optimisticIndex] = newMsg;
                return updatedMessages;
              }
              
              return [...prevMessages, newMsg];
            });
          } else if (data.type === 'user_joined') {
            console.log(`${data.user_name} joined the ticket room`);
          } else if (data.type === 'user_left') {
            console.log(`${data.user_name} left the ticket room`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected from ticket room ${ticketId}:`, event.code, event.reason);
        setIsConnected(false);
        
        // Don't reconnect if it was intentional
        if (intentionalDisconnect.current) {
          console.log('Intentional disconnect, not reconnecting');
          intentionalDisconnect.current = false;
          return;
        }
        
        // Only auto-reconnect for specific error codes and if not intentionally closed
        const shouldReconnect = event.code !== 1000 && // Not normal closure
                               event.code !== 1001 && // Not going away
                               event.code !== 1008 && // Policy violation (auth issues)
                               user && token && 
                               connectionAttempts < MAX_RECONNECT_ATTEMPTS;
        
        if (shouldReconnect) {
          console.log(`Attempting to reconnect to ticket room... (${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          setConnectionAttempts(prev => prev + 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToTicketRoom();
          }, RECONNECT_DELAY);
        } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          toast.error('Lost connection to real-time messaging. Please refresh the page.');
        } else if (event.code === 1008) {
          console.log('WebSocket connection denied - authentication or permission issue');
          toast.error('Unable to connect to messaging. Please check your permissions.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error in ticket room ${ticketId}:`, error);
        console.log('Connection state when error occurred:', wsRef.current?.readyState);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection to ticket room:', error);
      setIsConnected(false);
    }
  }, [ticketId, user?.id, user?.role, token]); // Stable dependencies only

  const disconnectFromTicketRoom = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      console.log(`Disconnecting from ticket room ${ticketId}...`);
      intentionalDisconnect.current = true;
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionAttempts(0);
  }, [ticketId]);

  const loadInitialMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);
      const allMessages = await messageService.getMessages(ticketId);
      setMessages(allMessages);
      setMessagesLoaded(true);
    } catch (error) {
      console.error('Error loading initial messages:', error);
      setMessagesLoaded(true);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [ticketId]); // Only depend on ticketId

  useEffect(() => {
    // Load messages when component mounts or ticketId changes
    if (ticketId && !messagesLoaded && !loadingMessages) {
      loadInitialMessages();
    }
  }, [ticketId, loadInitialMessages, messagesLoaded, loadingMessages]);

  // Connect to ticket room when ticket is available (only for non-admin users)
  useEffect(() => {
    // Wait for ticket data to be loaded before attempting connection
    if (ticketId && user && token && ticket && user.role !== 'admin') {
      // Add a small delay to prevent immediate connection issues
      const connectionTimeout = setTimeout(() => {
        connectToTicketRoom();
      }, 100);
      
      return () => {
        clearTimeout(connectionTimeout);
        disconnectFromTicketRoom();
      };
    }

    return () => {
      disconnectFromTicketRoom();
    };
  }, [ticketId, user?.id, user?.role, token, ticket?.user_id, ticket?.agent_id]); // Wait for ticket data



  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]); // Scroll when messages array changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const refreshMessages = async () => {
    try {
      setRefreshing(true);
      await loadInitialMessages();
      toast.success('Messages refreshed');
    } catch (error) {
      console.error('Error refreshing messages:', error);
      toast.error('Failed to refresh messages');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Admins cannot send messages (read-only access)
    if (user?.role === 'admin') {
      toast.error('Admins can view messages but cannot send them in private conversations');
      return;
    }

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    
    try {
      if (user?.role === 'agent' || user?.role === 'user') {
        // Try WebSocket first if connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            content: messageContent
          }));
          
          // Add message optimistically to local state
          const optimisticMsg = {
            id: `temp-${Date.now()}`,
            content: messageContent,
            sender: {
              id: user.id,
              name: user.name,
              role: user.role
            },
            sender_name: user.name,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
          setMessages(prevMessages => [...prevMessages, optimisticMsg]);
          setNewMessage('');
        } else {
          // Fallback to HTTP if WebSocket is not connected
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
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString, timeOnly = false) => {
    const date = new Date(dateString);
    if (timeOnly) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleString();
  };

  const canSendMessages = user?.role !== 'admin';
  const getConnectionStatus = () => {
    if (user?.role === 'admin') return 'Admin View';
    if (isConnected) return 'Connected';
    if (connectionAttempts > 0) return 'Reconnecting...';
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Messages ({messages.length})
          </h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm">
              <div className={`h-2 w-2 rounded-full mr-2 ${
                user?.role === 'admin' ? 'bg-blue-500' : 
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={
                user?.role === 'admin' ? 'text-blue-600' : 
                isConnected ? 'text-green-600' : 'text-red-600'
              }>
                {getConnectionStatus()}
              </span>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={refreshMessages}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Messages List */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
          {loadingMessages ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No messages yet</p>
              <p className="text-gray-400 text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender?.id === user?.id || message.sender_id === user?.id;
              return (
                <div key={message.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
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
                      {formatDate(message.timestamp || message.created_at, true)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {canSendMessages && (
          <form onSubmit={handleSendMessage}>
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  disabled={sendingMessage}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
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
        )}
        
        {!canSendMessages && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Admin View:</strong> You can view all messages but cannot participate in private conversations between users and agents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageChat;