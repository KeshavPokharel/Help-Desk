import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, User, FileText, Plus, CheckCircle } from 'lucide-react';
import { ticketService, transferService, messageService, userService } from '../services';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import MessageChat from '../components/ui/MessageChat';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [transferData, setTransferData] = useState({
    to_agent_id: '',
    reason: ''
  });

  useEffect(() => {
    if (id) {
      fetchInitialData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Admins don't need to fetch notes since they can't see them
      const fetchPromises = [
        fetchTicketDetails(),
        fetchAgents()
      ];
      
      // Only fetch notes for non-admin users
      if (user?.role !== 'admin') {
        fetchPromises.push(fetchNotes());
      }
      
      await Promise.all(fetchPromises);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async () => {
    try {
      const data = await ticketService.getTicket(id);
      setTicket(data);
    } catch (error) {
      toast.error('Failed to fetch ticket details');
      console.error('Error fetching ticket:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await userService.getUsers();
      const agentUsers = data.filter(u => u.role === 'agent' && u.id !== user?.id);
      setAgents(agentUsers);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const data = await ticketService.getNotes(id);
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      await ticketService.createNote(id, { note: newNote });
      toast.success('Note added successfully');
      setShowAddNoteModal(false);
      setNewNote('');
      fetchNotes(); // Refresh notes
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Error adding note:', error);
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferData.to_agent_id || !transferData.reason.trim()) {
      toast.error('Please select an agent and provide a reason');
      return;
    }

    try {
      await transferService.requestTransfer(id, transferData);
      toast.success('Transfer request submitted for admin approval');
      setShowTransferModal(false);
      setTransferData({ to_agent_id: '', reason: '' });
    } catch (error) {
      toast.error('Failed to submit transfer request');
      console.error('Error requesting transfer:', error);
    }
  };

  const handleApproveReopen = async () => {
    try {
      await ticketService.approveReopenRequest(id);
      toast.success('Reopen request approved successfully');
      fetchTicketDetails(); // Refresh ticket details
    } catch (error) {
      toast.error('Failed to approve reopen request');
      console.error('Error approving reopen request:', error);
    }
  };

  const handleCloseTicket = async (e) => {
    e.preventDefault();
    try {
      await ticketService.closeTicket(id, resolutionNote.trim() || null);
      toast.success('Ticket closed successfully');
      setShowCloseModal(false);
      setResolutionNote('');
      fetchTicketDetails(); // Refresh ticket details
    } catch (error) {
      toast.error('Failed to close ticket');
      console.error('Error closing ticket:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'requested_reopen':
        return 'bg-purple-100 text-purple-800';
      case 'reopened':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

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
        
        {/* Action Buttons for Agents */}
        {user?.role === 'agent' && (
          <div className="flex items-center space-x-3">
            {ticket?.agent?.id === user?.id ? (
              <>
                {/* Request Transfer Button - only show for tickets that can be transferred */}
                {(ticket?.status !== 'closed' && ticket?.status !== 'resolved') && (
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Request Transfer
                  </button>
                )}
                
                {/* Close Ticket Button - show for assigned agent on tickets that can be closed */}
                {(ticket?.status === 'assigned' || ticket?.status === 'in_progress' || ticket?.status === 'transferred' || ticket?.status === 'reopened') && (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Close Ticket
                  </button>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
                {ticket?.agent ? (
                  <>Only the assigned agent ({ticket?.agent?.name || 'Unknown'}) can request transfers</>
                ) : (
                  <>This ticket is unassigned - only admins can initiate transfers</>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{ticket?.initial_description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket?.status || 'unknown')}`}>
                    {ticket?.status || 'Unknown'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket?.priority || 'unknown')}`}>
                    {ticket?.priority || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{ticket?.created_at ? formatDate(ticket.created_at) : 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{ticket?.updated_at ? formatDate(ticket.updated_at) : 'Unknown'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
                <div className="mt-1 flex items-center">
                  {ticket?.agent ? (
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-medium">
                          {ticket.agent.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900">{ticket.agent.name}</span>
                      {user?.id === ticket.agent.id && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Assigned to you
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reopen Request Alert - Show for tickets with reopen request */}
          {ticket?.status === 'requested_reopen' && user?.role === 'admin' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
                <RotateCcw className="h-5 w-5 mr-2" />
                Reopen Request Pending
              </h3>
              <p className="text-sm text-purple-700 mb-4">
                This ticket has been requested to be reopened by the customer. 
                As an admin, you can approve this request.
              </p>
              <button
                onClick={handleApproveReopen}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Approve Reopen Request
              </button>
            </div>
          )}

          {/* User Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ticket.user?.name}</p>
                  <p className="text-sm text-gray-500">{ticket.user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Agent */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Agent</h3>
            <div className="space-y-3">
              {ticket.agent ? (
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ticket.agent.name}</p>
                    <p className="text-sm text-gray-500">{ticket.agent.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No agent assigned</p>
              )}
            </div>
          </div>

          {/* Category Information */}
          {ticket.category && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category</h3>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{ticket.category.name}</p>
                {ticket.subcategory && (
                  <p className="text-sm text-gray-500">{ticket.subcategory.name}</p>
                )}
              </div>
            </div>
          )}
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

      {/* Private Notes Section - Only visible to agents, not admins */}
      {user?.role !== 'admin' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Private Agent Notes</h3>
            </div>
          <button
            onClick={() => setShowAddNoteModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </button>
        </div>

        <div className="space-y-4">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-medium">
                        {note.agent?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {note.agent?.name || 'Unknown Agent'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No private notes yet</p>
              <p className="text-gray-400 text-sm">Click "Add Note" to create the first note for this ticket</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Transfer</h3>
            <form onSubmit={handleRequestTransfer}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer to Agent *
                </label>
                <select
                  value={transferData.to_agent_id}
                  onChange={(e) => setTransferData({ ...transferData, to_agent_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Transfer *
                </label>
                <textarea
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please explain why you want to transfer this ticket..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferData({ to_agent_id: '', reason: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit Transfer Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Private Note</h3>
            <form onSubmit={handleAddNote}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content *
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Enter your private note here..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setNewNote('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Ticket Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleCloseTicket}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Close Ticket</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Summary (Optional)
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Briefly describe how the issue was resolved..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  This note will be visible to the customer and will help with future similar issues.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseModal(false);
                    setResolutionNote('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;