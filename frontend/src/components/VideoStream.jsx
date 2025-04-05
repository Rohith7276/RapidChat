import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const VideoStream = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localId, setLocalId] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [status, setStatus] = useState('Waiting to connect...');
  const [statusColor, setStatusColor] = useState('#fcf8e3');
  const [callActive, setCallActive] = useState(false);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const currentCallRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Get local video stream
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = localStream;
        localStreamRef.current = localStream;

        // Create peer
        const peer = new Peer();
        peerRef.current = peer;

        // On peer open
        peer.on('open', (id) => {
          setLocalId(id);
          setStatus('Ready to connect');
          setStatusColor('#dff0d8');
        });

        // Handle incoming calls
        peer.on('call', (call) => {
          setStatus('Incoming call...');
          setStatusColor('#fcf8e3');
 
            call.answer(localStreamRef.current);
            handleCall(call); 
        });

        // Handle errors
        peer.on('error', (err) => {
          console.error('PeerJS error:', err);
          setStatus(`Error: ${err.type}`);
          setStatusColor('#f2dede');
        });
      } catch (err) {
        console.error('Failed to get local stream', err);
        setStatus('Error accessing camera/microphone');
        setStatusColor('#f2dede');
      }
    };

    init();

    return () => {
      // Cleanup resources on component unmount
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCall = (call) => {
    currentCallRef.current = call;
    setCallActive(true);

    setStatus('Connected');
    setStatusColor('#dff0d8');

    // Handle stream from remote peer
    call.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
    });

    // Handle call end
    call.on('close', endCall);
    call.on('error', (err) => {
      console.error('Call error:', err);
      endCall();
    });
  };

  const endCall = () => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }

    remoteVideoRef.current.srcObject = null;
    setCallActive(false);

    setStatus('Call ended');
    setStatusColor('#fcf8e3');
  };

  const startCall = () => {
    if (!remoteId.trim()) {
      alert('Please enter a remote peer ID');
      return;
    }

    setStatus('Connecting...');
    setStatusColor('#fcf8e3');

    const call = peerRef.current.call(remoteId, localStreamRef.current);
    handleCall(call);
  };

  const copyIdToClipboard = () => {
    if (localId) {
      navigator.clipboard.writeText(localId)
        .then(() => {
          alert('ID copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy ID', err);
        });
    }
  };

  return (
    <div className="container">
      <h1>Simple Video Calling App</h1>

      <div
        className="status"
        style={{ backgroundColor: statusColor, padding: '10px', borderRadius: '4px', textAlign: 'center' }}
      >
        {status}
      </div>

      <div className="video-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="video-item" style={{ margin: '10px', position: 'relative' }}>
          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: '8px' }} />
          <div className="user-label" style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>
            You
          </div>
        </div>
        <div className="video-item" style={{ margin: '10px', position: 'relative' }}>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px' }} />
          <div className="user-label" style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>
            Remote User
          </div>
        </div>
      </div>

      <div>
        <p>Your ID: <span>{localId}</span></p>
        <button onClick={copyIdToClipboard} style={{ margin: '10px', padding: '12px 24px', borderRadius: '50px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>
          Copy ID
        </button>
      </div>

      <div>
        <input
          type="text"
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
          placeholder="Enter remote user ID"
          style={{ padding: '12px', margin: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', width: '300px' }}
        />
        <button
          onClick={startCall}
          disabled={callActive}
          style={{ margin: '10px', padding: '12px 24px', borderRadius: '50px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Start Call
        </button>
        <button
          onClick={endCall}
          disabled={!callActive}
          style={{ margin: '10px', padding: '12px 24px', borderRadius: '50px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoStream;
