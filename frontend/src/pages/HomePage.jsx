import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";
import ScreenShare from "../components/screenShare/ScreenShare.jsx";
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


const HomePage = () => {
  const navigate = useNavigate()
  const { selectedUser, videoCall } = useChatStore();
  const { streamMode, setStreamData, setStreamMode,startStreaming, setStartStreaming, setStreamYoutube, streamYoutube, endStream, streamStart, streamData, createStream } = useStreamStore();
  const { authUser, setVideoPeer } = useAuthStore();
  const [videoId, setVideoId] = useState("")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  // const [startStreaming, setStartStreaming] = useState(false)
  const [selectStream, setSelectStream] = useState(null)
  // const [startYoutubeStreaming, setStartYoutubeStreaming] = useState(false)
  const [url, seturl] = useState("");

  // Function to handle uploaded file path
  const handleUpload = (data) => {
    seturl(data.fileUrl);
    // setStreamData(data) 
    console.log("Uploaded PDF Path:", data.fileUrl);

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
    console.log("streamData", streamData)
    streamStart()
  }, [streamData])


  return (
    <div className="h-screen overflow-y-scroll bg-base-200">
      <div className="flex items-center gap-0.5 justify-center pt-20 px-4">
        <div className={`bg-base-100 rounded-l-lg shadow-lg ${streamMode ? "w-[35vw] h-[calc(100vh-6rem)]" : "max-w-7xl h-[calc(100vh-8rem)]"}`}>
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar /> 
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            {/* <ChatContainer /> */}
          </div>
        </div>
        <div className={`bg-base-100 rounded-r-lg shadow-lg overflow-y-scroll ${streamMode ? "w-[63vw] h-[calc(100vh-6rem)]" : "hidden"}`}>

     
 

 
            <div className="min-h-[70%]">
            
             
                    <Outlet/>

              



            </div>

 

        </div>
      </div>
    </div>
  );
};
export default HomePage;