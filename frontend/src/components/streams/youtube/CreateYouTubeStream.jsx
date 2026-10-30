import React, { useState } from 'react';
import { useChatStore } from '../../../store/useChatStore';
import { useStreamStore } from '../../../store/useStreamStore';
import { extractYouTubeId } from '../../../lib/utils';
import toast from "react-hot-toast";
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../../Loader';
import {
  MoveLeft,
  Youtube,
  Play,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

const CreateYouTubeStream = () => {
  const navigate = useNavigate();
  const { selectedUser } = useChatStore();
  const { setStartStreaming, endStream, streamData, createStream } = useStreamStore();

  const [videoId, setVideoId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const isGroup = Boolean(selectedUser && selectedUser.name !== undefined && selectedUser.fullName === undefined);
  const recipientName = isGroup ? selectedUser?.name : (selectedUser?.fullName || null);
  const recipientPic = selectedUser?.profilePic || "/avatar.png";

  const extractedId = extractYouTubeId(videoId);
  const isValidVideo = Boolean(extractedId);

  const handleStartYoutubeStream = async () => {
    if (!selectedUser) {
      toast.error("Please select a friend or group from the sidebar before streaming.");
      return;
    }
    if (!isValidVideo) {
      toast.error("Please enter a valid YouTube video link or ID.");
      return;
    }

    setLoading(true);
    const streamPayload = {
      url: extractedId ? `https://www.youtube.com/watch?v=${extractedId}` : (videoId.trim().startsWith("http") ? videoId.trim() : `https://${videoId.trim()}`),
      title: title.trim() || "YouTube Live Stream",
      description: desc.trim() || "",
      groupId: isGroup ? selectedUser._id : null,
      recieverId: !isGroup ? selectedUser._id : null,
      type: "youtube"
    };

    try {
      if (streamData && !streamData.stopTime) {
        try {
          await endStream();
        } catch (e) {
          console.warn("Cleaned up previous stream:", e);
        }
      }
      await createStream(streamPayload);
      setStartStreaming(true);
      navigate("/stream/youtube-player");
    } catch (err) {
      console.error("Stream start error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoVideo = () => {
    setVideoId("https://www.youtube.com/watch?v=jfKfPfyJRdk");
    if (!title) setTitle("Lofi Hip Hop Study Stream");
    if (!desc) setDesc("Relaxing beats to study and chat together.");
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
            <Youtube className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Create YouTube Stream</h1>
            <p className="text-sm opacity-70">Watch and study YouTube videos synchronously with friends</p>
          </div>
        </div>
        <Link className="btn btn-ghost btn-circle" to="/stream" title="Back to Streams">
          <MoveLeft className="size-5" />
        </Link>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <Loader data={["Starting YouTube stream...", "Connecting synchronized room...", "Preparing player..."]} />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto w-full mt-6 space-y-6">
          {/* Target Audience / Selected Chat */}
          {!selectedUser ? (
            <div className="alert alert-warning shadow-md flex items-start gap-3">
              <AlertCircle className="size-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-sm">No Active Conversation Selected</h3>
                <p className="text-xs mt-1">
                  You need to pick a friend or a group from the chat sidebar before starting a stream so they can join you.
                </p>
              </div>
              <button onClick={() => navigate("/")} className="btn btn-sm btn-outline">
                <MessageSquare className="size-4 mr-1" /> Open Chats
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200 border border-base-300">
              <div className="flex items-center gap-3">
                <img
                  src={recipientPic}
                  alt={recipientName}
                  className="size-10 rounded-full object-cover border border-base-content/10"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-base">{recipientName}</span>
                    <span className="badge badge-sm badge-primary">
                      {isGroup ? "Group Stream" : "1-on-1 Stream"}
                    </span>
                  </div>
                  <p className="text-xs opacity-60">This stream will sync automatically in this conversation</p>
                </div>
              </div>
              <Users className="size-5 opacity-40 mr-2" />
            </div>
          )}

          {/* Form Card */}
          <div className="card bg-base-200/50 border border-base-300 p-5 sm:p-6 space-y-5 rounded-2xl shadow-sm">
            {/* Video Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Youtube className="size-4 text-red-500" /> YouTube Video URL or ID
                </label>
                <button
                  type="button"
                  onClick={handleUseDemoVideo}
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="size-3" /> Try demo video
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Paste URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  className={`input input-bordered w-full pr-10 ${
                    videoId && isValidVideo
                      ? "input-success"
                      : videoId && !isValidVideo
                      ? "input-error"
                      : ""
                  }`}
                />
                {videoId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidVideo ? (
                      <CheckCircle2 className="size-5 text-success" />
                    ) : (
                      <AlertCircle className="size-5 text-error" />
                    )}
                  </div>
                )}
              </div>

              {videoId && !isValidVideo && (
                <p className="text-xs text-error flex items-center gap-1">
                  <Info className="size-3.5" /> Please enter a valid YouTube video link or 11-character video ID.
                </p>
              )}
            </div>

            {/* Thumbnail Preview Card */}
            {isValidVideo && (
              <div className="p-3 bg-base-300/60 rounded-xl flex flex-col sm:flex-row gap-4 items-center border border-base-300">
                <div className="relative w-full sm:w-44 aspect-video rounded-lg overflow-hidden bg-black shrink-0 shadow-inner">
                  <img
                    src={`https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play className="size-8 text-white drop-shadow-md opacity-80" />
                  </div>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="badge badge-success badge-sm gap-1">
                    <CheckCircle2 className="size-3" /> Ready to Stream
                  </div>
                  <h4 className="font-semibold text-sm">YouTube ID: {extractedId}</h4>
                  <p className="text-xs opacity-70">
                    Participants will join synchronously when the stream goes live.
                  </p>
                </div>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Stream Title (Optional)</label>
              <input
                type="text"
                placeholder="Give your stream a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description or Notes (Optional)</label>
              <textarea
                placeholder="What is this stream about? (Shown to participants)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="textarea textarea-bordered w-full"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleStartYoutubeStream}
              disabled={loading || !isValidVideo || !selectedUser}
              className="btn btn-primary w-full gap-2 text-base font-semibold shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              <Play className="size-5 fill-current" />
              {loading ? "Starting Stream..." : "Start Streaming Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateYouTubeStream;
