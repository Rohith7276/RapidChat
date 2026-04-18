
import { BotMessageSquare, Copy, Phone, PhoneOff, Maximize } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useImperativeHandle } from 'react';
import { axiosInstance } from '../../lib/axios';
import { forwardRef } from 'react';
const VideoStream = forwardRef(({ setIncomingCall, incomingCall }, ref) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [Calling, setCalling] = useState(false)
  const audioRef = useRef(null);
  const audioRef2 = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentCallRef = useRef(null);
  const peersRef = useRef({});
  const peerNamesRef = useRef({});
  const [peers, setPeers] = useState([]);
  const { selectedUser } = useChatStore()
  const { authUser, onlineUsers, socket } = useAuthStore()
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [captions, setCaptions] = useState("");
  const mediaRecorderRef = useRef(null);
  // New state for incoming call and notification 
  const audioChunksRef = useRef([]);
  const [notification, setNotification] = useState('');
  const currentRoomIdRef = useRef(null);

  const isGroupChat = Boolean(selectedUser?.name && !selectedUser?.fullName);

  const markConnected = useCallback(() => {
    setConnecting(false);
    setCalling(false);
    setCallActive(true);
  }, []);

  const getPeerDisplayName = useCallback((peerId, fallback = null) => {
    if (fallback) return fallback;
    if (peerNamesRef.current[peerId]) return peerNamesRef.current[peerId];
    return `User ${peerId?.slice?.(0, 6) || ''}`;
  }, []);

  const upsertPeerStream = useCallback((peerId, stream, displayName = null) => {
    if (displayName) {
      peerNamesRef.current[peerId] = displayName;
    }
    console.log("hm", displayName)

    setPeers((prev) => {
      const existingIndex = prev.findIndex((p) => p.peerId === peerId);
      const resolvedName = getPeerDisplayName(peerId, displayName);

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          stream,
          displayName: resolvedName,
        };
        return updated;
      }

      return [...prev, { peerId, stream, displayName: resolvedName }];
    });
  }, [getPeerDisplayName]);

  const getMediaErrorMessage = useCallback((error) => {
    if (!error) return 'Unable to access camera/microphone';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Camera/Microphone permission denied. Please allow access in browser site settings.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera or microphone found on this device.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Camera or microphone is already in use by another app.';
    }
    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      return 'Requested camera settings are not supported on this device.';
    }
    if (error.name === 'SecurityError') {
      return 'Browser blocked media devices due to security restrictions.';
    }

    return 'Unable to access camera/microphone. Please check permissions and device availability.';
  }, []);

  const addPeer = async (caller, stream, displayName = null) => {
    console.log("dekkk", displayName)
    
    // Store display name for later retrieval
    if (displayName) {
      peerNamesRef.current[caller] = displayName;
    }
    
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      markConnected();
      upsertPeerStream(caller, event.streams[0], displayName);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: caller,
          candidate: event.candidate
        });
      }
    };

    peersRef.current[caller] = peer;
  };

  useEffect(() => {
    const initializePeer = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          handleError('Media devices are not supported in this browser.');
          return;
        }

        let localStream;

        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
          });
        } catch (cameraError) {
          // Fallback to audio-only so calling still works when camera access fails.
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          setNotification('Camera unavailable. Joined call with audio only.');
        }

        // set local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        localStreamRef.current = localStream;


        if (localStream.getAudioTracks().length > 0) {
          const audioStream = new MediaStream(
            localStream.getAudioTracks()
          );

          let options = {};

          if (MediaRecorder.isTypeSupported("audio/webm")) {
            options.mimeType = "audio/webm";
          }

          const mediaRecorder = new MediaRecorder(audioStream, options);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          // send audio every 3 sec
          mediaRecorder.start(3000);
        }

        setIsInitialized(true);

        // handle rejection messages


      } catch (error) {
        console.error('getUserMedia failed:', error);
        handleError(getMediaErrorMessage(error));
      }
    };

    initializePeer();

    return () => {
      // cleanup media stream
      localStreamRef?.current?.getTracks().forEach(track => track.stop());

      // stop recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [getMediaErrorMessage]);


  useEffect(() => {


    const handleAllUsers = (users) => {
      users.forEach(user => {
        const userId = typeof user === 'string' ? user : user.socketId;
        const displayName = typeof user === 'string' ? null : user.displayName;
        if (userId === socket.id) return;
        if (peersRef.current[userId]) return;
        createPeer(userId, socket.id, localStreamRef.current, displayName);
      });
    };

    const handleUserJoined = ({ caller, displayName }) => {
      if (caller === socket.id) return;
      
      // If peer already exists (caller created it), update the display name
      if (peersRef.current[caller]) {
        peerNamesRef.current[caller] = displayName;
        setPeers(prev => {
          return prev.map(p => p.peerId === caller ? { ...p, displayName } : p);
        });
        return;
      }
      
      // Otherwise, create new peer (receiver joining group call)
      addPeer(caller, localStreamRef.current, displayName);
    };

    socket.on("all-users", handleAllUsers);
    socket.on("user-joined", handleUserJoined);

    return () => {
      socket.off("all-users", handleAllUsers);
      socket.off("user-joined", handleUserJoined);
    };

  }, [socket, upsertPeerStream]);



  const createPeer = (userToSignal, callerId, stream, displayName = null) => {
    // Store display name for later retrieval
    if (displayName) {
      peerNamesRef.current[userToSignal] = displayName;
    }
    
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });


    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: userToSignal,
          candidate: event.candidate
        });
      }
    };

    peer.ontrack = (event) => {
      markConnected();
      upsertPeerStream(userToSignal, event.streams[0], displayName);
    };  

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.emit("offer", {
        target: userToSignal,
        sdp: offer
      });
    });

    peersRef.current[userToSignal] = peer;
  };


  useEffect(() => {
    const handleOffer = async ({ sdp, caller }) => {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });

      peer.ontrack = (event) => {
        markConnected();
        const savedName = peerNamesRef.current[caller];
        upsertPeerStream(caller, event.streams[0], savedName);
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            target: caller,
            candidate: event.candidate
          });
        }
      };

      await peer.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer", {
        target: caller,
        sdp: answer
      });

      peersRef.current[caller] = peer;
    }
    const handleAnswer = ({ sdp, caller }) => {
      const peer = peersRef.current[caller];
      peer.setRemoteDescription(new RTCSessionDescription(sdp));
      setConnecting(false);
    }
    const handleIce = ({ from, candidate }) => {
      const peer = peersRef.current[from];
      if (peer) {
        peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIce);


    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIce);
    };

  }, [markConnected, upsertPeerStream]);


  const sendAudio = async () => {
    console.log("sending audio", audioChunksRef)
    if (!audioChunksRef.current.length) return;
    console.log("sending audio2")
    const blob = new Blob(audioChunksRef.current, {
      type: "audio/webm"
    });
    // audioChunksRef.current = []; // clear after sending

    const file = new File([blob], "audio.webm", {
      type: "audio/webm"
    });

    const formData = new FormData();

    // key must match backend
    formData.append("audio", file);



    try {
      const res = await axiosInstance.post(
        "/video-call/transcribe",
        formData
      );



      const data = await res.json();
      console.log("wtf", res)
      if (data.text) {
        setCaptions((prev) => {
          const updated = (prev + " " + data.text).trim();
          return updated.split(" ").slice(-50).join(" "); // limit memory
        });
      }
    } catch (err) {
      console.error("FULL ERROR:", err);
      console.error("SERVER RESPONSE:", err.response?.data);
    }
  };

  useEffect(() => {
    socket.on("user-left", (id) => {
      const peer = peersRef.current[id];
      if (peer) {
        peer.close();
        delete peersRef.current[id];
      }
      delete peerNamesRef.current[id];

      setPeers(prev => {
        const filtered = prev.filter(p => p.peerId !== id);
        if (filtered.length === 0 && currentRoomIdRef.current) {
          setCallActive(false);
          setConnecting(false);
          setCalling(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
        return filtered;
      });
    });

    return () => socket.off("user-left");
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
        } if (audioRef2.current) {
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




  const startCall = () => {
    if (!localStreamRef.current) return;

    setCalling(true);
    setConnecting(true); // 🔥 ADD THIS

    const roomId = Math.random().toString(36).substring(2, 8);
    currentRoomIdRef.current = roomId;
    // console.log("see this", authUser.fullName)
    socket.emit("join-room", {
      roomId,
      emailId:  authUser?.fullName||authUser?.email  || 'User'
    });

    if (isGroupChat) {
      const memberIds = Array.isArray(selectedUser?.members)
        ? selectedUser.members
        : Array.isArray(selectedUser?.users)
          ? selectedUser.users
          : Array.isArray(selectedUser?.memberIds)
            ? selectedUser.memberIds
            : [];
      const targetUserIds = memberIds
        .map((member) => (typeof member === 'string' ? member : member?._id))
        .filter((id) => id && id !== authUser?._id);

      if (targetUserIds.length === 0) {
        setConnecting(false);
        setCalling(false);
        setNotification('No group members available to invite');
        return;
      }

      socket.emit("call-group", {
        targetUserIds,
        roomId,
        groupId: selectedUser?._id,
        callerName: authUser?.fullName || authUser?.email || 'User',
      });
    } else {
      socket.emit("call-user", {
        targetUserId: selectedUser._id,
        roomId
      });
    }
  };


  const resetCallState = useCallback((message = 'Call ended') => {
    if (audioRef.current) {
      audioRef.current.pause();          // ⏸ Pause music
      audioRef.current.currentTime = 0;  // ⏮ Reset to start
    }

    if (audioRef2.current) {
      audioRef2.current.pause();
      audioRef2.current.currentTime = 0;
    }

    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }

    Object.values(peersRef.current).forEach((peer) => {
      try {
        peer.close();
      } catch (err) {
        console.error('Failed to close peer connection:', err);
      }
    });
    peersRef.current = {};
    peerNamesRef.current = {};
    setPeers([]);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (currentRoomIdRef.current) {
      socket.emit('leave-room', { roomId: currentRoomIdRef.current });
      currentRoomIdRef.current = null;
    }

    setCalling(false);
    setCallActive(false);
    setConnecting(false);
    setNotification(message);
    // audioChunksRef.current = []; // clear after sending
  }, [socket]);

  const endCall = () => {
    const activePeerIds = Object.keys(peersRef.current);
    activePeerIds.forEach((peerId) => {
      socket.emit('end-call', { target: peerId });
    });

    resetCallState('Call ended');
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



  const hasRemotePeer = peers.length > 0;
  const isInCallState = callActive || hasRemotePeer || connecting || Calling;

  const getCallStatus = () => {
    if (!onlineUsers.includes(selectedUser._id)) return 'User is offline';
    if (!isInitialized) return 'Initializing...';
    if (callActive || hasRemotePeer) return 'Connected';
    if (connecting) return 'Connecting...';
    if (Calling) return "Calling..."

    return 'Ready to connect';
  };

  const primaryRemotePeer = peers[0] || null;
  const otherPeers = peers.slice(1);
  const primaryRemoteName = primaryRemotePeer?.displayName || selectedUser?.fullName || selectedUser?.name || 'Remote User';

  useEffect(() => {
    if (!incomingCall?.roomId) return;
    currentRoomIdRef.current = incomingCall.roomId;
  }, [incomingCall]);

  useEffect(() => {
    if (!remoteVideoRef.current || !primaryRemotePeer?.stream) return;
    remoteVideoRef.current.srcObject = primaryRemotePeer.stream;
  }, [primaryRemotePeer]);

  useEffect(() => {
    const handleCallEnded = ({ from }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          peer.close();
        } catch (err) {
          console.error('Failed to close remote peer on call-ended:', err);
        }
        delete peersRef.current[from];
      }
      delete peerNamesRef.current[from];

      setPeers((prev) => prev.filter((p) => p.peerId !== from));

      const hasRemainingPeers = Object.keys(peersRef.current).length > 0;
      if (!hasRemainingPeers) {
        resetCallState('Remote user ended the call');
      }
    };

    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('call-ended', handleCallEnded);
    };
  }, [resetCallState, socket]);

  return (
    <div className="min-h-screen z-[10] bg-gradient-to-b from-base-200 to-base-100 p-6">
      <audio ref={audioRef2} src={"/sound/unavailable.mp3"} preload="auto" />
      <audio ref={audioRef} src={"/sound/outgoing.mp3"} preload="auto" />
      <div className="max-w-6xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-base-100 text-white px-4 py-2 rounded shadow-lg z-50">
            {notification}
          </div>
        )}


