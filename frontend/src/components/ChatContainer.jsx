import { useChatStore } from "../store/useChatStore";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BotMessageSquare, BrainCircuit } from 'lucide-react';
import ChatHeader from "./ChatHeader";
import { useInView } from "react-intersection-observer";

import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { X, TvMinimalPlay } from "lucide-react";
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
    streamSet,
    getStream,
    setStreamMode,
    streamMode,
    setStreamData,
    streamData
  } = useChatStore();
  const prevScrollHeight = useRef(0)
  const prevScrollTop = useRef(0)
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
    console.log(size.current)
    if (inView && size.current != null) {
      setPage(page + 1)
    }
  }, [inView]);

  useEffect(() => {
    size.current = null
    getStream()
    getMessages(selectedUser, page);
    if (selectedUser.name === undefined) {
      subscribeToMessages();
    } else {
      subscribeToGroup();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, page, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    setStreamMode(false)
    
  }, [selectedUser._id])
  



  useEffect(() => {
    if (isUserMessageLoading) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
      const interval = setInterval(() => {
        setFlashDot((prev) => (prev.length === 3 ? "" : prev + "."));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isUserMessageLoading]);

  //Infinite scroll
  useEffect(() => {

  }, [])


  useEffect(() => {
    prevScrollHeight.current = containerRef.current.scrollHeight;
    prevScrollTop.current = containerRef.current.scrollTop;
    console.log(streamData)
    setMessage(messages)
  }, [messages]);


  useEffect(() => {
    if (size.current === messages.length) setShowLoading(false)
    else setShowLoading(true)
    // if ((prevScrollTop.current == 0 && size.current != messages.length) || size.current == messages.length - 1) messageEndRef.current?.scrollIntoView();
    // else {
    //   const newScrollHeight = chatContainer.scrollHeight;
    //   chatContainer.scrollTop = prevScrollTop.current + (newScrollHeight - prevScrollHeight.current);
    // } 
    if (containerRef.current?.scrollHeight != null && size.current == null) containerRef.current.scrollTop = containerRef.current?.scrollHeight
    else {
      if (containerRef.current) {
        const newScrollHeight = containerRef.current.scrollHeight;
        containerRef.current.scrollTop = prevScrollTop.current + (newScrollHeight - prevScrollHeight.current);
      }

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
    <div className="flex-1 w-[70vw] flex flex-col  overflow-auto">
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

        {/* {message.length && showLoading ?
          <section className="flex justify-center items-center w-full">
            <div ref={ref}>
              <img
                src="./spinner.svg"
                alt="spinner"
                className="object-contain w-[4rem] text-white"
              />
            </div>
          </section> : <></>
        } */}
        {!message.length &&
          <div className="flex  items-center justify-center my-5">

            <h1 className="font-bold text-xl">Type to start a </h1>
            <div className="size-11 mx-2 rounded-lg bg-primary/10 flex items-center justify-center">
              <BotMessageSquare className="w-6 h-6 text-primary " />
            </div>
            <h1 className="font-bold text-2xl">RapidStudy! </h1>
          </div>
        }
        {message.map((message, index) => (
          <>
            {message?.AiStart ? <div
              ref={messageEndRef}
              className="flex justify-center items-center mt-2 mb-2">
              <div className="size-10 rounded-full border bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-primary " />
              </div>
              <h1 className="font-bold text-sm ml-2">Rapid AI</h1>
            </div>
              :
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
                {(index == 0 || new Date(messages[index - 1]?.createdAt).getMinutes() != new Date(message.createdAt).getMinutes()) &&
                  <div className="chat-header mb-1">
                    <time className="text-xs flex opacity-50 ml-1">
                      {message.senderId === authUser._id ? message.type == 'ai' ? "Rapid AI" : "You" : selectedUser.fullName} •&nbsp;
                      {message.type == 'ai' ? <span ><BrainCircuit height={"0.88rem"} /></span> : formatMessageTime(message.createdAt)}
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
              </div>}
          </>

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