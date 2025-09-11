 
import { Book, Globe, X, ScreenShareIcon, Youtube } from 'lucide-react';
 
import { useNavigate } from 'react-router-dom';
import { useStreamStore } from "../../store/useStreamStore";
const stream = () => {
    const navigate = useNavigate() 
    const {  setStreamMode,  setStartStreaming, setStreamYoutube , streamData  } = useStreamStore();
 
    return (
        <div className="flex flex-col justify-around pt-8  h-full items-center ">
            <div className="w-full px-8  mb-[-4.5rem] justify-end flex">
                <button className=" btn" onClick={() => setStreamMode(false)}><X /> </button>
            </div>
            <h1 className="text-xl font-semibold my-8 ">Select a source to stream</h1>
            <div className="flex flex-wrap justify-center py-6 items-center gap-11 ">
                <button
                    onClick={() => {

                        if (streamData?.streamInfo?.type == "youtube") {

                            navigate("/stream/youtube-player")
                        }
                        else {
                            navigate("/stream/create-youtube-stream")
                        }
                    }}
                    className={`${streamData?.streamInfo?.type == "youtube" ? "border-2 border-white " : ""} px-4 py-4 h-[30vh] flex-col justify-center items-center text-3xl w-[15vw] flex gap-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition`}
                >
                    {streamData?.streamInfo?.type == "youtube" && <div className="text-red-600 bg-white px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}

                    <Youtube className="size-[5rem]" />

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
                    className={`${streamData?.streamInfo?.type == "pdf" ? "border-2 border-white " : ""} px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[30vh] w-[15vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition`}
                >
                    {streamData?.streamInfo?.type == "pdf" && <div className="text-red-600 bg-white px-2 pb-1 rounded-md  font-bold text-lg">Streaming now!</div>}
                    <Book className="size-[5rem]" /> PDF
                </button>
                <button
                    onClick={() => {
                         navigate("/stream/website")
                    }}
                    className="px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[30vh] w-[15vw] bg-green-500 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <Globe className="size-[5rem]" /> Website
                </button>
                <button
                    onClick={() => {
                        setSelectStream(4)
                        setStreamYoutube(false);
                        setStartStreaming(4);
                    }}
                    className="px-4 py-2 flex-col items-center justify-center text-3xl flex gap-4 h-[30vh] w-[15vw] bg-[#ededed] text-black rounded-lg hover:bg-gray-200 transition"
                >
                    <ScreenShareIcon className="size-[5rem]" /> Screen share
                </button>
            </div>
        </div>
    )
}

export default stream
