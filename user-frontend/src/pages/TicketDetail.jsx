import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTicketData } from '../hooks/useTicketData';
import { useMessaging } from '../hooks/useMessaging';
import { useTicketActions } from '../hooks/useTicketActions';
import TicketHeader from '../components/ticket/TicketHeader';
import TicketDescription from '../components/ticket/TicketDescription';
import MessagingSection from '../components/ticket/MessagingSection';
import TicketSidebar from '../components/ticket/TicketSidebar';
import TransferModal from '../components/ticket/TransferModal';
import ReopenModal from '../components/ticket/ReopenModal';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Custom hooks
  const { ticket, loading, transfers, setTransfers, refreshTicket } = useTicketData(id);
  const {
    messages,
    newMessage,
    setNewMessage,
    sendingMessage,
    messagesLoaded,
    messagesEndRef,
    wsConnected,
    canAccessMessages,
    loadMessages,
    handleSendMessage
  } = useMessaging(id, user, ticket);
  const {
    showTransferModal,
    transferReason,
    setTransferReason,
    requestingTransfer,
    handleRequestTransfer,
    openTransferModal,
    closeTransferModal,
    showReopenModal,
    reopenReason,
    setReopenReason,
    requestingReopen,
    handleRequestReopen,
    openReopenModal,
    closeReopenModal
  } = useTicketActions(id, refreshTicket);

  // Load messages when component mounts
  useEffect(() => {
    if (canAccessMessages && !messagesLoaded) {
      loadMessages();
    }
  }, [canAccessMessages, messagesLoaded, loadMessages]);

  // User permission checks
  const isAssignedAgent = user?.role === 'agent' && ticket?.agent?.id === user?.id;
  const isTicketCreator = user?.role === 'user' && (
    ticket?.user_id === user?.id || 
    ticket?.userId === user?.id ||
    ticket?.user?.id === user?.id
  );
  const hasPendingTransfer = transfers.some(transfer => transfer.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <TicketHeader
        ticket={ticket}
        onNavigateBack={() => navigate('/dashboard/tickets')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <TicketDescription ticket={ticket} />

          {/* Messages */}
          <MessagingSection
            canAccessMessages={canAccessMessages}
            messages={messages}
            wsConnected={wsConnected}
            messagesEndRef={messagesEndRef}
            user={user}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            sendingMessage={sendingMessage}
            ticket={ticket}
          />
        </div>

        {/* Sidebar */}
        <TicketSidebar
          ticket={ticket}
          user={user}
          transfers={transfers}
          isTicketCreator={isTicketCreator}
          isAssignedAgent={isAssignedAgent}
          hasPendingTransfer={hasPendingTransfer}
          onRequestTransfer={openTransferModal}
          onRequestReopen={openReopenModal}
        />
      </div>

      {/* Modals */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={closeTransferModal}
        transferReason={transferReason}
        setTransferReason={setTransferReason}
        onSubmit={handleRequestTransfer}
        requestingTransfer={requestingTransfer}
      />

      <ReopenModal
        isOpen={showReopenModal}
        onClose={closeReopenModal}
        reopenReason={reopenReason}
        setReopenReason={setReopenReason}
        onSubmit={handleRequestReopen}
        requestingReopen={requestingReopen}
      />
    </div>
  );
};

export default TicketDetail;