import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import MessageChat from '../components/ui/MessageChat';
import TicketInfo from '../components/ticket/TicketInfo';
import TicketActions from '../components/ticket/TicketActions';
import TicketSidebar from '../components/ticket/TicketSidebar';
import ReopenRequestAlert from '../components/ticket/ReopenRequestAlert';
import PrivateNotes from '../components/ticket/PrivateNotes';
import TransferModal from '../components/ticket/TransferModal';
import CloseTicketModal from '../components/ticket/CloseTicketModal';
import CallButton from '../components/call/CallButton';
import { useTicketData } from '../hooks/useTicketData';
import { useTicketActions } from '../hooks/useTicketActions';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connectToTicket, disconnectFromTicket } = useCall();
  
  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Custom hooks for data and actions
  const { ticket, agents, notes, loading, refetchTicket, refetchNotes } = useTicketData(id, user);
  const {
    transferData,
    setTransferData,
    resolutionNote,
    setResolutionNote,
    handleRequestTransfer,
    handleApproveReopen,
    handleCloseTicket
  } = useTicketActions(id, refetchTicket);

  // Modal handlers
  const handleTransferSubmit = async (e) => {
    const success = await handleRequestTransfer(e);
    if (success) {
      setShowTransferModal(false);
    }
  };

  const handleCloseSubmit = async (e) => {
    const success = await handleCloseTicket(e);
    if (success) {
      setShowCloseModal(false);
    }
  };

  // Connect to ticket WebSocket for incoming calls
  useEffect(() => {
    if (id) {
      console.log('Admin: Connecting to ticket for calls:', id);
      connectToTicket(parseInt(id));
      
      return () => {
        console.log('Admin: Disconnecting from ticket:', id);
        disconnectFromTicket();
      };
    }
  }, [id, connectToTicket, disconnectFromTicket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg font-medium">Ticket not found</p>
          <p className="text-sm">The ticket you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{ticket?.title || 'Untitled Ticket'}</h1>
            <p className="text-sm text-gray-500">Ticket #{ticket?.ticket_uid || ticket?.id || 'Unknown'}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Call Button - Only for agents on assigned tickets */}
          {user?.role === 'agent' && ticket.agent_id === user.id && ticket.user && (
            <CallButton 
              ticket={ticket}
              remoteUser={ticket.user}
            />
          )}
          
          <TicketActions 
            ticket={ticket}
            user={user}
            onTransferClick={() => setShowTransferModal(true)}
            onCloseClick={() => setShowCloseModal(true)}
          />
        </div>
      </div>

      {/* Ticket Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TicketInfo ticket={ticket} />
        </div>

        <div className="space-y-6">
          {/* Reopen Request Alert */}
          <ReopenRequestAlert 
            ticket={ticket}
            user={user}
            onApproveReopen={handleApproveReopen}
          />

          {/* Sidebar Information */}
          <TicketSidebar ticket={ticket} user={user} />
        </div>
      </div>

      {/* Messages Section - Only visible to users and agents, not admins */}
      {user?.role !== 'admin' && (
        <MessageChat ticketId={id} ticket={ticket} />
      )}

      {/* Admin Information about Private Sections */}
      {user?.role === 'admin' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-medium text-blue-900">Private Communication Areas</h3>
          </div>
          <p className="mt-2 text-sm text-blue-700">
            As an administrator, you have read-only access to ticket details and can manage assignments, transfers, and closures. 
            Private messages and agent notes between users and agents are not accessible to maintain confidentiality.
          </p>
        </div>
      )}

      {/* Private Notes Section */}
      <PrivateNotes 
        ticketId={id}
        notes={notes}
        user={user}
        onNotesUpdate={refetchNotes}
      />

      {/* Modals */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferData({ to_agent_id: '', reason: '' });
        }}
        agents={agents}
        transferData={transferData}
        setTransferData={setTransferData}
        onSubmit={handleTransferSubmit}
      />

      <CloseTicketModal
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          setResolutionNote('');
        }}
        resolutionNote={resolutionNote}
        setResolutionNote={setResolutionNote}
        onSubmit={handleCloseSubmit}
      />
    </div>
  );
};

export default TicketDetail;