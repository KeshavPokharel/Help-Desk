import React, { useRef, useEffect } from 'react';
import { User, RefreshCw } from 'lucide-react';

const MessageList = ({ messages, loadingMessages, currentUserId }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString();
    }
  };

  if (loadingMessages) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">Loading messages...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <p className="text-gray-500 mt-2">No messages yet</p>
        <p className="text-gray-400 text-sm">Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender?.id === currentUserId || message.sender_id === currentUserId;
        const senderName = message.sender?.name || message.sender_name || 'Unknown User';
        
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
                      {senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {senderName}
                  </span>
                </div>
              )}
              <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-900'}`}>
                {message.content}
              </p>
              <p className={`text-xs mt-1 ${
                isCurrentUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatDate(message.timestamp || message.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;