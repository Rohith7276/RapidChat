import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Assumptions:
 * - useAuthStore() exposes { socket, setVideoPeer }
 * - Signaling events used:
 *    client -> server: 'join-room' { emailId, roomId }
 *    server -> client: 'user-joined' { emailId }
 *    client -> server: 'call-user' { emailId, offer }
 *    server -> client: 'incomming-call' { from, offer }
 *    client -> server: 'call-accepted' { emailId, ans }
 *    server -> client: 'call-accepted' { ans }
 *    ICE: client <-> server: 'ice-candidate' { to, from, candidate }
 */

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
];

const VideoCall = () => {
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const { socket, setVideoPeer } = useAuthStore();

  const peerRef = useRef(null);

  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);

  const [emailId, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  // ---------- Init Peer ----------
  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = pc;
    setVideoPeer?.(pc);

    // ontrack -> render remote stream
    const handleTrack = (ev) => {
      if (remoteVideoRef.current && ev.streams && ev.streams[0]) {
        remoteVideoRef.current.srcObject = ev.streams[0];
      }
    };

    pc.addEventListener("track", handleTrack);

    // ICE candidate discovery -> send to remote via socket
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      if (!remoteEmailId) return;
      socket.emit("ice-candidate", {
        to: remoteEmailId,
        from: emailId || null,
        candidate: event.candidate,
      });
    };

    // Renegotiation
    const handleNegotiationNeeded = async () => {
      try {
        if (!remoteEmailId) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call-user", { emailId: remoteEmailId, offer });
      } catch (err) {
        console.error("negotiationneeded error:", err);
      }
    };
    pc.addEventListener("negotiationneeded", handleNegotiationNeeded);

    return () => {
      pc.removeEventListener("track", handleTrack);
      pc.removeEventListener("negotiationneeded", handleNegotiationNeeded);
      pc.onicecandidate = null;

      pc.getSenders().forEach((s) => {
        try {
          s.track && s.track.stop();
        } catch {}
      });
      pc.getReceivers().forEach((r) => {
        try {
          r.track && r.track.stop();
        } catch {}
      });
      pc.close();
      peerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Get Local Media ----------
  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    if (myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
      myVideoRef.current.muted = true;
    }
    setMyStream(stream);

    // Immediately add tracks to PeerConnection
    if (peerRef.current) {
      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });
    }
  }, []);

  useEffect(() => {
    getUserMediaStream().catch((e) => console.error("getUserMedia failed:", e));
  }, [getUserMediaStream]);

  // ---------- Helpers ----------
  const ensurePC = () => {
    if (!peerRef.current) throw new Error("Peer connection not ready");
    return peerRef.current;
  };

  const createOffer = useCallback(async () => {
    const pc = ensurePC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, []);

  const applyRemoteOfferAndCreateAnswer = useCallback(async (offer) => {
    const pc = ensurePC();
    if (!offer) throw new Error("No offer provided");
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    if (pc.signalingState !== "have-remote-offer") {
      console.warn("Unexpected signalingState:", pc.signalingState);
    }
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }, []);

  // ---------- Socket Handlers ----------
  const handleRoomJoin = useCallback(() => {
    if (!emailId || !roomId) {
      console.warn("Need emailId and roomId to join");
      return;
    }
    socket.emit("join-room", { emailId, roomId });
  }, [emailId, roomId, socket]);

  // New user enters room -> create and send offer
  const onUserJoined = useCallback(
    async ({ emailId: other }) => {
      try {
        setRemoteEmailId(other);
        const offer = await createOffer();
        socket.emit("call-user", { emailId: other, offer });
      } catch (err) {
        console.error("onUserJoined error:", err);
      }
    },
    [createOffer, socket]
  );

  // We receive an offer -> create answer
  const onIncomingCall = useCallback(
    async ({ from, offer }) => {
      try {
        setRemoteEmailId(from);
        const ans = await applyRemoteOfferAndCreateAnswer(offer);
        socket.emit("call-accepted", { emailId: from, ans });
      } catch (err) {
        console.error("onIncomingCall error:", err);
      }
    },
    [applyRemoteOfferAndCreateAnswer, socket]
  );

  // Our offer was accepted -> set remote description
  const onCallAccepted = useCallback(
    async ({ ans }) => {
      try {
        const pc = ensurePC();
        await pc.setRemoteDescription(new RTCSessionDescription(ans));
      } catch (err) {
        console.error("onCallAccepted error:", err);
      }
    },
    []
  );

  // ICE candidate from remote
  const onRemoteIceCandidate = useCallback(
    async ({ candidate }) => {
      try {
        if (!candidate) return;
        const pc = ensurePC();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("addIceCandidate failed:", err);
      }
    },
    []
  );

  // Register / cleanup socket listeners
  useEffect(() => {
    socket.on("user-joined", onUserJoined);
    socket.on("incomming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("ice-candidate", onRemoteIceCandidate);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("incomming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("ice-candidate", onRemoteIceCandidate);
    };
  }, [socket, onUserJoined, onIncomingCall, onCallAccepted, onRemoteIceCandidate]);

  return (
    <div className="flex justify-center items-center flex-col h-screen gap-3 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Your Email"
          value={emailId}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button onClick={handleRoomJoin} className="border px-3 py-1 rounded">
          Enter Room
        </button>
      </div>

      <h1 className="text-lg">
        Connected to: <span className="font-semibold">{remoteEmailId || "—"}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="flex flex-col items-center">
          <span className="mb-1">Me</span>
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black rounded"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="mb-1">Remote</span>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
