import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const IncomingCallModal = () => {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();

  if (!incomingCall) return null;

  const isVideoCall = incomingCall.callType === 'video';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-pulse-slow">
        <div className="text-center">
          {/* Call Icon */}
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-100 rounded-full p-6 animate-bounce">
              {isVideoCall ? (
                <Video className="w-16 h-16 text-blue-600" />
              ) : (
                <Phone className="w-16 h-16 text-blue-600" />
              )}
            </div>
          </div>

          {/* Caller Info */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {incomingCall.caller.name}
          </h2>
          <p className="text-gray-600 mb-2">
            {incomingCall.caller.role === 'agent' ? 'Agent' : 'User'}
          </p>
          <p className="text-lg text-gray-700 mb-8">
            Incoming {isVideoCall ? 'video' : 'audio'} call...
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {/* Reject Button */}
            <button
              onClick={rejectIncomingCall}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 transition-all duration-200 transform hover:scale-110 shadow-lg"
              title="Decline"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            {/* Accept Button */}
            <button
              onClick={acceptIncomingCall}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-6 transition-all duration-200 transform hover:scale-110 shadow-lg animate-pulse"
              title="Accept"
            >
              {isVideoCall ? (
                <Video className="w-8 h-8" />
              ) : (
                <Phone className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default IncomingCallModal;
