
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useStreamStore } from "../../store/useStreamStore";
import { formatMessageTime } from "../../lib/utils";
import AiTalk from "./AiTalk";
import ProfilePopUp from "./ProfilePopUp"
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
    streamLoading,
    setStreamData,
    getStreamAiMessage
  } = useStreamStore();
  const { onlineUsers } = useAuthStore();

  const handleStream = () => { 
    if (streamLoading) {
      return;
    }

    if (window.location.pathname.slice(0, 7) == "/stream" && streamMode) {
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

        <ProfilePopUp selectedUser={selectedUser} onlineUsers={onlineUsers} />
        <div className="flex gap-5">

          <button className={`  btn btn-circle  ${videoCall ? "text-red-500" : "text-zinc-400"} `} onClick={() => setVideoCall(!videoCall)} >
            <Video />

          </button>
          <button className={`  btn btn-circle  ${aiTalk ? "text-red-500" : "text-zinc-400"} `} onClick={() => setAiTalk(!aiTalk)} >
            <Voicemail />
          </button>

          {aiTalk && <AiTalk />}
          {/* //video stream */}
          <button
            className={`streamIcon btn btn-circle ${streamLoading ? "cursor-not-allowed opacity-70" : ""} ${streamData?.senderInfo != undefined ? "text-red-500" : "text-zinc-400"} `}
            onClick={handleStream}
            type="button"
            disabled={streamLoading}
            aria-busy={streamLoading}
          >
            {console.log("streamData in header: ", streamData)}
            {streamLoading ? (
              <svg aria-hidden="true" className="w-5 h-5 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
            ) : (
              <TvMinimalPlay />
            )}

            {streamData?.senderInfo != undefined && (
              <div className="p-1 bg-base-content max-w-74 rounded-md absolute z-[100] mt-[10rem] max-h-30 streamInfo text-base-200">
                <div className="p-2">
                  <div className="flex gap-1 items-center justify-center flex-col w-full">
                    <h1 className="text-base-50 font-bold text-xl">{streamData?.streamInfo?.title}</h1>
                    <h1>{streamData?.streamInfo?.description}</h1>
                  </div>
                  <div className="flex gap-2 mt-1 items-center opacity-70 justify-center">
                    <h1>Created by</h1>
                    <img className="size-6 object-cover rounded-full" src={streamData?.senderInfo?.profilePic || "/avatar.png"} alt="profile" />
                    <h1>{streamData?.senderInfo?.fullName}</h1>
                    <h1>{"on " + new Date(streamData?.createdAt).toDateString() + " at " + formatMessageTime(new Date(streamData?.createdAt))}</h1>
                  </div>
                </div>
              </div>
            )}
          </button>
          <button className="mx-3 " onClick={() => { setSelectedUser(null); }}>
            <X />
          </button>
        </div>
      </div>
     
    </div>
  );
};
export default ChatHeader;