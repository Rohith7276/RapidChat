
import { Book, Globe, X, ScreenShareIcon, Youtube, Menu, HistoryIcon,   Medal } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useStreamStore } from "../../store/useStreamStore";
import { useEffect, useState } from 'react';
const stream = () => {
    const navigate = useNavigate()
    const [History, setHistory] = useState(false)
    const { setStreamMode, setStartStreaming, getSpecificStream, setStreamYoutube, streamData, getStream } = useStreamStore();
   useEffect(() => {
     console.log(streamData)
   
      
   }, [])
   
    function getYouTubeId(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === "youtu.be") {
                return parsed.pathname.slice(1); // after "/"
            }
            if (parsed.hostname.includes("youtube.com")) {
                return new URLSearchParams(parsed.search).get("v");
            }
            return null;
        } catch (e) {
            return null;
        }
    }
    

    return (
        <div className="flex flex-col justify-around pt-8  h-full items-center ">
            <div className="w-full px-8 justify-between  mb-[-4.5rem]   flex">
                <button className=" btn " onClick={() => {setHistory(!History);  }}><HistoryIcon /> </button> 
                {History && (
                    <ol  tabIndex={0} onBlur={() => setHistory(false)} className="bg-base-300  rounded-md w-[25rem] h-[20rem] overflow-y-scroll  p-4 flex flex-col gap-3 absolute   mt-[4rem] shadow-md shadow-black ">
                        {streamData?.allStream?.data?.length == 0 && <div className='w-full text-center flex justify-center items-center h-full'>No History</div>}
                        {streamData?.allStream?.data && [...streamData?.allStream?.data].reverse().map((data, idx) => (
                            <li onClick={()=>{ getSpecificStream(data?._id).then(()=>
                             {        data?.streamInfo.type === "youtube" ?  navigate("/stream/youtube-player"): navigate("/stream/file") }
                                )
                               
                            }} key={idx} className='flex p-2 bg-base-200 hover:bg-base-100 cursor-pointer rounded-md gap-4'>
                                {/* Example conditional rendering */}
                                {data?.streamInfo.type === "youtube" ? (
                                    <img className='w-[7rem]'
                                        src={`https://img.youtube.com/vi/${getYouTubeId(data?.streamInfo.url)}/hqdefault.jpg`}
                                        alt="YouTube thumbnail"
                                    />
                                ) : (
                                    <img className='w-[7rem]'
                                        src="https://assets.monica.im/tools-web/_next/static/media/pdf2word.99a03821.png"
                                        alt=""
                                    />
                                )}
                                <div className='flex flex-col '>

                                    <h1 className='text-xl text-content font-bold'> {data?.streamInfo.title}</h1>
                                    <h2 className='truncate'> {data?.streamInfo.description}</h2>
                                    <div className='flex  gap-4'>

                                        <h2 className='flex gap-2'>  
                                            <img className='w-11 inline rounded-full' src={data?.senderInfo.profilePic} alt="" />
                                            {data?.senderInfo.fullName}</h2>
                                    </div>
                                </div>


                            </li>
                        ))
                       
                        }
                    </ol>
                )}

                <button className=" btn " onClick={() => setStreamMode(false)}><X /> </button>
            </div>

            <h1 className="text-xl font-semibold my-8 ">Select a source to stream</h1>
            <div className="flex flex-wrap justify-center py-6 px-11 items-center gap-11 ">
                  <button
                    onClick={() => {

                        if (streamData?.streamInfo?.type == "youtube") {

                            navigate("/stream/youtube-player")
                        }
                        else {
                            navigate("/stream/create-youtube-stream")
                        }
                    }}
                    className={`${streamData?.streamInfo?.type == "youtube" ? "border-2 border-white " : ""} px-4 py-4 h-[12rem] flex-col justify-center items-center text-3xl w-[12rem] flex gap-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition`}
                >
                    {streamData?.streamInfo?.type == "youtube" && <div className="text-red-600 bg-white px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}

                    <Youtube className="size-[3rem]" />

                    YouTube
                </button>  
                <button
                    onClick={() => {
                        if (streamData?.streamInfo?.type != "pdf") {
                            navigate("/stream/upload-file")
                        }
                        else {
                            navigate("/stream/file")
                        }
                    }}
                    className={`${streamData?.streamInfo?.type == "pdf" ? "border-2 border-white " : ""} px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[12rem] w-[12rem] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition`}
                >
                    {streamData?.streamInfo?.type == "pdf" && <div className="text-red-600 bg-white px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}
                    <Book className="size-[3rem]" /> PDF
                </button>
                <button
                    onClick={() => { 
                            navigate("/stream/quiz")
                         
                      
                    }}
                    className={`${streamData?.streamInfo?.type == "pdf" ? "border-2 border-white " : ""} px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[12rem] w-[12rem] bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition`}
                >
                    {streamData?.streamInfo?.type == "pdf" && <div className="text-red-600 bg-slate-800 px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}
                    <Medal className="size-[3rem]" /> QUIZ
                </button>
              <button
                    onClick={() => {
                        navigate("/stream/website")
                    }}
                    className="px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[12rem] w-[12rem] bg-green-500 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <Globe className="size-[3rem]" /> Website
                </button>
                <button
                    onClick={() => {
                        navigate("/stream/screen-share")
                    }}
                    className="px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[12rem] w-[12rem] bg-[#ededed] text-black rounded-lg hover:bg-gray-200 transition"
                >
                    <ScreenShareIcon className="size-[3rem]" /> Screen share
                </button>  
            </div>
        </div>
    )
}

export default stream
