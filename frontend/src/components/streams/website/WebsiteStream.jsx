import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../../store/useChatStore";
import { useStreamStore } from '../../../store/useStreamStore';
import toast from "react-hot-toast";
import { axiosInstance } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import { BotMessageSquare } from "lucide-react";
import Loader from "../../Loader";

const WebsiteViewer = () => {
  const [url, setUrl] = useState('');

  const [submittedUrl, setSubmittedUrl] = useState('');
  const webRef = useRef(null)
  const { authUser } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { selectedUser } = useChatStore()
  const { setPdfScroll, pdfCheck, checkAndLoadUrl, pdfScrollTop, setStreamData, setStartStreaming, endStream, streamData } = useStreamStore()
  useEffect(() => {
    if (webRef.current) {
      setPdfScroll(webRef.current.scrollTop);
      console.log(`Scroll Top: ${webRef.current.scrollTop}`);
    }
  }, [pdfCheck]);

  useEffect(() => {
    console.log("pdfScrollTop", pdfScrollTop)
    if (webRef.current)
      webRef.current.scrollTop = pdfScrollTop

  }, [pdfScrollTop]);

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    if (!url) {
      toast.error("No URL provided");
      setLoading(false);
      return;
    }
    let formattedUrl = url.trim();
    console.log("formattedUrl", formattedUrl)
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      await checkAndLoadUrl(formattedUrl)
      new URL(formattedUrl); // Validate URL
      setSubmittedUrl(formattedUrl);
    } catch (error) {
      toast.error("URL is not embeddable. Please try another.");

    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">

      {submittedUrl ? (
        <div className="w-full max-w-4xl h-[75vh] border border-gray-300 rounded-lg overflow-hidden shadow-md">
          <iframe
            ref={webRef}
            src={submittedUrl}
            title="Website Preview"
            className="w-full h-full"
            onError={() => {
              console.log("wtf")
              toast.error("URL is not working/valid. Please try another URL.");
              setStartStreaming(false);
              setStreamData([]);
              endStream();
            }}
          ></iframe>
          {streamData?.senderInfo?.fullName !== authUser?.fullName && (
            <button
              className="bg-base-content text-base-300 p-2 px-3 rounded-md"
              onClick={async () => {
                await axiosInstance.get(
                  `/auth/user/stream-control/${selectedUser._id}/999999/${streamData._id}`
                );
              }}
            >
              Seek
            </button>
          )}
          {streamData?.senderInfo?.fullName === authUser?.fullName && (
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
          )}
        </div>
      )

        : <>
          <h1 className="text-xl font-bold flex">Stream Seamlessly using <span className="ml-2 text-base-300 invert ">RapidStudy</span> <BotMessageSquare className="w-6 mr-2 ml-1 h-6 text-primary " />Streams</h1>
          <form onSubmit={handleSubmit} className="flex flex-col my-4 gap-2 w-full max-w-md">

            <input
              type="text"
              placeholder="Enter website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input input-bordered w-full"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn   btn-primary w-full disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg  transition"
            >
              Load

            </button>
      {loading &&  <Loader /> }
          </form>
        </>

      }
    </div>
  );
};

export default WebsiteViewer;
