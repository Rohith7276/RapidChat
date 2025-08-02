import React, { useState, useRef, useEffect } from 'react';
import { Monitor, MonitorOff, Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import Loader from '../Loader';

const ScreenShare = ( ) => {
  const [loading, setLoading] = useState(true)
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const {socket} = useAuthStore()
  const {selectedUserSocketId} = useChatStore()
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!socket || !socket.id) {
      setError('Socket or user ID not provided');
      return;
    }

    // Initialize peer connection
    const initPeerConnection = () => {
      const pc = new RTCPeerConnection(rtcConfig);
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: selectedUserSocketId
          });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsReceiving(true);
          setConnectionStatus('connected');
        }
      };

      pc.onconnectionstatechange = () => {
        setConnectionStatus(pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Connection failed or disconnected');
          setIsReceiving(false);
        }
      };

      return pc;
    };

    peerConnectionRef.current = initPeerConnection();

    // Socket event listeners
    const handleOffer = async (data) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(data.offer);
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        socket.emit('answer', {
          answer: answer,
          to: data.from
        });
      } catch (err) {
        setError('Failed to handle offer: ' + err.message);
      }
    };

    const handleAnswer = async (data) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(data.answer);
      } catch (err) {
        setError('Failed to handle answer: ' + err.message);
      }
    };

    const handleIceCandidate = async (data) => {
      try {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      } catch (err) {
        setError('Failed to add ICE candidate: ' + err.message);
      }
    };

    const handleScreenShareRequest = async (data) => {
      console.log("screen request")
      if (window.confirm(`${data.from} wants to share their screen. Accept?`)) {
        socket.emit('screen-share-response', {
          accepted: true,
          to: data.from
        });
      } else {
        socket.emit('screen-share-response', {
          accepted: false,
          to: data.from
        });
      }
    };

    const handleScreenShareResponse = async (data) => {
      if (data.accepted) {
        await createOffer();
      } else {
        setError('Screen share request was declined');
        stopSharing();
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('screen-share-request', handleScreenShareRequest);
    socket.on('screen-share-response', handleScreenShareResponse);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
    socket.off('ice-candidate', handleIceCandidate);
      socket.off('screen-share-request', handleScreenShareRequest);
      socket.off('screen-share-response', handleScreenShareResponse);
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, socket.id, selectedUserSocketId]);

  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('offer', {
        offer: offer,
        to: selectedUserSocketId
      });
    } catch (err) {
      setError('Failed to create offer: ' + err.message);
    }
  };

  const startSharing = async () => {
    try {
      setError('');
      
      // Get screen share stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      localStreamRef.current = stream;
      
      // Display local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle screen share end
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      setIsSharing(true);

      // Send screen share request
      if (selectedUserSocketId) {
        socket.emit('screen-share-request', {
          from: socket.id,
          to: selectedUserSocketId
        });
      } else {
        // If no target specified, create offer immediately
        await createOffer();
      }

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing permission denied');
      } else if (err.name === 'NotSupportedError') {
        setError('Screen sharing not supported in this browser');
      } else {
        setError('Failed to start screen sharing: ' + err.message);
      }
    }
  };

  const stopSharing = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Create new peer connection for next session
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = new RTCPeerConnection(rtcConfig);
    }

    setIsSharing(false);
    setConnectionStatus('disconnected');
    setError('');
  };

  const stopReceiving = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsReceiving(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    return connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  return (
    loading? <Loader data={["Please wait","Rapid Chat is preparing to share screen" ]} />:
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Users className="w-6 h-6" />
          P2P Screen Share
        </h2>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>User ID: <code className="bg-gray-100 px-2 py-1 rounded">{socket.id}</code></span>
          {selectedUserSocketId && (
            <span>Target: <code className="bg-gray-100 px-2 py-1 rounded">{selectedUserSocketId}</code></span>
          )}
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Screen Share */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Your Screen</h3>
            <button
              onClick={isSharing ? stopSharing : startSharing}
              disabled={!socket || !socket.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isSharing
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
              }`}
            >
              {isSharing ? (
                <>
                  <MonitorOff className="w-4 h-4" />
                  Stop Sharing
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  Start Sharing
                </>
              )}
            </button>
          </div>
          
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            {!isSharing && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Click "Start Sharing" to share your screen</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remote Screen Share */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Remote Screen</h3>
            {isReceiving && (
              <button
                onClick={stopReceiving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                <MonitorOff className="w-4 h-4" />
                Stop Viewing
              </button>
            )}
          </div>
          
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            {!isReceiving && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Waiting for remote screen share...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">How to use:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click "Start Sharing" to share your screen with the target user</li>
          <li>• The remote user will receive a request to view your screen</li>
          <li>• Remote screens will appear automatically when someone shares with you</li>
          <li>• All connections are peer-to-peer through WebRTC</li>
        </ul>
      </div>
    </div>
  );
};

export default ScreenShare;