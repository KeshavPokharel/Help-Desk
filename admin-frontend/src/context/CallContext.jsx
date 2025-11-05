import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CallContext = createContext(null);

// ICE servers configuration (using Google's public STUN servers)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const CallProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [currentCall, setCurrentCall] = useState(null); // { ticketId, isInitiator, remoteUser }
  const [callState, setCallState] = useState('idle'); // idle, connecting, connected, disconnected
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [remoteStreamAvailable, setRemoteStreamAvailable] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { ticketId, caller, callType }
  const [listeningTicketId, setListeningTicketId] = useState(null); // Ticket ID to listen for incoming calls
  
  // Refs for WebRTC
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingOfferRef = useRef(null); // Store incoming offer until accepted
  const hasShownErrorRef = useRef(false); // Track if error toast was shown

  // WebSocket URL for signaling
  const getSocketUrl = useCallback(() => {
    const ticketId = currentCall?.ticketId || listeningTicketId;
    if (!ticketId || !token) return null;
    return `ws://localhost:8000/calls/ws/${ticketId}?token=${token}`;
  }, [currentCall, listeningTicketId, token]);

  // WebSocket for signaling
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    getSocketUrl(),
    {
      shouldReconnect: () => currentCall !== null,
      reconnectAttempts: 3,
      reconnectInterval: 2000,
    }
  );

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStreamAvailable(true);
        console.log('Remote stream set');
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        sendJsonMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      switch (peerConnection.connectionState) {
        case 'connected':
          setCallState('connected');
          toast.success('Call connected');
          break;
        case 'disconnected':
        case 'failed':
          setCallState('disconnected');
          toast.error('Call disconnected');
          endCall();
          break;
        case 'closed':
          setCallState('idle');
          break;
      }
    };

    return peerConnection;
  }, [sendJsonMessage]);

  // Get user media (audio/video)
  const getUserMedia = useCallback(async (audioOnly = true) => {
    try {
      // Reset error flag at the start
      hasShownErrorRef.current = false;
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }

      // First, check if devices are available
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some(device => device.kind === 'audioinput');
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');

        console.log('Available devices:', {
          audioInputs: devices.filter(d => d.kind === 'audioinput').length,
          videoInputs: devices.filter(d => d.kind === 'videoinput').length,
          hasAudioInput,
          hasVideoInput
        });

        if (!hasAudioInput) {
          if (!hasShownErrorRef.current) {
            toast.error('No microphone found. Please connect a microphone to make calls.', {
              duration: 5000,
            });
            hasShownErrorRef.current = true;
          }
          throw new Error('No microphone found');
        }

        if (!audioOnly && !hasVideoInput) {
          toast.error('No camera found. Starting audio-only call instead.', {
            duration: 4000,
          });
          // Fallback to audio only if no camera
          audioOnly = true;
        }
      } catch (enumError) {
        console.warn('Could not enumerate devices:', enumError);
        // Continue anyway - browser might not support enumeration but still allow getUserMedia
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: !audioOnly,
      });
      localStreamRef.current = stream;
      setIsVideoEnabled(!audioOnly);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Provide specific error messages (skip if already shown)
      if (error.message === 'No microphone found') {
        // Already showed toast above during device enumeration
      } else if (!hasShownErrorRef.current) {
        // Only show error toast if we haven't shown one yet
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error('Permission denied. Please allow microphone/camera access in your browser settings.', {
            duration: 5000,
          });
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast.error('No microphone/camera found. Please connect a device and try again.', {
            duration: 6000,
            icon: '🎤',
          });
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          toast.error('Microphone/camera is already in use by another application.', {
            duration: 5000,
          });
        } else if (error.name === 'OverconstrainedError') {
          toast.error('Camera/microphone constraints could not be satisfied.', {
            duration: 5000,
          });
        } else {
          toast.error('Could not access microphone/camera. Please check your browser settings.', {
            duration: 5000,
          });
        }
        hasShownErrorRef.current = true;
      }
      throw error;
    }
  }, []);

  // Connect to a ticket to listen for incoming calls
  const connectToTicket = useCallback((ticketId) => {
    console.log('Connecting to ticket for incoming calls:', ticketId);
    setListeningTicketId(ticketId);
  }, []);

  // Disconnect from ticket
  const disconnectFromTicket = useCallback(() => {
    console.log('Disconnecting from ticket');
    setListeningTicketId(null);
  }, []);

  // Start a call
  const startCall = useCallback(async (ticketId, remoteUser, audioOnly = true) => {
    try {
      console.log('Starting call to ticket:', ticketId);
      setCallState('connecting');
      
      // Get user media
      await getUserMedia(audioOnly);
      
      // Set current call
      setCurrentCall({
        ticketId,
        isInitiator: true,
        remoteUser,
        callType: audioOnly ? 'audio' : 'video',
      });
      
      // Toast removed - will show when peer connects
    } catch (error) {
      console.error('Error starting call:', error);
      setCallState('idle');
      throw error;
    }
  }, [getUserMedia]);

  // Answer a call
  const answerCall = useCallback(async (ticketId, remoteUser, audioOnly = true) => {
    try {
      console.log('Answering call for ticket:', ticketId);
      setCallState('connecting');
      
      // Get user media
      await getUserMedia(audioOnly);
      
      // Set current call
      setCurrentCall({
        ticketId,
        isInitiator: false,
        remoteUser,
      });
      
      toast.success('Joining call...');
    } catch (error) {
      console.error('Error answering call:', error);
      setCallState('idle');
      throw error;
    }
  }, [getUserMedia]);

  // Accept incoming call
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !incomingOfferRef.current) {
      console.error('No incoming call to accept');
      return;
    }

    try {
      console.log('Accepting incoming call');
      const audioOnly = incomingCall.callType === 'audio';
      
      // Get user media
      await getUserMedia(audioOnly);
      
      // Set current call
      setCurrentCall({
        ticketId: incomingCall.ticketId,
        isInitiator: false,
        remoteUser: incomingCall.caller,
      });
      
      setCallState('connecting');
      
      // Process the stored offer
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      
      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendJsonMessage({
        type: 'answer',
        answer: answer,
      });
      
      // Clear incoming call state
      setIncomingCall(null);
      incomingOfferRef.current = null;
      
      toast.success(`Joined call with ${incomingCall.caller.name}`);
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallState('idle');
      setIncomingCall(null);
      incomingOfferRef.current = null;
      toast.error('Failed to accept call');
    }
  }, [incomingCall, getUserMedia, createPeerConnection, sendJsonMessage]);

  // Reject incoming call
  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) {
      return;
    }

    console.log('Rejecting incoming call');
    
    // Send rejection message
    sendJsonMessage({
      type: 'call-rejected',
      ticketId: incomingCall.ticketId,
    });
    
    // Clear incoming call state
    setIncomingCall(null);
    incomingOfferRef.current = null;
    
    toast('Call declined', { icon: '📞' });
  }, [incomingCall, sendJsonMessage]);

  // End call
  const endCall = useCallback(() => {
    console.log('Ending call');
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Reset state
    setCurrentCall(null);
    setCallState('idle');
    setIsMuted(false);
    setIsVideoEnabled(false);
    setRemoteStreamAvailable(false);
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    
    toast.success('Call ended');
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    
    if (videoTrack) {
      // Video track exists, just toggle it
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    } else {
      // No video track, need to add one
      try {
        console.log('Adding video track to stream...');
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);
        
        // Add track to peer connection
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.addTrack(
            newVideoTrack, 
            localStreamRef.current
          );
          console.log('Video track added to peer connection:', sender);
        }
        
        setIsVideoEnabled(true);
        toast.success('Video enabled');
      } catch (error) {
        console.error('Error adding video track:', error);
        toast.error('Could not enable video');
      }
    }
  }, []);

  // Handle signaling messages
  useEffect(() => {
    if (!lastJsonMessage) return;

    const handleSignaling = async () => {
      const message = lastJsonMessage;
      console.log('Received signaling message:', message.type);

      try {
        switch (message.type) {
          case 'connected':
            console.log('WebSocket connected, peerOnline:', message.peerOnline);
            // If peer is already online and we're initiator, create offer
            if (message.peerOnline && currentCall?.isInitiator) {
              const pc = createPeerConnection();
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendJsonMessage({
                type: 'offer',
                offer: offer,
              });
            }
            break;

          case 'peer-connected':
            console.log('Peer connected:', message.role);
            toast.success(`${message.userName} joined the call`);
            // If we're initiator, create and send offer
            if (currentCall?.isInitiator) {
              const pc = createPeerConnection();
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendJsonMessage({
                type: 'offer',
                offer: offer,
                callType: currentCall.callType || 'audio',
              });
            }
            break;

          case 'peer-disconnected':
            console.log('Peer disconnected');
            toast('Other party left the call', { icon: 'ℹ️' });
            endCall();
            break;

          case 'call-rejected':
            console.log('Call was rejected');
            toast.error('Call was declined');
            endCall();
            break;

          case 'offer':
            console.log('Received offer, current state:', peerConnectionRef.current?.signalingState);
            
            // If we haven't answered the call yet, show incoming call notification
            if (!currentCall) {
              console.log('Incoming call - showing notification');
              setIncomingCall({
                ticketId: message.ticketId,
                caller: {
                  id: message.callerId,
                  name: message.callerName,
                  role: message.callerRole,
                },
                callType: message.callType || 'audio',
              });
              // Store the offer to process after user accepts
              incomingOfferRef.current = message.offer;
              return; // Don't process offer yet
            }
            
            const pc = createPeerConnection();
            
            // Check if we can set remote description
            if (pc.signalingState === 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
              
              // Add pending candidates
              for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidatesRef.current = [];
              
              // Create and send answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendJsonMessage({
                type: 'answer',
                answer: answer,
              });
            } else {
              console.warn(`Cannot set remote offer in state: ${pc.signalingState}. Expected: stable`);
            }
            break;

          case 'answer':
            console.log('Received answer, current state:', peerConnectionRef.current?.signalingState);
            if (peerConnectionRef.current) {
              // Only set remote description if we're in the right state
              const signalingState = peerConnectionRef.current.signalingState;
              
              if (signalingState === 'have-local-offer') {
                await peerConnectionRef.current.setRemoteDescription(
                  new RTCSessionDescription(message.answer)
                );
                
                // Add pending candidates
                for (const candidate of pendingCandidatesRef.current) {
                  await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                }
                pendingCandidatesRef.current = [];
              } else {
                console.warn(`Cannot set remote answer in state: ${signalingState}. Expected: have-local-offer`);
                
              }
            } else {
              console.warn('Received answer but peer connection is null');
            }
            break;

          case 'ice-candidate':
            console.log('Received ICE candidate');
            if (message.candidate) {
              if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(message.candidate)
                );
              } else {
                // Store for later if remote description not set yet
                pendingCandidatesRef.current.push(message.candidate);
              }
            }
            break;

          case 'error':
            console.error('Signaling error:', message.message);
            toast.error(message.message);
            endCall();
            break;
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
        toast.error('Call connection error');
      }
    };

    handleSignaling();
  }, [lastJsonMessage, currentCall, createPeerConnection, sendJsonMessage, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const value = {
    currentCall,
    callState,
    isMuted,
    isVideoEnabled,
    remoteStreamAvailable,
    incomingCall,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    isConnected: readyState === ReadyState.OPEN,
    connectToTicket,
    disconnectFromTicket,
    startCall,
    answerCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleVideo,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
