import React, { useState, useEffect, useRef } from "react"; 
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios"; 
import { useAuthStore } from "../store/useAuthStore";

const WebsiteViewer = () => {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const webRef = useRef(null)
    const { authUser } = useAuthStore()

  const { setPdfScroll, pdfCheck, pdfScrollTop, setStreamData, setStartStreaming, endStream, streamData, selectedUser } = useChatStore()
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

  const handleSubmit = (e) => {
    e.preventDefault();

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      new URL(formattedUrl); // Validate URL
      setSubmittedUrl(formattedUrl);
    } catch (error) {
      alert('Please enter a valid URL.');
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

        :
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 border border-gray-300 px-3 py-2 rounded-lg shadow-sm"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Load
          </button>
        </form>
      }
    </div>
  );
};

export default WebsiteViewer;
