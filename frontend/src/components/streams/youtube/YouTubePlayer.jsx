import React, { useEffect, useRef, useState, useMemo } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useStreamStore } from "../../../store/useStreamStore";
import { axiosInstance } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import { extractYouTubeId } from "../../../lib/utils";
import {
  MoveLeft,
  PictureInPicture,
  PictureInPicture2Icon,
  VideoOff,
  Radio,
  Square,
  LogOut,
  RefreshCw,
  FileDown,
  Sparkles,
  Palette,
  Type
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const YouTubePlayer = () => {
  const navigate = useNavigate();
  const {
    setPdfScroll,
    pdfScrollTop,
    endStream,
    streamData,
  } = useStreamStore();

  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  const playerRef = useRef(null);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const [isFloating, setIsFloating] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [playerReady, setPlayerReady] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Notes customization state
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("#111111");
  const [bg, setBg] = useState("#f4edd2");
  const [textSize, setTextSize] = useState(16);

  // Determine active video ID
  const rawVideoParam = streamData?.streamInfo?.url || "";
  const videoId = useMemo(() => extractYouTubeId(rawVideoParam), [rawVideoParam]);

  // Determine if current user is streamer
  const isStreamer = useMemo(() => {
    if (!authUser || !streamData) return false;
    const authId = String(authUser._id || "");
    const streamerId = String(
      typeof streamData.streamerId === "object"
        ? streamData.streamerId?._id
        : streamData.streamerId || ""
    );
    const authName = authUser.fullName || "";
    const senderName = streamData.senderInfo?.fullName || "";

    return Boolean(
      (authId && streamerId && authId === streamerId) ||
      (authName && senderName && authName === senderName)
    );
  }, [authUser, streamData]);

  // Floating window dragging handlers
  const handleMouseDown = (e) => {
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Sync seek position if pdfScrollTop changes (timestamp clicked in chat or AI)
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.seekTo === "function" && pdfScrollTop > 0) {
      playerRef.current.seekTo(pdfScrollTop, true);
    }
  }, [pdfScrollTop]);

  // Load custom note styles
  useEffect(() => {
    setBg(localStorage.getItem("rapid_stream_bg") || "#f4edd2");
    setColor(localStorage.getItem("rapid_stream_color") || "#111111");
    setTextSize(Number(localStorage.getItem("rapid_stream_size")) || 16);
  }, []);

  const containerWrapperRef = useRef(null);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    const initPlayer = () => {
      if (destroyed || !window.YT || !window.YT.Player) return;

      // If player already exists and is functional, simply load the new video without rebuilding iframe
      if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
        try {
          playerRef.current.loadVideoById(videoId);
          setPlayerReady(true);
          return;
        } catch (e) {
          console.warn("Could not loadVideoById, recreating player", e);
        }
      }

      // Ensure player mounting element exists inside wrapper
      let playerContainer = document.getElementById("youtube-player-container");
      if (!playerContainer && containerWrapperRef.current) {
        playerContainer = document.createElement("div");
        playerContainer.id = "youtube-player-container";
        playerContainer.className = "w-full h-full";
        containerWrapperRef.current.appendChild(playerContainer);
      }
      if (!playerContainer) return;

      try {
        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
          playerRef.current = null;
        }

        playerRef.current = new window.YT.Player("youtube-player-container", {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: () => {
              if (!destroyed) setPlayerReady(true);
            },
            onStateChange: (event) => {
              if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                const time = playerRef.current.getCurrentTime();
                setPdfScroll(time);
              }
            },
          },
        });
      } catch (err) {
        console.error("Error creating YouTube player:", err);
      }
    };

    if (!window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      destroyed = true;
      delete window.onYouTubeIframeAPIReady;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (e) {
          // ignore
        }
      }
    };
  }, [videoId]);

  // End Stream Handler (Host)
  const handleEndStream = async () => {
    setIsEnding(true);
    try {
      await endStream();
      navigate("/stream");
    } catch (err) {
      console.error("Failed to end stream:", err);
      toast.error("Could not end stream properly");
    } finally {
      setIsEnding(false);
    }
  };

  // Viewer Sync Handler
  const handleSyncWithStreamer = async () => {
    if (!selectedUser?._id || !streamData?._id) return;
    setIsSyncing(true);
    try {
      await axiosInstance.get(
        `/stream/stream-control/${selectedUser._id}/999999/${streamData._id}`
      );
      toast.success("Requested timestamp sync with streamer");
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Streamer may be offline or unresponsive");
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Notes as PDF
  const handleSaveNotes = () => {
    if (!notes.trim()) {
      toast.error("Please write some notes first before exporting.");
      return;
    }

    try {
      const pdf = new jsPDF();
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const maxLineWidth = pageWidth - 2 * margin;

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(streamData?.streamInfo?.title || "RapidChat Stream Notes", margin, margin + 5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Streamed by ${streamData?.senderInfo?.fullName || "Host"} | Exported on ${new Date().toLocaleDateString()}`,
        margin,
        margin + 12
      );

      pdf.line(margin, margin + 16, pageWidth - margin, margin + 16);

      // Body text
      pdf.setTextColor(20);
      pdf.setFontSize(textSize > 24 ? 14 : Math.max(10, textSize));
      const splitLines = pdf.splitTextToSize(notes, maxLineWidth);

      let yPos = margin + 25;
      const lineHeight = 7;

      splitLines.forEach((line) => {
        if (yPos + lineHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin + 10;
        }
        pdf.text(line, margin, yPos);
        yPos += lineHeight;
      });

      const fileName = (streamData?.streamInfo?.title || "stream_notes").replace(/\s+/g, "_") + ".pdf";
      pdf.save(fileName);
      toast.success("Notes downloaded as PDF!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  // If stream is ended or invalid
  const isStreamActive = Boolean(
    streamData &&
    streamData._id &&
    streamData.streamInfo &&
    !streamData.stopTime
  );
  if (!isStreamActive) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-4 rounded-full bg-base-300 text-base-content/60">
          <VideoOff className="size-12" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold">This Stream Has Ended</h2>
          <p className="text-sm opacity-70">
            The host has ended the session, or there is currently no active stream running in this conversation.
          </p>
        </div>

        {notes.trim().length > 0 && (
          <div className="p-4 bg-base-200 rounded-xl border border-base-300 max-w-md w-full space-y-2">
            <p className="text-xs font-semibold">You wrote notes during this session:</p>
            <button onClick={handleSaveNotes} className="btn btn-sm btn-outline w-full gap-2">
              <FileDown className="size-4" /> Download Notes Before Leaving
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => navigate("/stream")} className="btn btn-primary gap-2">
            <Radio className="size-4" /> Go to Streams
          </button>
          <button onClick={() => navigate("/")} className="btn btn-ghost gap-2">
            Return to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 sm:p-6 flex flex-col select-none space-y-4">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-base-300 gap-2">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link to="/stream" className="btn btn-ghost btn-circle btn-sm shrink-0" title="Back to Streams">
            <MoveLeft className="size-4" />
          </Link>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base truncate">
                {streamData?.streamInfo?.title || "YouTube Live Stream"}
              </h2>
              <span className="badge badge-error badge-sm gap-1 text-white shrink-0 animate-pulse">
                <span className="size-1.5 rounded-full bg-white inline-block"></span> LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs opacity-70 mt-0.5">
              <span>Streamed by</span>
              <img
                src={streamData?.senderInfo?.profilePic || "/avatar.png"}
                alt="profile"
                className="size-4 rounded-full object-cover"
              />
              <span className="font-medium">{streamData?.senderInfo?.fullName || "Host"}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFloating(!isFloating)}
            className={`btn btn-sm btn-circle ${isFloating ? "btn-accent" : "btn-ghost"}`}
            title={isFloating ? "Dock video" : "Float video (Picture in Picture)"}
          >
            {isFloating ? <PictureInPicture2Icon className="size-4" /> : <PictureInPicture className="size-4" />}
          </button>

          {isStreamer ? (
            <button
              onClick={handleEndStream}
              disabled={isEnding}
              className="btn btn-error btn-sm text-white gap-1.5 shadow-sm"
              title="End the stream for all participants"
            >
              <Square className="size-3.5 fill-current" />
              <span className="hidden sm:inline">{isEnding ? "Ending..." : "End Stream"}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate("/stream")}
              className="btn btn-ghost btn-sm gap-1.5"
              title="Leave stream without ending it for others"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Box */}
      <div className="flex flex-col items-center justify-center">
        <div
          ref={dragRef}
          className={`transition-all rounded-2xl overflow-hidden bg-black shadow-2xl relative ${
            isFloating ? "!fixed z-[9999]" : "w-full max-w-4xl aspect-video"
          }`}
          style={{
            ...(isFloating
              ? {
                  width: "480px",
                  height: "270px",
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  cursor: "grab",
                }
              : {}),
          }}
          onMouseDown={isFloating ? handleMouseDown : null}
        >
          {/* YouTube Player mounting point inside stable wrapper */}
          <div ref={containerWrapperRef} className="w-full h-full">
            <div id="youtube-player-container" className="w-full h-full" />
          </div>

          {/* Loading overlay while player attaches */}
          {!playerReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10 gap-2">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs opacity-70">Synchronizing YouTube Player...</p>
            </div>
          )}
        </div>

        {/* Video Control Bar */}
        <div className="flex flex-wrap items-center justify-between w-full max-w-4xl mt-3 px-2 gap-2 text-xs sm:text-sm">
          {!isStreamer && (
            <button
              onClick={handleSyncWithStreamer}
              disabled={isSyncing}
              className="btn btn-outline btn-xs sm:btn-sm gap-1.5"
              title="Sync video timestamp with streamer"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Sync with Host</span>
            </button>
          )}

          {isStreamer && (
            <div className="text-xs text-success font-medium flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success animate-ping"></span>
              You are hosting this live stream
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs opacity-60">
              {isFloating ? "Draggable PiP active" : "Syncing live with chat"}
            </span>
          </div>
        </div>
      </div>

      {/* Collaborative / Study Notes Area */}
      <div className="w-full max-w-4xl mx-auto mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="font-semibold text-sm">Session Notes</span>
            <span className="text-xs opacity-50 hidden sm:inline">(Saved to your session)</span>
          </div>

          {/* Formatting Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title="Note background color">
              <Palette className="size-3.5 opacity-60" />
              <input
                type="color"
                value={bg}
                onChange={(e) => {
                  setBg(e.target.value);
                  localStorage.setItem("rapid_stream_bg", e.target.value);
                }}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-1" title="Note text color">
              <Type className="size-3.5 opacity-60" />
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  localStorage.setItem("rapid_stream_color", e.target.value);
                }}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
            </div>

            <input
              type="number"
              min={12}
              max={32}
              value={textSize}
              onChange={(e) => {
                const val = Number(e.target.value) || 16;
                setTextSize(val);
                localStorage.setItem("rapid_stream_size", val);
              }}
              title="Font Size"
              className="input input-xs input-bordered w-14 text-center font-mono"
            />
          </div>
        </div>

        <textarea
          id="notesArea"
          name="notes"
          style={{
            backgroundColor: bg,
            color: color,
            fontSize: `${textSize}px`,
            lineHeight: "1.4",
          }}
          placeholder="Jot down notes, timestamps, or key takeaways while watching together..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl p-4 select-text min-h-[140px] shadow-inner focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={!notes.trim()}
            className="btn btn-sm btn-outline gap-2 disabled:opacity-50"
          >
            <FileDown className="size-4" />
            Export Notes as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
