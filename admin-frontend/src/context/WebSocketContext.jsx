import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import useWebSocket, { ReadyState } from 'react-use-websocket';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [messageListeners, setMessageListeners] = useState(new Set());
  const [hasShownInitialToast, setHasShownInitialToast] = useState(false);

  // WebSocket URL - disabled for now since we're using room-based connections
  const socketUrl = null; // user && token ? `ws://localhost:8000/messages/ws?token=${token}` : null;

  const {
    sendMessage: wsSendMessage,
    lastMessage,
    readyState,
    getWebSocket
  } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log('WebSocket connected successfully');
      if (!hasShownInitialToast) {
        toast.success('Connected to real-time messaging', { duration: 2000 });
        setHasShownInitialToast(true);
      }
    },
    onClose: (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast.error('WebSocket connection error');
    },
    shouldReconnect: (closeEvent) => {
      // Reconnect unless it was a normal closure (1000) or unauthorized (4001)
      return closeEvent.code !== 1000 && closeEvent.code !== 4001;
    },
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);
        console.log('WebSocket message received:', data);
        
        // Notify all registered listeners
        messageListeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, 'Raw data:', lastMessage.data);
      }
    }
  }, [lastMessage, messageListeners]);

  const sendMessage = useCallback((message) => {
    if (readyState === ReadyState.OPEN) {
      wsSendMessage(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }, [wsSendMessage, readyState]);

  const addMessageListener = useCallback((listener) => {
    setMessageListeners(prev => new Set([...prev, listener]));
    
    // Return cleanup function
    return () => {
      setMessageListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(listener);
        return newSet;
      });
    };
  }, []);

  // Connection status
  const isConnected = readyState === ReadyState.OPEN;

  // Legacy methods for compatibility (these are handled automatically by the library now)
  const connectWebSocket = useCallback(() => {
    console.log('connectWebSocket called - handled automatically by react-use-websocket');
  }, []);

  const disconnectWebSocket = useCallback(() => {
    console.log('disconnectWebSocket called - handled automatically by react-use-websocket');
  }, []);

  const value = {
    isConnected,
    sendMessage,
    addMessageListener,
    connectWebSocket, // Keep for compatibility
    disconnectWebSocket, // Keep for compatibility
    readyState, // Expose ready state for advanced usage
    connectionStatus: {
      [ReadyState.CONNECTING]: 'Connecting',
      [ReadyState.OPEN]: 'Open',
      [ReadyState.CLOSING]: 'Closing',
      [ReadyState.CLOSED]: 'Closed',
      [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState]
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};