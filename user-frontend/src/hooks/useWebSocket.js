import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useWebSocket = (ticketId, user, token, ticket) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const intentionalDisconnect = useRef(false);
  const lastConnectionAttempt = useRef(0);
  const messageListeners = useRef([]);

  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 2000;

  // Check if user has access to this ticket
  const hasAccess = useCallback(() => {
    if (!ticket || !user) return false;
    
    const ticketUserId = ticket.user?.id;
    const ticketAgentId = ticket.agent?.id;
    
    const isTicketCreator = user.role === 'user' && ticketUserId === user.id;
    const isAssignedAgent = user.role === 'agent' && ticketAgentId === user.id;
    
    return isTicketCreator || isAssignedAgent;
  }, [ticket, user]);

  const connect = useCallback(() => {
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

    // Check access before attempting connection
    if (!hasAccess()) {
      return;
    }

    // Don't create multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      intentionalDisconnect.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
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
          
          // Notify all listeners
          messageListeners.current.forEach(listener => {
            listener(data);
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        
        // Don't reconnect if it was intentional
        if (intentionalDisconnect.current) {
          intentionalDisconnect.current = false;
          return;
        }
        
        // Only auto-reconnect for specific error codes
        const shouldReconnect = event.code !== 1000 && // Not normal closure
                               event.code !== 1001 && // Not going away
                               event.code !== 1008 && // Policy violation (auth issues)
                               user && token && 
                               connectionAttempts < MAX_RECONNECT_ATTEMPTS;
        
        if (shouldReconnect) {
          setConnectionAttempts(prev => prev + 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          toast.error('Lost connection to real-time messaging. Please refresh the page.');
        } else if (event.code === 1008) {
          toast.error('Unable to connect to messaging. Please check your permissions.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error in ticket room ${ticketId}:`, error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [ticketId, user, token, hasAccess, connectionAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      intentionalDisconnect.current = true;
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionAttempts(0);
  }, []);

  const sendMessage = useCallback((content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
      return true;
    }
    return false;
  }, []);

  const addMessageListener = useCallback((listener) => {
    messageListeners.current.push(listener);
    
    // Return cleanup function
    return () => {
      messageListeners.current = messageListeners.current.filter(l => l !== listener);
    };
  }, []);

  // Auto-connect when conditions are met
  useEffect(() => {
    if (ticketId && user && token && ticket && user.role !== 'admin') {
      const connectionTimeout = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(connectionTimeout);
        disconnect();
      };
    }

    return () => {
      disconnect();
    };
  }, [ticketId, user?.id, user?.role, token, ticket?.user_id, ticket?.agent_id, connect, disconnect]);

  return {
    isConnected,
    connectionAttempts,
    connect,
    disconnect,
    sendMessage,
    addMessageListener
  };
};