import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useStreamStore } from '../../../store/useStreamStore';
import { axiosInstance } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import {  MoveLeft, PictureInPicture,   PictureInPicture2Icon  } from "lucide-react";
import { jsPDF } from "jspdf"
import { Link, useNavigate } from "react-router-dom";
import Loader from '../../../components/Loader'; 
const YouTubePlayer = () => {
  const navigate = useNavigate()
  const { setPdfScroll, pdfCheck, pdfScrollTop, setStreamData, setStartStreaming,getStream , endStream, streamData } = useStreamStore()
  const [url, setUrl] = useState(streamData?.streamInfo?.url)
  const [videoId, setVideoId] = useState(url)
  const playerRef = useRef(null);
  const [isFloating, setIsFloating] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 }); // default position
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false)
  const [pausedTime, setPausedTime] = useState(0);
  const [numPages, setNumPages] = useState(null);
  // Removed unused scroll state
  const [brightness, setBrightness] = useState(100)
  const [notes, setNotes] = useState("")
  const [color, setColor] = useState("#111")
  const [bg, setBg] = useState("#f4edd2")
  const { selectedUser } = useChatStore()
  const { authUser } = useAuthStore()

 

  useEffect(() => {
    console.log(pdfScrollTop)
    if (playerRef.current && pdfScrollTop>2) {
      playerRef.current?.seekTo(pdfScrollTop, true);
    }
  }, [pdfScrollTop]);
  // useEffect(() => {
  //    setPdfScroll(playerRef.current?.getCurrentTime())
  // }, [pdfCheck]);
  

  const toggleFloating = () => {
    setIsFloating(!isFloating);
  };
  // Start dragging
  const handleMouseDown = (e) => {
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

   // Move player
  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  // Stop dragging
  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };


  useEffect(() => {

    setBrightness(localStorage.getItem("brightness") || 50)
    setBg(localStorage.getItem("bg") || "#f4edd2")
    setColor(localStorage.getItem("color") || "#111")

    document.documentElement.style.setProperty(
      "--note-text-size",
      `${localStorage.getItem("size") || 16}px`
    )

  }, [])


  useEffect(() => {
    console.log(brightness)
  }, [brightness])



  useEffect(() => {
    console.log(url)
    if (!url) {
      console.log(streamData?.streamInfo?.url)
      setVideoId(streamData?.streamInfo?.url)
    }
    try {
      console.log("videoId", videoId)
      const loadYouTubeAPI = () => {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      };

      if (!window.YT) {
        loadYouTubeAPI();
      } else {
        createPlayer();
      }

      window.onYouTubeIframeAPIReady = createPlayer;
    }
    finally {
      setLoading(false)
    }
    return () => {
      delete window.onYouTubeIframeAPIReady;
      setLoading(false)
    };
  }, []);

  const createPlayer = () => {
    setLoading(true)
    try {

      console.log(videoId)
      const url = new URL(videoId);
      const videoIdParam = url.searchParams.get("v");
      console.log(videoIdParam)
      playerRef.current = new window.YT.Player("player", {
        videoId: videoIdParam,
        events: {
          onStateChange: onPlayerStateChange,
        },
      });
    }
    finally {
      setLoading(false)
    }
  };

  const onPlayerStateChange = (event) => {
    const time = playerRef.current.getCurrentTime();
   
    savePauseTime(time);
  };

  const savePauseTime = async (time) => {
    try {
      setPdfScroll(time)
    } catch (error) {
      console.error("Error saving pause time:", error);
    }
  };

  return (
    <div className="select-none">
      {loading ? <Loader texts={["Loading..."]} /> :
        <div className="flex items-center justify-center flex-col">
          <div className="w-full p-8 mb-[-5rem] justify-end flex">
            <Link className=" btn" to={"/stream"}><MoveLeft /> </Link>
          </div>
          <h2 className="flex justify-center items-center my-1 pb-8"> Video streaming by <span className="ml-2 mr-1"><img className="size-6 object-cover rounded-full" src={streamData?.senderInfo?.profilePic} alt="profile" /></span> <span>{streamData?.senderInfo?.fullName}</span></h2>
         <div
        ref={dragRef}
        className={`transition-all !z-[10] duration-300 p-3 rounded-lg bg-black`}
        style={{
          position: isFloating ? "fixed" : "relative",
          width: isFloating ? "522px" : "640px",
          height: isFloating ? "330px" : "360px",
          left: isFloating ? `${position.x}px` : "0",
          top: isFloating ? `${position.y}px` : "0",
          zIndex: 9999,
          cursor: isFloating ? "grab" : "default",
        }}
        onMouseDown={isFloating ? handleMouseDown : null}
      >
            <div id="player" ref={playerRef} className="w-full h-full z-[100] "   ></div>
          </div>

          <div className="flex justify-between w-full px-11 items-center mt-4">
            {streamData?.senderInfo?.fullName !== authUser?.fullName && (
              <button
                className="bg-base-content text-base-300 p-2 px-3 rounded-md"
                onClick={async () => {
                  await axiosInstance.get(
                    `/stream/stream-control/${selectedUser._id}/999999/${streamData._id}`
                  );
                }}
              >
                Seek
              </button>
            )}
           <button
        onClick={toggleFloating}
        className={`${isFloating? "bg-gray-500": "bg-blue-600"} mt-4 px-4 py-2  text-white rounded-xl shadow-lg hover:bg-blue-700`}
      >
        { !isFloating?  <PictureInPicture/> : <PictureInPicture2Icon/> }
      </button>
            {streamData?.senderInfo?.fullName === authUser?.fullName && (
              <button
                className="bg-base-content text-base-300 p-2 px-3 rounded-md"
                onClick={() => {
                  setStreamData([]);
                  endStream(); 
                  getStream();
                  navigate("/stream")
                }}
              >
                End Stream
              </button>
            )}


            <div>
              <label htmlFor="color" className="text-base-context"></label>
            </div>
            <input
              type="color"
              value={bg}
              onChange={(e) => {
                setBg(e.target.value);
                localStorage.setItem("bg", e.target.value);
              }} />

            <label htmlFor="color" className="text-base-context">
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                localStorage.setItem("color", e.target.value);
              }} />

            <label htmlFor="textSize" className="text-base-context">

            </label>
            <input
              type="number"
              min={10}
              max={50}
              defaultValue={16}
              className="bg-base-content  text-base-100"
              onChange={(e) => {
                document.documentElement.style.setProperty(
                  "--note-text-size",
                  `${e.target.value}px`
                );
                localStorage.setItem("size", e.target.value);
              }} />
          </div>
          <div className="mt-11  flex flex-col gap-6 justify-center items-center my-5">
            <textarea
              id="notesArea"
              name="notes"
              style={{
                backgroundColor: bg,
                color: color,
                fontSize: "var(--note-text-size, 16px)",
                lineHeight: "1.2", // Decreased line height

              }}
              placeholder="Notes"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); }}
              className="w-[57vw] select-text rounded-md p-5 text-base-300  text-4xl max-h-full h-[20vh]"
            ></textarea>
            <button
              className="bg-base-content userselect  text-base-300 mb-3 p-2 px-3 rounded-md"
              onClick={() => {
                const notesArea = document.getElementById("notesArea");
                if (!notesArea || !notesArea.value.trim()) {
                  alert("Please add some notes before saving.");
                  return;
                }

                const pdf = new jsPDF();
                const style = window.getComputedStyle(notesArea);

                const lines = notesArea.value.split("\n");
                const lineHeight = parseInt(style.fontSize) * 1;
                const margin = 10;
                let y = margin;
                // pdf.setFontSize(parseInt(style.fontSize, 10));
                const rgb = style.color.match(/\d+/g);
                if (rgb) {
                  pdf.setTextColor(parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10));
                }

                const bgRgb = style.backgroundColor.match(/\d+/g);
                if (bgRgb) {
                  pdf.setFillColor(parseInt(bgRgb[0], 10), parseInt(bgRgb[1], 10), parseInt(bgRgb[2], 10));
                  pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, 'F');
                }

                lines.forEach((line) => {
                  const wrappedLines = pdf.splitTextToSize(line, pdf.internal.pageSize.width - 2 * margin);
                  wrappedLines.forEach((wrappedLine) => {
                    if (y + lineHeight > pdf.internal.pageSize.height - margin) {
                      pdf.addPage();
                      const rgb = style.color.match(/\d+/g);
                      if (rgb) {
                        pdf.setTextColor(parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10));
                      }

                      const bgRgb = style.backgroundColor.match(/\d+/g);
                      if (bgRgb) {
                        pdf.setFillColor(parseInt(bgRgb[0], 10), parseInt(bgRgb[1], 10), parseInt(bgRgb[2], 10));
                        pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, 'F');
                      }
                      y = margin;
                    }
                    pdf.text(wrappedLine, margin, y);
                    y += lineHeight;
                  });
                });

                pdf.save((streamData?.streamInfo?.title || "notes") + "_notes.pdf");
              }
              }
            >
              Save Notes
            </button>
          </div>
        </div>
      }
    </div>
  );
};

export default YouTubePlayer;
