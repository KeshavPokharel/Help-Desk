import { useState, useEffect, useRef } from 'react';
import { messageService } from '../services';
import { useWebSocket } from './useWebSocket';
import toast from 'react-hot-toast';

export const useMessaging = (ticketId, user, ticket) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');
  const { isConnected: wsConnected, sendMessage: wsSendMessage, addMessageListener } = useWebSocket(
    ticketId, 
    user, 
    token, 
    ticket
  );

  // Debug WebSocket connection
  useEffect(() => {
    console.log('WebSocket connected:', wsConnected);
  }, [wsConnected]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up WebSocket message listener
  useEffect(() => {
    if (addMessageListener) {
      const handleWebSocketMessage = (messageData) => {
        console.log('WebSocket message received:', messageData);
        
        if (messageData.type === 'message') {
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
          
          console.log('Processing new message:', newMsg);
          
          setMessages(prev => {
            console.log('Current messages:', prev.length);
            
            // Check if message already exists to avoid duplicates
            const exists = prev.find(msg => msg.id === newMsg.id);
            if (exists) {
              console.log('Message already exists, skipping');
              return prev;
            }
            
            // Replace optimistic message with real message if content and sender match
            const optimisticIndex = prev.findIndex(msg => 
              msg.id.toString().startsWith('temp-') && 
              msg.content === newMsg.content && 
              msg.sender?.id === newMsg.sender.id
            );
            
            if (optimisticIndex !== -1) {
              console.log('Replacing optimistic message at index:', optimisticIndex);
              const updatedMessages = [...prev];
              updatedMessages[optimisticIndex] = newMsg;
              return updatedMessages;
            }
            
            console.log('Adding new message to list');
            return [...prev, newMsg];
          });
        } else if (messageData.type === 'user_joined') {
          console.log(`${messageData.user_name} joined the chat`);
        } else if (messageData.type === 'user_left') {
          console.log(`${messageData.user_name} left the chat`);
        }
      };

      const cleanup = addMessageListener(handleWebSocketMessage);
      return cleanup;
    }
  }, [addMessageListener]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (messagesLoaded) return;
    
    try {
      const messagesData = await messageService.getMessages(ticketId);
      setMessages(messagesData);
      setMessagesLoaded(true);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      
      if (wsConnected && wsSendMessage) {
        // Send via WebSocket for real-time messaging
        console.log('Sending message via WebSocket:', { content: newMessage.trim() });
        const success = wsSendMessage(newMessage.trim());
        console.log('WebSocket send result:', success);
        
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
          ticket_id: parseInt(ticketId),
          content: newMessage,
        });
        // Refresh messages only for HTTP fallback
        await loadMessages();
      }
      
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Check if user can access messages
  const isAssignedAgent = user?.role === 'agent' && ticket?.agent?.id === user?.id;
  const isTicketCreator = user?.role === 'user' && (
    ticket?.user_id === user?.id || 
    ticket?.userId === user?.id ||
    ticket?.user?.id === user?.id
  );
  const canAccessMessages = ticket?.agent && (isAssignedAgent || isTicketCreator);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendingMessage,
    messagesLoaded,
    messagesEndRef,
    wsConnected,
    canAccessMessages,
    loadMessages,
    handleSendMessage,
    scrollToBottom
  };
};