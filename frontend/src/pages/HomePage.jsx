import { useChatStore } from "../store/useChatStore";
import { useState, useEffect, useRef } from "react";
import ScreenShare from "../components/streams/screenShare/ScreenShare.jsx";
import Sidebar from "../components/Sidebar";
import { Book, BookA, BotMessageSquare, BrainCircuit, FlipHorizontal2, Globe, MoveLeft, ScreenShareIcon, X, Youtube } from 'lucide-react';
import WebsiteViewer from "../components/streams/website/WebsiteStream.jsx";
import NoChatSelected from "../components/chat/NoChatSelected.jsx";
import ChatContainer from "../components/chat/ChatContainer";
import YouTubePlayer from "../components/streams/youtube/YouTubePlayer.jsx";
import PDFReader from "../components/streams/pdf/PdfReader";
import UploadPDF from "../components/streams/pdf/UploadFile";
import { useAuthStore } from "../store/useAuthStore";
import { useStreamStore } from '../store/useStreamStore';
import toast from "react-hot-toast";
import { useNavigate, Outlet } from 'react-router-dom';
import Voice_txt from "../components/Voice_txt.jsx"


const HomePage = () => {
  const navigate = useNavigate()
  const { selectedUser, videoCall } = useChatStore();
  const { streamMode, setStreamData, setStreamMode,startStreaming, setStartStreaming, setStreamYoutube, streamYoutube, endStream,   streamData, createStream } = useStreamStore();
  const { authUser, setVideoPeer } = useAuthStore();
  const [videoId, setVideoId] = useState("")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [selectStream, setSelectStream] = useState(null)
  const [url, seturl] = useState("");
  const [leftPanelWidth, setLeftPanelWidth] = useState(35); // 35vw
  const isResizing = useRef(false);

  // Function to handle uploaded file path
  const handleUpload = (data) => {
    seturl(data.fileUrl);
    // setStreamData(data) 

  };
  const handleStartYoutubeStream = () => {
     if (!videoId) {
        toast.error("No videoId provided");
        setLoading(false)
        return;
      }
    const streamDatas = {
      url: videoId,
      title,
      description: desc,
      groupId: selectedUser._id,
      recieverId: selectedUser._id, 
      type: "youtube"
    } 
    endStream()
    createStream(streamDatas)
    setStartStreaming(51)
    // setStartYoutubeStreaming(true)
  }
  useEffect(() => {
    seturl(streamData?.streamInfo?.url) 
  }, [streamData])

  const handleMouseDown = () => {
    isResizing.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;

      const container = document.querySelector('.resize-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Set minimum and maximum widths (20% to 70%)
      if (newWidth >= 20 && newWidth <= 70) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  return (
    <div className="h-screen bg-base-200 flex flex-col">
      <div className="pt-20 px-4 flex-1 overflow-hidden">
        {!streamMode ? (
          // Non-stream mode: Full width chat
          <div className="flex h-full gap-0.5 justify-center">
            <div className="bg-base-100 rounded-lg shadow-lg max-w-7xl h-full w-full">
              <div className="flex h-full rounded-lg overflow-hidden">
                <Sidebar /> 
                {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
              </div>
            </div>
          </div>
        ) : (
          // Stream mode: Resizable two-panel layout
          <div className="resize-container flex gap-0 h-full w-full">
            {/* Left Panel - Chat */}
            <div 
              className="bg-base-100 rounded-l-lg shadow-lg h-[calc(100vh-6rem)] overflow-hidden"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="flex h-full overflow-hidden">
                <Sidebar /> 
                {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
              </div>
            </div>

            {/* Resizer */}
            <div
              onMouseDown={handleMouseDown}
              className="w-1 bg-base-300 hover:bg-primary cursor-col-resize transition-colors flex-shrink-0"
              style={{ userSelect: 'none' }}
            />

            {/* Right Panel - Stream */}
            <div 
              className="bg-base-100 rounded-r-lg shadow-lg h-[calc(100vh-6rem)] overflow-y-scroll"
              style={{ width: `calc(${100 - leftPanelWidth}% - 4px)` }}
            >
              <Outlet />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default HomePage;