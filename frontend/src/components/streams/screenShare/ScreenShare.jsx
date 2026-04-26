import React, { useState, useRef, useEffect } from 'react';
import { Monitor, MonitorOff, Users, Wifi, WifiOff, AlertCircle, Fullscreen, MicOff, PhoneOff, MoveLeft } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useChatStore } from '../../../store/useChatStore';
import Loader from '../../Loader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
const ScreenShare = () => {
  const { socket, onlineUsers, authUser } = useAuthStore();
  const { selectedUser } = useChatStore();
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const localStreamRef = useRef(null);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const createOffer = async (targetId) => {
    try {
      const pc = peerConnectionsRef.current.get(targetId) || peerConnectionRef.current;
      if (!pc) {
        throw new Error('Peer connection not ready');
      }

      const existingTrackIds = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (!existingTrackIds.has(track.id)) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('offer', {
        offer,
        to: targetId
      });
    } catch (err) {
      setError('Failed to create offer: ' + err.message);
    }
  };

  useEffect(() => {
    if (!socket || !socket.id) {
      setError('Socket or user ID not provided');
      return;
    }

    const isGroupShare = Boolean(selectedUser?.name);

    const getTargetUserIds = () => {
      if (isGroupShare) {
        return (selectedUser?.membersInfo || [])
          .map((member) => member._id)
          .filter((memberId) => memberId && memberId !== authUser?._id);
      }

      return selectedUser?._id ? [selectedUser._id] : [];
    };

    const createPeerConnection = (targetId) => {
      const existingConnection = peerConnectionsRef.current.get(targetId);
      if (existingConnection) {
        return existingConnection;
      }

      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: targetId
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

      peerConnectionsRef.current.set(targetId, pc);
      return pc;
    };

    const flushPendingCandidates = async (targetId, pc) => {
      const pendingCandidates = pendingIceCandidatesRef.current.get(targetId);
      if (!pendingCandidates?.length) return;

      for (const candidate of pendingCandidates) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error('Failed to flush ICE candidate:', err);
        }
      }

      pendingIceCandidatesRef.current.delete(targetId);
    };

    // Initialize peer connection
    peerConnectionRef.current = createPeerConnection(selectedUser?._id || socket.id);

    // Socket event listeners
    const handleOffer = async (data) => {
      try {
        const fromId = data.from;
        const pc = createPeerConnection(fromId);
        await pc.setRemoteDescription(data.offer);
        await flushPendingCandidates(fromId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', {
          answer,
          to: fromId
        });
      } catch (err) {
        setError('Failed to handle offer: ' + err.message);
      }
    };

    const handleAnswer = async (data) => {
      try {
        const pc = peerConnectionsRef.current.get(data.from) || peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(data.answer);
          await flushPendingCandidates(data.from, pc);
        }
      } catch (err) {
        setError('Failed to handle answer: ' + err.message);
      }
    };

    const handleIceCandidate = async (data) => {
      try {
        const pc = peerConnectionsRef.current.get(data.from) || peerConnectionRef.current;
        if (pc) {
          if (!pc.remoteDescription) {
            const queuedCandidates = pendingIceCandidatesRef.current.get(data.from) || [];
            queuedCandidates.push(data.candidate);
            pendingIceCandidatesRef.current.set(data.from, queuedCandidates);
            return;
          }

          await pc.addIceCandidate(data.candidate);
        }
      } catch (err) {
        setError('Failed to add ICE candidate: ' + err.message);
      }
    };

    const handleScreenShareEnded = ({ from }) => {
      const pc = peerConnectionsRef.current.get(from);

      if (pc) {
        try {
          pc.close();
        } catch (error) {
          console.log('Error closing peer connection:', error);
        }
        peerConnectionsRef.current.delete(from);
      }

      pendingIceCandidatesRef.current.delete(from);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setIsReceiving(false);
      setConnectionStatus('disconnected');
      toast('Screen share ended');
    };

    const handleScreenShareRequest = async (data) => {
      socket.emit('screen-share-response', {
        accepted: true,
        to: data.from
      });
      // if (window.confirm(`${data.from} wants to share their screen. Accept?`)) {
      // } else {
      //   socket.emit('screen-share-response', {
      //     accepted: false,
      //     to: data.from
      //   });
      // }
    };

    const handleScreenShareResponse = async (data) => {
      if (data.accepted) {
        await createOffer(data.from);
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
    socket.on('screen-share-ended', handleScreenShareEnded);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('screen-share-request', handleScreenShareRequest);
      socket.off('screen-share-response', handleScreenShareResponse);
      socket.off('screen-share-ended', handleScreenShareEnded);

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingIceCandidatesRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, socket.id, selectedUser, authUser]);

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
      const targetUserIds = getTargetUserIds();

      if (targetUserIds.length > 0) {
        socket.emit('screen-share-request', {
          from: socket.id,
          toUserIds: targetUserIds,
          groupId: selectedUser?.name ? selectedUser._id : null
        });
      } else {
        // If no target specified, create offer immediately
        await createOffer(socket.id);
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
    const targetUserIds = getTargetUserIds();

    if (socket?.connected && targetUserIds.length > 0) {
      socket.emit('screen-share-ended', {
        toUserIds: targetUserIds,
        groupId: selectedUser?.name ? selectedUser._id : null
      });
    }

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
    toast.success('Screen sharing stopped'); 
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

  const getTargetUserIds = () => {
    if (selectedUser?.name) {
      return (selectedUser?.membersInfo || [])
        .map((member) => member._id)
        .filter((memberId) => memberId && memberId !== authUser?._id);
    }

    return selectedUser?._id ? [selectedUser._id] : [];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-base-100 rounded-lg text-content  ">
      <div className="mb-6">
        <div className="text-2xl font-bold   justify-between flex items-center gap-2">
          <h2 className='flex gap-3 items-center'>

          <Users className="w-fit h-6" />
          P2P Screen Share
          </h2>
          <div className="w-fit p-8 justify-end flex">
            <Link className="btn" to='/stream'><MoveLeft /> </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm  ">
          <span>User ID: <code className=" bg-base-content text-base-100 px-2 py-1 rounded">{socket?.id}</code></span>
          {selectedUser && (
            <span>
              Target: <code className="px-2 py-1 rounded">{selectedUser?.name || selectedUser?.fullName || selectedUser?._id}</code>
            </span>
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

      <div className=" ">
        {/* Local Screen Share */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {/* <h3 className="text-lg font-semibold text-gray-700">Your Screen</h3> */}
            <button
              onClick={isSharing ? stopSharing : startSharing}
              disabled={!socket || !socket.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isSharing
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

          {/* <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
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
          </div> */}
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
                Stop receiving
              </button>
            )}
          </div>

          <div className="relative bg-base-300  rounded-lg overflow-hidden aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            {!isReceiving ? (
              <div className="absolute inset-0 flex  items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Waiting for remote screen share...</p>
                </div>
              </div>
            ) :
              <div className='absolute mt-[-2.3rem] right-[2rem] flex gap-3 '>

                <MonitorOff className=" w-5 text-red-500" />
                <MicOff className='w-5' />

                <Fullscreen />
              </div>
            }
          </div>
        </div>
      </div>


    </div>
  );
};

export default ScreenShare;