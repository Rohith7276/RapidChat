import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useStreamStore } from '../../../store/useStreamStore';

import Loader from '../../../components/Loader'; 
const YouTubePlayer = ({ videoId, userId }) => {
  const playerRef = useRef(null);
  const [pausedTime, setPausedTime] = useState(0); 
    const { setPdfScroll, pdfCheck, pdfScrollTop, setStreamData, setStartStreaming, endStream, streamData } = useStreamStore()

  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    console.log(videoId)
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

    return () => {
      setLoading(false)
      delete window.onYouTubeIframeAPIReady;
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
    if (event.data === window.YT.PlayerState.PAUSED) {
      const time = playerRef.current.getCurrentTime();
      setPausedTime(time);
      savePauseTime(time);
    }

  };

  const savePauseTime = async (time) => {
    try {
      //   await axios.post("http://localhost:5000/save-pause-time", {
      //     userId,
      //     videoId,
      //     pausedTime: time,
      //   });
      alert("Paused time saved:" + time);
    } catch (error) {
      console.error("Error saving pause time:", error);
    }
  };

  return (
    <div>
      {loading ? <Loader /> :
        <>
                <button
                        className="bg-base-content text-base-300 p-2 px-3 rounded-md"
                        onClick={() => {
                            setStartStreaming(false);
                            setStreamData([]);
                            endStream();
                        }}
                    >
                        End Stream
                    </button>
          <h2 className="flex justify-center items-center my-1"> Video streaming by <span className="ml-2 mr-1"><img className="size-6 object-cover rounded-full" src={streamData?.senderInfo?.profilePic} alt="profile" /></span> <span>{streamData?.senderInfo?.fullName}</span></h2>
          <div id="player" ref={playerRef} className="w-[36rem] m-auto h[20rem] overflow-hidden"></div>
        </>
      }
    </div>
  );
};

export default YouTubePlayer;
