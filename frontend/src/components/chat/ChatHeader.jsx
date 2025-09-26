
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useStreamStore } from "../../store/useStreamStore";
import { formatMessageTime } from "../../lib/utils";
import AiTalk from "./AiTalk";
import { useNavigate } from "react-router-dom";
import { Image, TvMinimalPlay, Send, X, Video, Voicemail } from "lucide-react";
import { useState } from "react";
const ChatHeader = () => {
  const navigate = useNavigate()
  const {
    selectedUser, 
    videoCall,
    setSelectedUser,
    setVideoCall, 
    sendMessage, 
  } = useChatStore();
  const [aiTalk, setAiTalk] = useState(false)
  const { 
    streamMode, 
    setStreamMode,
    streamData,
    streamSet, 
    setStreamData,
    getStreamAiMessage
  } = useStreamStore();
  const { onlineUsers } = useAuthStore();
  
  const handleStream = () => {
    console.log(window.location.pathname)
    if(window.location.pathname.slice(0, 7) == "/stream" && streamMode){
      setStreamMode(false)
      navigate("/")
    }
    else {
      setStreamMode(true)
      navigate("/stream")
    }
  }
  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img loading="blur" src={selectedUser?.name ? selectedUser?.profilePic || "/group.png" : selectedUser?.profilePic || "/avatar.png"} alt={selectedUser?.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser?.fullName || selectedUser?.name}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
<div className="flex gap-5">

        <button className={`  btn btn-circle  ${videoCall ? "text-red-500" : "text-zinc-400"} `} onClick={() => setVideoCall(!videoCall)} >
          <Video />

        </button> 
        <button className={`  btn btn-circle  ${aiTalk ? "text-red-500" : "text-zinc-400"} `} onClick={() => setAiTalk(!aiTalk)} >
       <Voicemail/>
        </button>

       {aiTalk&&<AiTalk/>}
        {/* //video stream */}
     <button className={` streamIcon btn btn-circle  ${streamData.senderInfo != undefined ? "text-red-500" : "text-zinc-400"} `} onClick={handleStream} type="button"  >
          {streamData.senderInfo != undefined && <div className=" p-1  bg-base-content max-w-74 rounded-md  absolute z-[100] mt-[10rem] max-h-30 streamInfo text-base-200">
            <div className="p-2  ">

              <div className="flex gap-1 items-center justify-center flex-col w-full">

                <h1 className="text-base-50 font-bold text-xl">{streamData?.streamInfo?.title}</h1>
                <h1>{streamData?.streamInfo?.description}</h1>
              </div>
              <div className="flex gap-2 mt-1 items-center opacity-70  justify-center ">

                <h1>Created by  </h1>
                <img className="size-6 object-cover rounded-full" src={streamData?.senderInfo?.profilePic} alt="profile" />
                <h1> {streamData?.senderInfo?.fullName}</h1>
                <h1>
                  {"on " + new Date(streamData?.createdAt).toDateString() + " at " + formatMessageTime(new Date(streamData?.createdAt))}

                </h1>
              </div>

            </div>
          </div>}
          <TvMinimalPlay />
        </button> 
        {/* Close button */}
        <button className="mx-3 " onClick={() => { setSelectedUser(null); setStreamData([]) }}>
          <X />
        </button>
      </div>
      </div>
    </div>
  );
};
export default ChatHeader;