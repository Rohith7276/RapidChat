import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useChatStore } from "../store/useChatStore";

const YouTubePlayer = ({ videoId, userId }) => {
  const playerRef = useRef(null);
  const [pausedTime, setPausedTime] = useState(0);
  const {streamData} = useChatStore();

  useEffect(() => {
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
      delete window.onYouTubeIframeAPIReady;
    };
  }, []);

  const createPlayer = () => {
    const url = new URL(videoId);
    const videoIdParam = url.searchParams.get("v");
    playerRef.current = new window.YT.Player("player", {
      videoId: videoIdParam,
      events: {
      onStateChange: onPlayerStateChange,
      },
    });
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
      alert("Paused time saved:"+time);
    } catch (error) {
      console.error("Error saving pause time:", error);
    }
  };

  return (
    <div>
      <h2 className="flex justify-center items-center my-1"> Video streaming by <span className="ml-2 mr-1"><img className="size-6 object-cover rounded-full" src={streamData?.senderInfo?.profilePic} alt="profile" /></span> <span>{streamData?.senderInfo?.fullName}</span></h2>
      <div id="player" className="w-[36rem] m-auto h[20rem] overflow-hidden"></div>
    </div>
  );
};

export default YouTubePlayer;
