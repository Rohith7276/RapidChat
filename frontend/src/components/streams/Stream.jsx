import { Book, Globe, X, ScreenShareIcon, Youtube, HistoryIcon, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStreamStore } from "../../store/useStreamStore";
import { extractYouTubeId } from "../../lib/utils";
import { useEffect, useState } from 'react';

const Stream = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState(false);
    const {
        setStreamMode,
        getSpecificStream,
        streamData,
        streamHistory,
        getStream
    } = useStreamStore();

    useEffect(() => {
        getStream();
    }, []);

    const isYouTubeActive = Boolean(
        streamData?.streamInfo?.type === "youtube" && !streamData?.stopTime
    );
    const isPdfActive = Boolean(
        streamData?.streamInfo?.type === "pdf" && !streamData?.stopTime
    );

    return (
        <div className="flex flex-col justify-around pt-8 h-full items-center">
            <div className="w-full px-8 justify-between mb-[-4.5rem] flex items-center">
                <button
                    className="btn btn-ghost btn-circle"
                    onClick={() => setHistory(!history)}
                    title="Stream History"
                >
                    <HistoryIcon className="size-5" />
                </button>

                {history && (
                    <ol
                        tabIndex={0}
                        onBlur={() => setHistory(false)}
                        className="bg-base-300 rounded-xl w-[25rem] max-w-[90vw] h-[20rem] overflow-y-auto p-4 flex flex-col gap-3 absolute mt-[4rem] shadow-xl z-50 border border-base-100"
                    >
                        {(!streamHistory?.data || streamHistory?.data?.length === 0) && (
                            <div className='w-full text-center flex justify-center items-center h-full text-sm opacity-60'>
                                No stream history found
                            </div>
                        )}
                        {streamHistory?.data && [...streamHistory.data].reverse().map((data, idx) => {
                            const ytId = extractYouTubeId(data?.streamInfo?.url);
                            return (
                                <li
                                    onClick={() => {
                                        getSpecificStream(data?._id).then(() => {
                                            if (data?.streamInfo?.type === "youtube") {
                                                navigate("/stream/youtube-player");
                                            } else {
                                                navigate("/stream/file");
                                            }
                                        });
                                    }}
                                    key={idx}
                                    className='flex p-2.5 bg-base-200 hover:bg-base-100 cursor-pointer rounded-lg gap-3 transition-colors border border-base-300'
                                >
                                    {data?.streamInfo?.type === "youtube" ? (
                                        <img
                                            className='w-24 h-16 rounded object-cover shrink-0 bg-black'
                                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                            alt="YouTube thumbnail"
                                        />
                                    ) : (
                                        <div className='w-24 h-16 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary'>
                                            <Book className="size-8" />
                                        </div>
                                    )}
                                    <div className='flex flex-col justify-between overflow-hidden'>
                                        <h1 className='text-sm font-bold truncate text-base-content'>
                                            {data?.streamInfo?.title || "Untitled Stream"}
                                        </h1>
                                        <p className='text-xs opacity-70 truncate'>
                                            {data?.streamInfo?.description || "No description"}
                                        </p>
                                        <div className='flex items-center gap-2 text-xs opacity-60'>
                                            <img
                                                className='size-4 rounded-full object-cover'
                                                src={data?.senderInfo?.profilePic || "/avatar.png"}
                                                alt=""
                                            />
                                            <span className='truncate'>{data?.senderInfo?.fullName}</span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}

                <button
                    className="btn btn-ghost btn-circle"
                    onClick={() => {
                        setStreamMode(false);
                        navigate("/");
                    }}
                    title="Close Streams"
                >
                    <X className="size-5" />
                </button>
            </div>

            <div className="text-center my-6">
                <h1 className="text-2xl font-bold">Select a Source to Stream</h1>
                <p className="text-sm opacity-60 mt-1">Broadcast synchronized content directly to your chat room</p>
            </div>

            <div className="flex flex-wrap justify-center py-6 px-4 sm:px-8 items-center gap-4 sm:gap-6">
                {/* YouTube */}
                <button
                    onClick={() => {
                        if (isYouTubeActive) {
                            navigate("/stream/youtube-player");
                        } else {
                            navigate("/stream/create-youtube-stream");
                        }
                    }}
                    className={`relative px-4 py-4 h-32 sm:h-44 w-28 sm:w-44 flex flex-col justify-center items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                        isYouTubeActive ? "ring-4 ring-white/80" : ""
                    }`}
                >
                    {isYouTubeActive && (
                        <div className="absolute top-2.5 text-red-600 bg-white px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs shadow-sm animate-pulse">
                            LIVE NOW
                        </div>
                    )}
                    <Youtube className="size-8 sm:size-12" />
                    <span className="font-bold text-sm sm:text-lg">YouTube</span>
                </button>

                {/* PDF */}
                <button
                    onClick={() => {
                        if (isPdfActive) {
                            navigate("/stream/file");
                        } else {
                            navigate("/stream/upload-file");
                        }
                    }}
                    className={`relative px-4 py-4 h-32 sm:h-44 w-28 sm:w-44 flex flex-col justify-center items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                        isPdfActive ? "ring-4 ring-white/80" : ""
                    }`}
                >
                    {isPdfActive && (
                        <div className="absolute top-2.5 text-blue-600 bg-white px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs shadow-sm animate-pulse">
                            ACTIVE
                        </div>
                    )}
                    <Book className="size-8 sm:size-12" />
                    <span className="font-bold text-sm sm:text-lg">PDF Reader</span>
                </button>

                {/* QUIZ */}
                <button
                    onClick={() => navigate("/stream/quiz")}
                    className="px-4 py-4 h-32 sm:h-44 w-28 sm:w-44 flex flex-col justify-center items-center gap-3 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <Medal className="size-8 sm:size-12 text-yellow-400" />
                    <span className="font-bold text-sm sm:text-lg">Quiz Arena</span>
                </button>

                {/* Website */}
                <button
                    onClick={() => navigate("/stream/website")}
                    className="px-4 py-4 h-32 sm:h-44 w-28 sm:w-44 flex flex-col justify-center items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <Globe className="size-8 sm:size-12" />
                    <span className="font-bold text-sm sm:text-lg">Website</span>
                </button>

                {/* Screen share */}
                <button
                    onClick={() => navigate("/stream/screen-share")}
                    className="px-4 py-4 h-32 sm:h-44 w-28 sm:w-44 flex flex-col justify-center items-center gap-3 bg-zinc-700 hover:bg-zinc-800 text-white rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <ScreenShareIcon className="size-8 sm:size-12" />
                    <span className="font-bold text-sm sm:text-lg">Screen Share</span>
                </button>
            </div>
        </div>
    );
};

export default Stream;

