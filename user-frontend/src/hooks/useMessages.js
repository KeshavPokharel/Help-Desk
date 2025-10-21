import { useState, useEffect, useCallback } from 'react';
import { messageService } from '../services';
import { toast } from 'react-hot-toast';

export const useMessages = (ticketId, websocket) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const loadInitialMessages = useCallback(async () => {
    if (!ticketId) return;
    
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
  }, [ticketId]);

  const refreshMessages = useCallback(async () => {
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
  }, [loadInitialMessages]);

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const addOptimisticMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!websocket?.addMessageListener) return;

    const handleWebSocketMessage = (data) => {
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
        addMessage(newMsg);
      }
    };

    return websocket.addMessageListener(handleWebSocketMessage);
  }, [websocket, addMessage]);

  // Reset state when ticketId changes
  useEffect(() => {
    setMessages([]);
    setMessagesLoaded(false);
    setLoadingMessages(false);
  }, [ticketId]);

  // Load initial messages when component mounts or ticketId changes
  useEffect(() => {
    if (ticketId && !messagesLoaded && !loadingMessages) {
      loadInitialMessages();
    }
  }, [ticketId, messagesLoaded, loadingMessages, loadInitialMessages]);

  return {
    messages,
    loadingMessages,
    refreshing,
    refreshMessages,
    addMessage,
    addOptimisticMessage
  };
};