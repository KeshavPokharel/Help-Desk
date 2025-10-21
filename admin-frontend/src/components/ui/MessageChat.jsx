import React from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useMessages } from '../../hooks/useMessages';
import { messageService } from '../../services';
import ConnectionStatus from '../messaging/ConnectionStatus';
import MessageList from '../messaging/MessageList';
import MessageInput from '../messaging/MessageInput';

const MessageChat = ({ ticketId, ticket, initialMessages = [] }) => {
  const { user, token } = useAuth();
  const websocket = useWebSocket(ticketId, user, token, ticket);
  const messages = useMessages(ticketId, websocket);

  const canSendMessages = user?.role !== 'admin';

  const handleSendMessage = async (content) => {
    if (user?.role === 'admin') {
      toast.error('Admins can view messages but cannot send them in private conversations');
      return;
    }

    if (user?.role === 'agent' || user?.role === 'user') {
      // Try WebSocket first if connected
      if (websocket.sendMessage(content)) {
        // Add optimistic message
        const optimisticMsg = {
          id: `temp-${Date.now()}`,
          content,
          sender: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          sender_name: user.name,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        messages.addOptimisticMessage(optimisticMsg);
      } else {
        // Fallback to HTTP if WebSocket is not connected
        const response = await messageService.sendMessage({
          content,
          ticket_id: ticketId
        });
        
        // Add message to UI immediately if HTTP send was successful
        const newMsg = {
          id: response.id || Date.now(),
          content,
          sender: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        messages.addMessage(newMsg);
        toast.success('Message sent');
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Messages ({messages.messages.length})
          </h3>
          <ConnectionStatus
            user={user}
            isConnected={websocket.isConnected}
            connectionAttempts={websocket.connectionAttempts}
            refreshing={messages.refreshing}
            onRefresh={messages.refreshMessages}
          />
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg">
          <MessageList
            messages={messages.messages}
            loadingMessages={messages.loadingMessages}
            currentUserId={user?.id}
          />
        </div>

        {canSendMessages ? (
          <MessageInput onSendMessage={handleSendMessage} />
        ) : (
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