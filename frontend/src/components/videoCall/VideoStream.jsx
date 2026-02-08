import Peer from 'peerjs';
import { BotMessageSquare, Copy, Phone, PhoneOff, Maximize } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useImperativeHandle } from 'react';
import { forwardRef } from 'react';
const VideoStream = forwardRef(({   setIncomingCall, incomingCall }, ref) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [Calling, setCalling] = useState(false)
  const audioRef = useRef(null);
  const audioRef2 = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentCallRef = useRef(null);
  const {selectedUser} = useChatStore()
  const { peer, peerId, getPeerId,onlineUsers, friendPeerId, removePeerId } = useAuthStore()
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
        setLocalId(peerId)

        setIsInitialized(true);

        // peer.on('open', (id) => {
        //   setLocalId(id);
        //   console.log("insider")
        // });

        // peer.on('call', handleIncomingCall);
        peer.on('connection', (conn) => {
          conn.on('data', (data) => {
            if (data === 'rejected') {
              if (audioRef.current) {
                audioRef.current.pause();          // ⏸ Pause music
                audioRef.current.currentTime = 0;  // ⏮ Reset to start
              }
                if (audioRef2.current) {
                audioRef2.current.muted = false;
                audioRef2.current.currentTime = 0;
                audioRef2.current.play().catch(() => {});
                setTimeout(() => {
                  if (audioRef2.current) {
                  audioRef2.current.pause();
                  audioRef2.current.currentTime = 0;
                  }
                }, 2000);
                }
              removePeerId()
              setNotification('Call was rejected');
              setConnecting(false);
              setCallActive(false)
            }
          });
        });


      } catch (error) {
        handleError('Failed to access camera/microphone', error);
      }
    };
    initializePeer();
    return () => {  
        localStreamRef?.current?.getTracks().forEach(track => track.stop());
       
    }
  }, []);

  // Show notification for 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const acceptCall = () => {
    // stopSound()
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
    // stopSound()
    if (incomingCall) {
      const callerId = incomingCall.peer; // The ID of the user who called you
      const conn = peerRef.current?.connect(callerId);
      conn.on('open', () => {
        conn.send('rejected');
        conn.close(); // Optional: close after sending
      });

    }
    setIncomingCall(null);
  };


  const setupCall = (call) => {
    currentCallRef.current = call;
    setConnecting(false);
    setCalling(true)

    call.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
          if (audioRef.current) {
                audioRef.current.pause();          // ⏸ Pause music
                audioRef.current.currentTime = 0;  // ⏮ Reset to start
              }if (audioRef2.current) {
                audioRef2.current.pause();          // ⏸ Pause music
                audioRef2.current.currentTime = 0;  // ⏮ Reset to start
              }
      }
      setCalling(false)
      setCallActive(true);
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
      try {
        setConnecting(true);

        // 1. Start media call
        const call = peerRef.current.call(remoteId, localStreamRef.current);
        setupCall(call); // ✅ Setup the media call immediately
        // 2. Open data connection to receive rejection (if any)
        const conn = peerRef.current.connect(remoteId);
        conn.on('data', (data) => {
          if (data === 'rejected') {
             if (audioRef.current) {
                audioRef.current.pause();          // ⏸ Pause music
                audioRef.current.currentTime = 0;  // ⏮ Reset to start
              }if (audioRef2.current) {
                audioRef2.current.pause();          // ⏸ Pause music
                audioRef2.current.currentTime = 0;  // ⏮ Reset to start
              }
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
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.volume = 1.0;
      audioRef.current.loop = true;      // 🔁 Enable looping
      audioRef.current.play();           // ▶️ Start playing
      audioRef.current.play().catch(err => console.error("Playback error:", err));
    }
    else {
    }
    removePeerId()
    getPeerId()
  };


  const endCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();          // ⏸ Pause music
      audioRef.current.currentTime = 0;  // ⏮ Reset to start
    }
    removePeerId()

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

 

  const getCallStatus = () => { 
    if (!onlineUsers.includes(selectedUser._id)) return 'User is offline';
    if (!isInitialized) return 'Initializing...';
    if (connecting) return 'Connecting...';
    if(Calling) return "Calling..."
    if (callActive) return 'Connected';
    
    return 'Ready to connect';
  };

  return (
    <div className="min-h-screen z-[10] bg-base-100  p-6">
      <audio ref={audioRef2} src={"/sound/unavailable.mp3"} preload="auto" />
      <audio ref={audioRef} src={"/sound/outgoing.mp3"} preload="auto" />
      <div className="max-w-6xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-base-100 text-white px-4 py-2 rounded shadow-lg z-50">
            {notification}
          </div>
        )}



        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold  mb-2">
            <BotMessageSquare className="inline w-8 h-8 mr-2" />
            Stream N Chat Calls
          </h1>
          <p className="text-gray-600">
            <span className="font-semibold">{getCallStatus()}</span>
          </p>
        </div>

        {/* Video Container */}
        <div
          ref={videoContainerRef}
          className="  rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex h-full w-full justify-center items-center gap-6">
            {/* Local Video */}
            <div className="relative w-full">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full   bg-gray-900 rounded-lg object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                You
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative w-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full lg:h-full bg-gray-900 rounded-lg object-cover"
              />
              {(!callActive  ) && (
                <div className="absolute inset-0 flex items-center justify-center  h-[200%] mt-[-4.8rem] bg-gray-800 bg-opacity-80 rounded-lg">
                  <div className="text-center  text-white">
                    <BotMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-60" />
                    <p className="text-lg font-medium">Waiting for connection</p>
                    <p className="text-sm opacity-80">Start calling with Rapid Calls</p>
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
        <div className=" rounded-lg  w-full shadow-lg p-6">


          {/* Action Buttons */}
          <div className="flex m-auto w-fit flex-wrap gap-3 mt-6">
           {!callActive && <button
              onClick={startCall}
              disabled={!isInitialized || callActive || connecting || !onlineUsers.includes(selectedUser._id)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {connecting ? 'Connecting...' : 'Start Call'}
            </button>}

            {callActive && <button
              onClick={endCall} 

              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>}

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