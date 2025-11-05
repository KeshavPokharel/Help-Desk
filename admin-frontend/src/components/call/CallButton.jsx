import { useState } from 'react';
import { Phone, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const CallButton = ({ ticket, remoteUser, disabled = false }) => {
  const { startCall, callState, currentCall } = useCall();
  const [showOptions, setShowOptions] = useState(false);

  const handleAudioCall = async () => {
    try {
      await startCall(ticket.id, remoteUser, true);
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to start audio call:', error);
    }
  };

  const handleVideoCall = async () => {
    try {
      await startCall(ticket.id, remoteUser, false);
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  };

  const isInCall = currentCall && currentCall.ticketId === ticket.id;
  const isCallActive = callState !== 'idle' && callState !== 'disconnected';

  if (!ticket.agent_id) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
        title="Ticket must be assigned to an agent"
      >
        <Phone size={18} />
      </button>
    );
  }

  if (isInCall && isCallActive) {
    return (
      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium">In Call</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isCallActive}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
          disabled || isCallActive
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
        title="Start call"
      >
        <Phone size={18} />
        <span className="text-sm font-medium">Call</span>
      </button>

      {/* Call Options Dropdown */}
      {showOptions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowOptions(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-20">
            <button
              onClick={handleAudioCall}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <Phone size={18} className="text-gray-600" />
              <span className="text-sm text-gray-700">Audio Call</span>
            </button>
            <button
              onClick={handleVideoCall}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <Video size={18} className="text-gray-600" />
              <span className="text-sm text-gray-700">Video Call</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CallButton;
