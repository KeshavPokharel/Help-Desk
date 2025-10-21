import { useState, useCallback, useEffect } from 'react';
import { messageService } from '../services';
import { toast } from 'react-hot-toast';

export const useMessages = (ticketId, websocket) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) return prev;

      // Replace optimistic message with real message
      const optimisticIndex = prev.findIndex(msg => 
        msg.id.toString().startsWith('temp-') && 
        msg.content === newMessage.content && 
        msg.sender?.id === newMessage.sender.id
      );

      if (optimisticIndex !== -1) {
        const updated = [...prev];
        updated[optimisticIndex] = newMessage;
        return updated;
      }

      return [...prev, newMessage];
    });
  }, []);

  const addOptimisticMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // WebSocket message handling
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
      } else if (data.type === 'user_joined') {
        console.log(`${data.user_name} joined the ticket room`);
      } else if (data.type === 'user_left') {
        console.log(`${data.user_name} left the ticket room`);
      }
    };

    return websocket.addMessageListener(handleWebSocketMessage);
  }, [websocket, addMessage]);

  // Load initial messages
  useEffect(() => {
    if (ticketId && !messagesLoaded && !loadingMessages) {
      loadInitialMessages();
    }
  }, [ticketId, messagesLoaded, loadingMessages, loadInitialMessages]);

  // Reset state when ticket changes
  useEffect(() => {
    setMessages([]);
    setMessagesLoaded(false);
    setLoadingMessages(false);
    setRefreshing(false);
  }, [ticketId]);

  return {
    messages,
    loadingMessages,
    refreshing,
    loadInitialMessages,
    refreshMessages,
    addMessage,
    addOptimisticMessage
  };
};