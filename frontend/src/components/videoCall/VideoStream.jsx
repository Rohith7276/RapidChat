
import { BotMessageSquare, Copy, Phone, PhoneOff, Maximize } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useEffect, useRef, useState } from 'react';
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
  const [peers, setPeers] = useState([]);
  const { selectedUser } = useChatStore()
  const { peerId, onlineUsers, socket, removePeerId } = useAuthStore()
  const [localId, setLocalId] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [captions, setCaptions] = useState("");
  const mediaRecorderRef = useRef(null);
  // New state for incoming call and notification 
  const audioChunksRef = useRef([]);
  const [notification, setNotification] = useState('');

  const addPeer = async (caller, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      setPeers(prev => {
        if (prev.find(p => p.peerId === caller)) return prev;
        return [...prev, { peerId: caller, stream: event.streams[0] }];
      });
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
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });

        // set local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        localStreamRef.current = localStream;


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
          console.log("DATA EVENT", event.data.size);

          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        // send audio every 3 sec
        mediaRecorder.start(3000);

        console.log("Recorder state:", mediaRecorder.state);

        setLocalId(peerId);
        setIsInitialized(true);

        // handle rejection messages


      } catch (error) {
        handleError('Failed to access camera/microphone', error);
        console.log(error)
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
  }, []);


  useEffect(() => {


    socket.on("all-users", (users) => {
      users.forEach(userId => {
        createPeer(userId, socket.id, localStreamRef.current);
      });
    });

    socket.on("user-joined", ({ caller }) => {
      addPeer(caller, localStreamRef.current);
    });

  }, []);



  const createPeer = (userToSignal, callerId, stream) => {
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
      setPeers(prev => {
        if (prev.find(p => p.peerId === userToSignal)) return prev;
        return [...prev, { peerId: userToSignal, stream: event.streams[0] }];
      });
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
        setPeers(prev => {
          if (prev.find(p => p.peerId === caller)) return prev;
          return [...prev, { peerId: caller, stream: event.streams[0] }];
        });
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

  }, []);


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

      setPeers(prev => prev.filter(p => p.peerId !== id));
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

    socket.emit("join-room", {
      roomId,
      userName: "Rohith"
    });

    socket.emit("call-user", {
      targetUserId: selectedUser._id,
      roomId
    });
  };


  const endCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();          // ⏸ Pause music
      audioRef.current.currentTime = 0;  // ⏮ Reset to start
    }

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
    // audioChunksRef.current = []; // clear after sending
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
    if (Calling) return "Calling..."
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
            Rapid Chat Calls
          </h1>
          <p className="text-sm mt-2">
            {Calling && <span className="text-yellow-500 animate-pulse">Calling...</span>}
            {connecting && <span className="text-blue-500 animate-pulse">Connecting...</span>}
            {callActive && <span className="text-green-500">Live</span>}
            {!callActive && !Calling && !connecting && <span className="text-gray-400">Idle</span>}
          </p>
        </div>

        {/* Video Container */}
        <div
          ref={videoContainerRef}
          className="  rounded-lg shadow-lg p-6 mb-6"
        >
          <p>{peers.length + 1} participants</p>
          <div className="flex h-full w-full justify-center items-center gap-6">
            {/* Local Video */}
            <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border border-white">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Remote Video */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {peers.map(peer => (
                <div key={peer.peerId} className="relative">
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-48 bg-black rounded-lg object-cover"
                    ref={video => {
                      if (video) video.srcObject = peer.stream;
                    }}
                  />
                  <span className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                    User
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className=" rounded-lg  w-full shadow-lg p-6">


          {/* Action Buttons */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 
  bg-black/70 backdrop-blur-md px-6 py-4 rounded-full shadow-xl flex items-center gap-6">

            {/* Start Call */}
            {!callActive && (
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
            {callActive && (
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