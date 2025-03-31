import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { BotMessageSquare, BrainCircuit } from 'lucide-react';

import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
// import YouTubePlayer from "../components/youtubePlayer";
import PDFReader from "../components/PdfReader";
import UploadPDF from "../components/UploadFile";
import { useAuthStore } from "../store/useAuthStore";


const HomePage = () => {
  const { selectedUser, streamMode, setStreamData,  endStream, streamStart,  streamData, createStream } = useChatStore();
  const { authUser } = useAuthStore();
  const [videoId, setVideoId] = useState("")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [startStreaming, setStartStreaming] = useState(false)

  const [pdfUrl, setPdfUrl] = useState("");

  // Function to handle uploaded file path
  const handleUpload = (data) => {
    setPdfUrl(data.fileUrl);
    // setStreamData(data) 
    console.log("Uploaded PDF Path:", data.fileUrl);

  };
  const handleStartStream = () => {
    const streamDatas = {
      videoUrl: videoId,
      title,
      description: desc,
      groupId: selectedUser._id,
      receiverId: selectedUser._id
    }
    createStream(streamDatas)
  }
  useEffect(() => { 
    setPdfUrl(streamData?.streamInfo?.pdfUrl)  
    console.log("streamData", streamData)
    streamStart()
  }, [streamData])
 

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center gap-0.5 justify-center pt-20 px-4">
        <div className={`bg-base-100 rounded-l-lg shadow-lg ${streamMode ? "w-[35vw] h-[calc(100vh-6rem)]" : "max-w-7xl h-[calc(100vh-8rem)]"}`}>
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
        <div className={`bg-base-100 rounded-r-lg shadow-lg ${streamMode ? "w-[63vw] h-[calc(100vh-6rem)]" : "hidden"}`}>
          <div className={` ${startStreaming ? "hidden" : "hidden"} p-4 space-y-4 `}>
            <h1 className="text-xl font-bold flex">Stream Seamlessly using <span className="ml-2 text-base-300 invert ">RapidChat</span> <BotMessageSquare className="w-6 mr-2 ml-1 h-6 text-primary " />Streams</h1>
            <input
              type="text"
              placeholder="Enter the URL of the video"
              onChange={(e) => setVideoId(e.target.value)}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Enter the title of the video"
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Enter the description of the video"
              onChange={(e) => setDesc(e.target.value)}
              className="input input-bordered w-full"
            />
            <button

              onClick={() => handleStartStream()}
              className="btn btn-primary w-full"
            >
              Start Streaming
            </button>
          </div>
          {/* {startStreaming && <YouTubePlayer videoId={videoId} />} */}
          {true && <div>

            {streamData.length == 0 ? <UploadPDF onUpload={handleUpload} />
              :
              <div>
                {streamData.senderInfo.fullName == authUser.fullName && <button
                  className="btn btn-primary w-fit m-auto"
                  onClick={() => {
                    setStartStreaming(false)
                    setStreamData([])
                    endStream()
                  }}
                >End Stream</button>}
                <h1>{streamData[0]?.streamInfo?.title}</h1>
                <h1>{streamData[0]?.streamInfo?.desc}</h1>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">

                  <PDFReader pdfUrl={pdfUrl} />
                </a>
              </div>
            }
          </div>
          }
        </div>
      </div>
    </div>
  );
};
export default HomePage;