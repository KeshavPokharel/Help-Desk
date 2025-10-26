import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { ticketService } from '../../services';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';

const PrivateNotes = ({ ticketId, notes, user, onNotesUpdate }) => {
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Don't render for admin users
  if (user?.role === 'admin') return null;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      await ticketService.createNote(ticketId, { note: newNote });
      toast.success('Note added successfully');
      setShowAddNoteModal(false);
      setNewNote('');
      onNotesUpdate(); // Refresh notes
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Error adding note:', error);
    }
  };

  return (
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

      {/* Add Note Modal */}
      <Modal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        title="Add Private Note"
      >
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
      </Modal>
    </div>
  );
};

export default PrivateNotes;