<div
          ref={videoContainerRef}
          className="rounded-2xl border border-base-300 bg-base-100 flex flex-col justify-center items-center p-6 shadow-xl mb-6"
        >
        {/* Header */}
        {/* <div className="mb-6 rounded-2xl border border-base-300/70 bg-base-100/90 p-4 text-center shadow-sm"> */}
          {/* <h1 className="text-3xl font-bold mb-2">
            <BotMessageSquare className="inline w-8 h-8 mr-2" />
            Rapid Chat Calls
          </h1> */}
          <p className="text-sm mt-2 w-full text-center">
            {(Calling || connecting) && <span className="text-yellow-500 animate-pulse">{getCallStatus()}</span>}
            {!Calling && !connecting && (callActive || hasRemotePeer) && <span className="text-green-500">{getCallStatus()}</span>}
            {!Calling && !connecting && !callActive && !hasRemotePeer && <span className="text-gray-400">{getCallStatus()}</span>}
          </p>
        {/* </div> */}

        {/* Video Container */}
        
          <p className="mb-3 text-sm font-medium text-base-content/70">{peers.length + 1} participants</p>
          
          {/* Unified Grid for all participants */}
          <div className={`grid gap-4 w-[80%] ${
            peers.length === 0 ? 'grid-cols-1' : 
            peers.length === 1 ? 'grid-cols-2' : 
            peers.length <= 3 ? 'grid-cols-2 lg:grid-cols-3' :
            'grid-cols-2 lg:grid-cols-4'
          }`}>
            {/* Local Video */}
            <div className="relative rounded-xl overflow-hidden border border-base-300 bg-black ring-1 ring-base-300/40 aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 text-xs bg-black/65 px-2 py-1 rounded-md">
                {authUser?.fullName || authUser?.email || 'You'}
              </span>
            </div>

            {/* Remote Peers Grid */}
            {primaryRemotePeer && (
              <div className="relative rounded-xl overflow-hidden border border-base-300 bg-black ring-1 ring-base-300/40 aspect-video">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs bg-black/65 px-2 py-1 rounded-md">
                  {primaryRemoteName}
                </span>
              </div>
            )}

            {otherPeers.map(peer => (
              <div key={peer.peerId} className="relative rounded-xl overflow-hidden border border-base-300 bg-black ring-1 ring-base-300/40 aspect-video">
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  ref={video => {
                    if (video) video.srcObject = peer.stream;
                  }}
                />
                <span className="absolute bottom-2 left-2 text-xs bg-black/65 px-2 py-1 rounded-md">
                  {peer.displayName}
                </span>
              </div>
            ))}

            {/* Placeholder when no peer connected */}
            {/* {peers.length === 0 && (
              <div className="relative rounded-xl overflow-hidden border border-base-300 bg-black/20 ring-1 ring-base-300/40 aspect-video flex items-center justify-center">
                <div className="text-sm text-base-200/60">Waiting for other person...</div>
              </div>
            )} */}
          </div>
        </div>

        {/* Controls */}
        <div className=" rounded-lg  w-full shadow-lg p-6">


          {/* Action Buttons */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 
  bg-black/70 backdrop-blur-md px-6 py-4 rounded-full shadow-xl flex items-center gap-6">

            {/* Start Call */}
            {!isInCallState && (
              <button
                onClick={startCall}
                disabled={!isInitialized || callActive || connecting || Calling}
                className="w-14 h-14 flex items-center justify-center rounded-full 
      bg-green-500 hover:bg-green-600 transition-all shadow-lg disabled:opacity-40"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            )}

            {/* End Call */}
            {isInCallState && (
              <button
                onClick={endCall}
                className="w-16 h-16 flex items-center justify-center rounded-full 
      bg-red-600 hover:bg-red-700 transition-all shadow-xl scale-110"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="w-12 h-12 flex items-center justify-center rounded-full 
    bg-gray-700 hover:bg-gray-800 transition"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>

            {/* Audio Send */}
            <button
              onClick={sendAudio}
              className="w-12 h-12 flex items-center justify-center rounded-full 
    bg-blue-600 hover:bg-blue-700 transition"
            >
              🎤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
})

export default VideoStream;