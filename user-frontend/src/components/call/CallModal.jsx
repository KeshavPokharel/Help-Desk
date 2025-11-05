import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Minimize2, Maximize2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const CallModal = () => {
  const {
    currentCall,
    callState,
    isMuted,
    isVideoEnabled,
    remoteStreamAvailable,
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0); // Duration in seconds
  const callStartTimeRef = useRef(null);

  // Start timer when call becomes connected
  useEffect(() => {
    if (callState === 'connected' && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
    }
    
    // Reset timer when call ends
    if (!currentCall || callState === 'idle' || callState === 'disconnected') {
      callStartTimeRef.current = null;
      setCallDuration(0);
    }
  }, [callState, currentCall]);

  // Update call duration every second
  useEffect(() => {
    let interval;
    
    if (callState === 'connected' && callStartTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!currentCall) return null;

  const getCallStateText = () => {
    switch (callState) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Idle';
    }
  };

  const getCallDuration = () => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed z-50 bg-gray-900 rounded-lg shadow-2xl transition-all duration-300 ${
      isMinimized 
        ? 'bottom-4 right-4 w-80' 
        : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl'
    }`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            callState === 'connected' ? 'bg-green-500' : 
            callState === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`} />
          <div>
            <h3 className="text-white font-medium">{currentCall.remoteUser.name}</h3>
            <p className="text-gray-400 text-xs">{getCallStateText()} • {getCallDuration()}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>
      </div>

      {/* Video Area */}
      {!isMinimized && (
        <div className="relative bg-gray-950 aspect-video">
          {/* Remote Video */}
          {remoteStreamAvailable ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-indigo-600 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white font-semibold">
                    {currentCall.remoteUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400">
                  {callState === 'connecting' ? 'Waiting for response...' : 'No video'}
                </p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {isVideoEnabled && localStream && (
            <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 rounded-b-lg">
        <div className="flex items-center justify-center space-x-4">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-all ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="text-white" size={20} />
            ) : (
              <Mic className="text-white" size={20} />
            )}
          </button>

          {/* Video On/Off */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all ${
              !isVideoEnabled 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoEnabled ? (
              <Video className="text-white" size={20} />
            ) : (
              <VideoOff className="text-white" size={20} />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
            title="End call"
          >
            <PhoneOff className="text-white" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
