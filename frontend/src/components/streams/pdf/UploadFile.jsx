import { useState } from "react";
import PropTypes from "prop-types";
// import axios from "axios";
import Loader from "../../Loader";
import { axiosInstance } from "../../../lib/axios";
import { useChatStore } from "../../../store/useChatStore";
import { useStreamStore } from '../../../store/useStreamStore';
import { BotMessageSquare, MoveLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore"; 

const UploadPDF = ({ onUpload }) => {
 
    const [file, setFile] = useState(null);
    const { selectedUser } = useChatStore();
    const { startStreaming, setStreamData, createStream} = useStreamStore();
    const [videoId, setVideoId] = useState("")
    const [title, setTitle] = useState("")
    const [loading, setLoading] = useState(false)
    const [desc, setDesc] = useState("")


    const handleFileChange = (e) => setFile(e.target.files[0]);

    const uploadFile = async () => {
        setLoading(true);
        try {
        if (!file) return toast.error("Please select a file!");

        const formData = new FormData();
        formData.append("pdf", file);
        console.log('selectedUser', selectedUser._id) 
            
            const data  = await axiosInstance.post(import.meta.env.VITE_API_BASE_URL + "/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log(data.data)
            const uploadData = {title, description:desc,pdfName: data.data.pdfName, pdfUrl: data.data.fileUrl, groupId: selectedUser._id, recieverId: selectedUser._id, pdfData: data.data.pdfText}
            // setStreamData(uploadData)
            console.log(data.data.fileUrl)
            createStream(uploadData)
            console.log('uploadData', uploadData)
            onUpload(data.data);  // Pass the file path to the parent component
        } catch (err) {
            console.error(err);
            toast.error("File upload failed"); 
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className={` ${startStreaming ? "hidden" : "block"} p-4 space-y-4 flex flex-col gap-5 `}>
            
                <h1 className="text-xl font-bold flex">Stream Seamlessly using <span className="ml-2 text-base-300 invert ">RapidStudy</span> <BotMessageSquare className="w-6 mr-2 ml-1 h-6 text-primary " />Streams</h1> 
    
            <input
              type="text"
              placeholder="Enter the title "
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Enter the description of the PDF"
              onChange={(e) => setDesc(e.target.value)}
              className="input input-bordered w-full"
            />
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold m-auto file:bg-gray-400 file:text-base-100 hover:file:bg-blue-100 "
                />
                <button
                    onClick={uploadFile} 
              type="submit"
              disabled={loading}
              className="btn   btn-primary w-full disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg  transition"
            >
                    Upload
                </button>
                      {loading &&  <Loader /> }
                
            </div> 
        </div>
    );
};
UploadPDF.propTypes = {
    onUpload: PropTypes.func.isRequired,
};

export default UploadPDF;
