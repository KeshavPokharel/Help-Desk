import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export const useWebSocket = (ticketId, user, token, ticket) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const intentionalDisconnect = useRef(false);
  const lastConnectionAttempt = useRef(0);

  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 2000;

  const hasAccess = useCallback(() => {
    if (!ticket || !user) return false;
    if (user.role === 'admin') return false;
    
    const isTicketCreator = user.role === 'user' && ticket.user?.id === user.id;
    const isAssignedAgent = user.role === 'agent' && ticket.agent?.id === user.id;
    return isTicketCreator || isAssignedAgent;
  }, [ticket, user]);

  const connect = useCallback(() => {
    const now = Date.now();
    if (now - lastConnectionAttempt.current < 1000) return;
    lastConnectionAttempt.current = now;

    if (!hasAccess() || !ticketId || !token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

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
        
        if (intentionalDisconnect.current) {
          intentionalDisconnect.current = false;
          return;
        }

        const shouldReconnect = event.code !== 1000 && 
                               event.code !== 1001 && 
                               event.code !== 1008 && 
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
          console.log('WebSocket connection denied - authentication or permission issue');
          toast.error('Unable to connect to messaging. Please check your permissions.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error in ticket room ${ticketId}:`, error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, [ticketId, hasAccess, token, connectionAttempts, user]);

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

  const messageListeners = useRef([]);

  const addMessageListener = useCallback((callback) => {
    messageListeners.current.push(callback);
    
    // Return cleanup function
    return () => {
      messageListeners.current = messageListeners.current.filter(cb => cb !== callback);
    };
  }, []);

  useEffect(() => {
    if (ticketId && user && token && ticket && hasAccess()) {
      const timer = setTimeout(connect, 100);
      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }
    return disconnect;
  }, [ticketId, user?.id, user?.role, token, ticket?.user_id, ticket?.agent_id, connect, disconnect, hasAccess]);

  return {
    isConnected,
    connectionAttempts,
    connect,
    disconnect,
    sendMessage,
    addMessageListener
  };
};