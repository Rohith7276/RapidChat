import React from 'react'
import { useChatStore } from '../../../store/useChatStore';
import { useState } from "react"; 
import { Book, BookA, BotMessageSquare, BrainCircuit, Globe, MoveLeft, ScreenShareIcon, X, Youtube } from 'lucide-react';
import { useStreamStore } from '../../../store/useStreamStore';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from "react-hot-toast";
import { useNavigate, Link } from 'react-router-dom';
const CreateYouTubeStream = () => {
    const navigate = useNavigate()
      const { selectedUser  } = useChatStore();
  const { setStartStreaming,  endStream, streamData, createStream } = useStreamStore(); 
  const [videoId, setVideoId] = useState("")
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
 
  const handleStartYoutubeStream = () => {
     if (!videoId) {
        toast.error("No videoId provided");
        setLoading(false)
        return;
      }
    const streamData = {
      url: videoId,
      title,
      description: desc,
      groupId: selectedUser._id,
      recieverId: selectedUser._id, 
      type: "youtube"
    } 
    endStream()
    createStream(streamData).then(res=>{
        navigate("/stream/youtube-player")
    }) 
    setStartStreaming(51) 
  }
 

  return (
    <div>
       <div className="h-full">
                <div className="w-full p-8 justify-end flex">
                  <Link className=" btn" to='/stream'><MoveLeft /> </Link>
                </div>
                <div className={` ${streamData.length == 0 ? "" : ""}  p-4 space-y-4 flex flex-col mx-28  `}>
                  <div className="flex justify-between my-4 mx-1 items-center">

                    <h1 className="text-xl font-bold flex">Stream Seamlessly using <span className="ml-2 text-base-300 invert ">Stream N Chat</span> <BotMessageSquare className="w-6 mr-2 ml-1 h-6 text-primary " />Streams</h1>

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
    </div>
  )
}

export default CreateYouTubeStream
