import { useChatStore } from "../store/useChatStore";
import { useState, useEffect } from "react";
import ScreenShare from "../components/screenShare/ScreenShare.jsx";
import Sidebar from "../components/Sidebar";
import { Book, BookA, BotMessageSquare, BrainCircuit, Globe, MoveLeft, ScreenShareIcon, X, Youtube } from 'lucide-react';
import WebsiteViewer from "../components/streams/website/WebsiteStream.jsx";
import NoChatSelected from "../components/chat/NoChatSelected.jsx";
import ChatContainer from "../components/chat/ChatContainer";
import YouTubePlayer from "../components/streams/youtube/YouTubePlayer.jsx";
import PDFReader from "../components/streams/pdf/PdfReader";
import UploadPDF from "../components/streams/pdf/UploadFile";
import { useAuthStore } from "../store/useAuthStore";
import { useStreamStore } from '../store/useStreamStore';
import toast from "react-hot-toast";


const HomePage = () => {
  const { selectedUser, videoCall } = useChatStore();
  const { streamMode, setStreamData, setStreamMode,startStreaming, setStartStreaming, setStreamYoutube, streamYoutube, endStream, streamStart, streamData, createStream } = useStreamStore();
  const { authUser } = useAuthStore();
  const [videoId, setVideoId] = useState("")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  // const [startStreaming, setStartStreaming] = useState(false)
  const [selectStream, setSelectStream] = useState(null)
  // const [startYoutubeStreaming, setStartYoutubeStreaming] = useState(false)
  const [pdfUrl, setPdfUrl] = useState("");

  // Function to handle uploaded file path
  const handleUpload = (data) => {
    setPdfUrl(data.fileUrl);
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
      videoUrl: videoId,
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
    setPdfUrl(streamData?.streamInfo?.pdfUrl)
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

                  {startStreaming == 51 && <YouTubePlayer url={videoId} />}
          {(startStreaming != 51 && startStreaming != 0  ) ?

            selectStream == 1 ?
              <div className="h-full">
                <div className="w-full p-8 justify-end flex">
                  <button className=" btn" onClick={() => setStartStreaming(0)}><MoveLeft /> </button>
                </div>
                <div className={` ${streamData.length == 0 ? "" : ""}  p-4 space-y-4 flex flex-col mx-28  `}>
                  <div className="flex justify-between my-4 mx-1 items-center">

                    <h1 className="text-xl font-bold flex">Stream Seamlessly using <span className="ml-2 text-base-300 invert ">RapidStudy</span> <BotMessageSquare className="w-6 mr-2 ml-1 h-6 text-primary " />Streams</h1>

                  </div>
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

                    onClick={() => handleStartYoutubeStream()}
                    className="btn   btn-primary w-full"
                  >
                    Start Streaming
                  </button>
                </div>
              </div>
              :
              selectStream == 2 ?
                <div>

                  {streamData?.streamInfo?.type == "pdf" ?
                    
                    <div>

                      {/* <h1>{streamData[0]?.streamInfo?.title}</h1>
                    <h1>{streamData[0]?.streamInfo?.desc}</h1> */}
                      <div rel="noopener noreferrer" >
                        <div className="w-full  justify-end  flex">
                          <div className="w-full flex flex-col justify-center items-center ">

                            <h1 className="font-bold text-xl">{streamData?.streamInfo?.title}</h1>
                            {/* <h1>{streamData?.streamInfo?.description}</h1> */}
                          </div>

                          <button className="my-2 mr-8 btn" onClick={() => setStartStreaming(0)}><MoveLeft /> </button>
                        </div>
                        <PDFReader pdfUrl={pdfUrl} />
                      </div>
                    </div>
                    :<div>
                      <div className="w-full p-8 justify-end flex">
                        <button className=" btn" onClick={() => setStartStreaming(0)}><MoveLeft /> </button>
                      </div>
                      <UploadPDF onUpload={handleUpload} /> 
                    </div>
                    
                  }
                </div> :
                selectStream == 3 ? <>
                  <div className="w-full p-8 justify-end flex">
                    <button className=" btn" onClick={() => setStartStreaming(0)}><MoveLeft /> </button>
                  </div>
                  <WebsiteViewer /> 
                </>:
                selectStream == 4 && <>
                  <div className="w-full p-8 justify-end flex">
                    <button className=" btn" onClick={() => setStartStreaming(0)}><MoveLeft /> </button>
                  </div> 
                  <ScreenShare/>
                </>
            : !startStreaming &&
            <div className="min-h-[70%]">
              <div className="w-full px-8 mt-8 mb-[-6.5rem] justify-end flex">
                <button className=" btn" onClick={() => setStreamMode(false)}><X /> </button>
              </div>
              <div className="flex flex-col justify-around pt-8  h-full items-center ">

                <h1 className="text-xl font-semibold my-8 ">Select a source to stream</h1>
                <div className="flex flex-wrap justify-center py-6 items-center gap-11 ">
                  <button
                    onClick={() => {
                      if(streamData?.streamInfo?.type == "youtube"){
                        setVideoId(streamData.streamInfo.videoUrl)
                        setSelectStream(51)
                        setStartStreaming(51)
                      }
                      else {setSelectStream(1)  
                      setStartStreaming(1);}
                    }}
                    className={`${streamData?.streamInfo?.type == "youtube" ? "border-2 border-white ": ""} px-4 py-4 h-[30vh] flex-col justify-center items-center text-3xl w-[15vw] flex gap-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition`}
                  >
                    {streamData?.streamInfo?.type == "youtube"&& <div className="text-red-600 bg-white px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}

                    <Youtube className="size-[5rem]" />
                    
                    YouTube
                  </button> 
                  <button
                    onClick={() => { 
                      setStartStreaming(2);
                      setSelectStream(2)
                      
                    }}
                    className={`${streamData?.streamInfo?.type == "pdf" ? "border-2 border-white ": ""} px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[30vh] w-[15vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition`}
                    >
                    {streamData?.streamInfo?.type == "pdf"&& <div className="text-red-600 bg-white px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}
                    <Book className="size-[5rem]" /> PDF
                  </button>
                  <button
                    onClick={() => {
                      setSelectStream(3)
                      setStreamYoutube(false);
                      setStartStreaming(3);
                    }}
                    className="px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[30vh] w-[15vw] bg-green-500 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Globe className="size-[5rem]" /> Website
                  </button>
                  <button
                    onClick={() => {
                      setSelectStream(4)
                      setStreamYoutube(false);
                      setStartStreaming(4);
                    }}
                    className="px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[30vh] w-[15vw] bg-[#ededed] text-black rounded-lg hover:bg-gray-200 transition"
                  >
                    <ScreenShareIcon className="size-[5rem]" /> Screen share
                  </button>
                </div>
              </div>
            </div>


          }

        </div>
      </div>
    </div>
  );
};
export default HomePage;