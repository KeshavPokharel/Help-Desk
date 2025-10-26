import React from 'react';
import { MessageSquare } from 'lucide-react';

const MessagingSection = ({
  canAccessMessages,
  messages,
  wsConnected,
  messagesEndRef,
  user,
  newMessage,
  setNewMessage,
  handleSendMessage,
  sendingMessage,
  ticket
}) => {
  if (!canAccessMessages) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messages
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">Messages not available</h4>
            <p className="mt-1 text-sm text-gray-500">
              {!(ticket?.agent || ticket?.agent_id)
                ? "Messages will be available once this ticket is assigned to an agent."
                : "You don't have permission to view messages for this ticket."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messages ({messages.length})
          </h3>
          <div className="flex items-center text-sm">
            <div className={`h-2 w-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={wsConnected ? 'text-green-600' : 'text-red-600'}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-gray-50">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.sender?.id === user?.id || message.sender_id === user?.id;
            return (
              <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
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
                    {new Date(message.created_at || message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">No messages yet</p>
            <p className="text-gray-400 text-sm">Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Form */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage}>
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                rows={3}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagingSection;