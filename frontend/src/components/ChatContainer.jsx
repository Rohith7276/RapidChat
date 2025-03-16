import { useChatStore } from "../store/useChatStore";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrainCircuit } from 'lucide-react';
import ChatHeader from "./ChatHeader";
import { useInView } from "react-intersection-observer";

import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { X } from "lucide-react";
const chatContainer = () => {
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
  const { ref, inView } = useInView();
  const [showLoading, setShowLoading] = useState(true)
  const { authUser } = useAuthStore();
  const containerRef = useRef(null);
  const [page, setPage] = useState(1)
  const messageEndRef = useRef(null);
  const [flashDot, setFlashDot] = useState("");
  const [message, setMessage] = useState([])
  const [imageViewSrc, setImageViewSrc] = useState("")
  const size = useRef(null)
  useEffect(() => { 
    if (inView){ 
      setPage(page + 1) 
    } 
  }, [inView]);

  useEffect(() => {
    getMessages(selectedUser, page);
    if (selectedUser.name === undefined) subscribeToMessages();
    else subscribeToGroup();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, page, subscribeToMessages, unsubscribeFromMessages]);


  useEffect(() => {
    if (isUserMessageLoading) {
      const interval = setInterval(() => {
        setFlashDot((prev) => (prev.length === 3 ? "" : prev + "."));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isUserMessageLoading]);

  //Infinite scroll
  const prevScrollHeight = useRef(0)
  const prevScrollTop = useRef(0)

  useEffect(() => {
    prevScrollHeight.current = containerRef.current.scrollHeight;
    prevScrollTop.current = containerRef.current.scrollTop;
    setMessage(messages)
  }, [messages]);
  
  
  useEffect(() => {
    if(size.current === messages.length) setShowLoading(false)
    else setShowLoading(true)
    if ((prevScrollTop.current == 0 && size.current != messages.length)|| size.current == messages.length - 1) messageEndRef.current?.scrollIntoView();
    else {
      const newScrollHeight = chatContainer.scrollHeight;
      chatContainer.scrollTop = prevScrollTop.current + (newScrollHeight - prevScrollHeight.current);
    }
    size.current = messages.length;

  }, [message])



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
          <img loading="blur" src={imageViewSrc} alt="attachment" className="z-20 max-w-[90%] max-h-[90%] object-contain" />
          <button className=" bg-[#ffffff14] hover:cursor-pointer hover:bg-black rounded-full p-[4px] z-20 -mt-[74vh] -ml-[2vw]" onClick={() => setImageViewSrc("")}>
            <X />
          </button>
        </div>
      </div>}

      <div className="flex-1  overflow-y-auto p-4 space-y-4"
        ref={containerRef}  >

        {message.length && showLoading  &&
          <section className="flex justify-center items-center w-full">
            <div ref={ref}>
              <img
                src="./spinner.svg"
                alt="spinner"
                className="object-contain w-[4rem] text-white"
              />
            </div>
          </section>
        }
        {message.map((message, index) => (
          <div
            ref={messageEndRef}
            key={message._id}
            className={`chat mt-0 ${message.senderId === authUser._id && !message?.senderInfo?.ai ? "chat-end" : "chat-start"}`}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img loading="blur"
                  src={
                    message.groupId !== "" || message.type == "ai" ? message.senderInfo.profilePic || "/avatar.png" : message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            {(index==0 || new Date(messages[index-1]?.createdAt).getMinutes() != new Date(message.createdAt).getMinutes()) &&
             <div className="chat-header mb-1">
              <time className="text-xs flex opacity-50 ml-1">
                {message.senderId === authUser._id ? message.type == 'ai'? "Rapid AI" : "You" : selectedUser.fullName} •&nbsp;
                { message.type == 'ai'? <span ><BrainCircuit height={"0.88rem"} /></span> : formatMessageTime(message.createdAt)}
              </time>
            </div>}
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
          <div className="chat chat-end ">
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
export default chatContainer;