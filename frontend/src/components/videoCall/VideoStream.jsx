import Peer from 'peerjs';
import { BotMessageSquare, Copy, Phone, PhoneOff, Maximize } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useImperativeHandle } from 'react';
import { forwardRef } from 'react';
const VideoStream = forwardRef(({ setIncomingCall, incomingCall }, ref) => {
  const [remoteStreamReceived, setRemoteStreamReceived] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentCallRef = useRef(null);
  const { peer, peerId, getPeerId, friendPeerId } = useAuthStore()
  const [localId, setLocalId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // New state for incoming call and notification  
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const initializePeer = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        localStreamRef.current = localStream;

        peerRef.current = peer;
        console.log(peer)
        setLocalId(peerId)

        setIsInitialized(true);

        // peer.on('open', (id) => {
        //   setLocalId(id);
        //   console.log("insider")
        // });

        peer.on('call', handleIncomingCall);
        peer.on('connection', (conn) => {
          conn.on('data', (data) => {
            if (data === 'rejected') {
              setNotification('Call was rejected');
              setConnecting(false);
              setCallActive(false)
            }
          });
        });

        peer.on('error', (error) => {
          handleError(`Connection error: ${error.type}`);
        });

      } catch (error) {
        handleError('Failed to access camera/microphone');
      }
    };

    initializePeer();
    return () => {
      cleanup();
    };
  }, []);

  // Show notification for 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleIncomingCall = (call) => {
    setIncomingCall(call);
    setNotification('Incoming call...');
  };
  const acceptCall = () => {
    if (!incomingCall || !localStreamRef.current) return;
    incomingCall.answer(localStreamRef.current);
    setupCall(incomingCall);
    setIncomingCall(null);
    setNotification('Call accepted');
  };
  useImperativeHandle(ref, () => ({
    acceptCall,
    rejectCall
  }));
  const rejectCall = () => {
    if (incomingCall) {
      const callerId = incomingCall.peer; // The ID of the user who called you
      const conn = peerRef.current.connect(callerId);
      conn.on('open', () => {
        conn.send('rejected');
        conn.close(); // Optional: close after sending
      });

    }
    setIncomingCall(null);
  };


  const setupCall = (call) => {
    currentCallRef.current = call;
    setCallActive(true);
    setConnecting(false);


    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    call.on('close', () => {
      endCall();
    });
    call.on('error', () => {
      endCall();
    });
  };
  useEffect(() => {
    setRemoteId(friendPeerId)

  }, [friendPeerId])
  useEffect(() => {
    const call = () => {
      console.log("use effect calling ", remoteId)
      // if (!remoteId.trim()) {
      //   handleError('Please enter a remote peer ID');
      //   return;
      // }
      // if (!peerRef.current || !localStreamRef.current) {
      //   handleError('Connection not ready');
      //   return;
      // }
      try {
        setConnecting(true);

        // 1. Start media call
        const call = peerRef.current.call(remoteId, localStreamRef.current);
        setupCall(call); // ✅ Setup the media call immediately

        // 2. Open data connection to receive rejection (if any)
        const conn = peerRef.current.connect(remoteId);
        conn.on('data', (data) => {
          if (data === 'rejected') {
            setNotification('Call was rejected');
            call.close(); // Close media call
            setConnecting(false);
            setCallActive(false);
          }
        });

      } catch {
        handleError('Failed to start call');
        setConnecting(false);
      }
    }
    if (remoteId) call()
  }, [remoteId])


  const startCall = () => {
    setRemoteId(null)
    getPeerId()
  };


  const endCall = () => {
    setRemoteId(null)

    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setCallActive(false);
    setConnecting(false);
    setNotification('Call ended');
  };

  const copyIdToClipboard = async () => {
    if (!localId) return;
    try {
      await navigator.clipboard.writeText(localId);
      setNotification('ID copied to clipboard');
    } catch {
      handleError('Failed to copy ID');
    }
  };

  const handleFullscreen = () => {
    const element = videoContainerRef.current;
    if (!element) return;
    const requestFullscreen = element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen;
    if (requestFullscreen) {
      requestFullscreen.call(element);
    }
  };

  const handleError = (message) => {
    setNotification(message);
    alert(message);
  };

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const getCallStatus = () => {
    if (!isInitialized) return 'Initializing...';
    if (connecting) return 'Connecting...';
    if (callActive) return 'Connected';
    return 'Ready to connect';
  };

  return (
    <div className="min-h-screen   p-6">
      <div className="max-w-6xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50">
            {notification}
          </div>
        )}



        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold  mb-2">
            <BotMessageSquare className="inline w-8 h-8 mr-2" />
            RapidStudy Calls
          </h1>
          <p className="text-gray-600">
            Status: <span className="font-semibold">{getCallStatus()}</span>
          </p>
        </div>

        {/* Video Container */}
        <div
          ref={videoContainerRef}
          className="  rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Local Video */}
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 lg:h-80 bg-gray-900 rounded-lg object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                You
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 lg:h-80 bg-gray-900 rounded-lg object-cover"
              />
              {!callActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80 rounded-lg">
                  <div className="text-center text-white">
                    <BotMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-60" />
                    <p className="text-lg font-medium">Waiting for connection</p>
                    <p className="text-sm opacity-80">Enter a peer ID to start calling</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                Remote User
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className=" rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Your ID Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localId}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  placeholder="Generating ID..."
                />
                <button
                  onClick={copyIdToClipboard}
                  disabled={!localId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>

            {/* Remote ID Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remote User ID
              </label>
              <input
                type="text"
                value={remoteId}
                // onChange={(e) => setRemoteId(e.target.value)}
                placeholder="Enter remote user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={startCall}
              // disabled={!isInitialized || callActive || connecting || !remoteId.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {connecting ? 'Connecting...' : 'Start Call'}
            </button>

            <button
              onClick={endCall}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>

            <button
              onClick={handleFullscreen}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
            >
              <Maximize className="w-4 h-4" />
              Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
})

export default VideoStream;