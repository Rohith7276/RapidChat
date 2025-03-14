import { useChatStore } from "../store/useChatStore";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrainCircuit } from 'lucide-react';
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { X } from "lucide-react";
const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    subscribeToGroup,
    isUserMessageLoading,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const containerRef = useRef(null);
  const messageEndRef = useRef(null);
  const [flashDot, setFlashDot] = useState("");
  const [imageViewSrc, setImageViewSrc] = useState("") 
  useEffect(() => {
    getMessages(selectedUser, 1);

    if (selectedUser.name === undefined) subscribeToMessages();
    else subscribeToGroup();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);
 

  useEffect(() => {
    if (isUserMessageLoading) {
      const interval = setInterval(() => {
        setFlashDot((prev) => (prev.length === 3 ? "" : prev + "."));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isUserMessageLoading]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView();
  }, [messages]);

  const handleImageView = (e) => {
    const img = e.target.src;
    setImageViewSrc(img)
  }
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  } 
  


  return (
    <div className="flex-1 flex flex-col  overflow-auto">
      <ChatHeader />
      {imageViewSrc !== "" && <div className=" ">
        <div className="absolute w-screen  h-[100vh] inset-0 bg-black bg-opacity-50 flex justify-center items-center" >
          <img loading="blur"src={imageViewSrc} alt="attachment" className="z-20 max-w-[90%] max-h-[90%] object-contain" />
          <button  className=" bg-[#ffffff14] hover:cursor-pointer hover:bg-black rounded-full p-[4px] z-20 -mt-[74vh] -ml-[2vw]" onClick={() => setImageViewSrc("")}>
            <X />
          </button>
        </div>
      </div>}
      <div className="flex-1  overflow-y-auto p-4 space-y-4"
        ref={containerRef}  >
        {messages.map((message, index) => (
          <div
            ref={messageEndRef}
            key={message._id}
            className={`chat ${message.senderId === authUser._id && !message?.senderInfo?.ai ? "chat-end" : "chat-start"}`}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img loading="blur"
                  src={
                    message.senderInfo !== undefined ? message.senderInfo.profilePic || "/avatar.png" : message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs flex opacity-50 ml-1">
                {message.senderId === authUser._id && !message?.senderInfo?.ai ? "You" : message.senderInfo !== undefined ? message.senderInfo.fullName : selectedUser.fullName} •
                {message.senderInfo?.fullName === "Rapid AI" ? <span ><BrainCircuit height={"0.88rem"} /></span> : formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img loading="blur"
                  onClick={(e) => handleImageView(e)}
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] hover:cursor-pointer rounded-md mb-2"
                />
              )}
              {message.text && <p dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/@rapid/g, '<b style="color: skyblue">$&</b>') }}></p>}
            </div>
          </div>
        ))}
        {isUserMessageLoading && (
          <div className="chat chat-end">
            <div className="chat chat-end mr-[-1rem]">
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img loading="blur"
                    src={authUser.profilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-bubble flex flex-col">
                <div className="sm:w-[200px] rounded-md mb-2">
                  Sending{flashDot}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;