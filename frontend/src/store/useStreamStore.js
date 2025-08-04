import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore"; 
import { useChatStore } from "./useChatStore"; 

export const useStreamStore = create((set, get) => ({ 
  streamMode: false, 
  streamData: [],
  streamSet: false,
  streamYoutube: false,
  pdfScroll: 0,
  pdfCheck: false,
  pdfScrollTop: 0, 
  startStreaming: false,
  
  setStreamYoutube: (boolval) => set({streamYoutube: boolval}),
  setPdfScroll: (scroll) => set({ pdfScroll: scroll }),
 
  checkAndLoadUrl : async (url) => {
  const res =  await axiosInstance.get(`/stream/check-url/?url=${url}`);
  
},

  getStreamCreation: async () => {
    const socket = useAuthStore.getState().socket;

    socket.on("stream", async (data) => {
      console.log(data)
      if (data.stopTime == null) {
        set({ streamData: data })

        set({ streamSet: true })
      }
      else {
        set({ streamData: [] })

        set({ streamSet: false })
      }
    }
    )
    socket.on("streamControls", async (data, stream, userId) => {
      set({ pdfCheck: !get().pdfCheck })
      setTimeout(async () => {

        const pdfScroll = get().pdfScroll;
        const streamData = get().streamData; 
        if (data == 999999 && streamData?._id == stream._id) { 
          await axiosInstance.get(`/stream/stream-control/${userId}/${pdfScroll}/${stream._id}`);

        }
        else { 
          set({ pdfScrollTop: data })
        }
      }, 100);
    }
    )
  },

 
  
 

  createStream: async (data) => {
    try { 
      const res = await axiosInstance.post("/stream/create-stream", data);
console.log(res)
      set({ streamData: res.data });

      toast.success("Stream created successfully"  );
    }
    catch (error) {
      toast.error("Couldn't create the stream");
    }
  },

  getStream: async () => {
    try {
      const  selectedUser  = useChatStore.getState().selectedUser;

      const res = await axiosInstance.get(`/stream/get-stream/${selectedUser._id}`)

      if (res.data.length) {
        console.log("here ", res.data)
        set({ streamData: res.data[0] })
      }
      else {
        set({ streamData: [] })
      }
    }
    catch (error) {
      set({ streamData: [] })

    }
  },
  streamStart: async () => {
    console.log("stream start")
  },

  endStream: async () => {
    try {  
       const selectedUser = useChatStore.getState().selectedUser;  
      const res = await axiosInstance.get(`/stream/end-stream/${selectedUser._id}`) 
      // toast.success("Stream ended successfully");
    } catch (error) {
      toast.error("Couldn't end the stream");
    }
  },

 
 
  
  setStreamMode: (booleanVal) => set({ streamMode: booleanVal }),
  setStreamData: (data) => set({ streamData: data }),
  setStartStreaming: (booleanVal) => set({ startStreaming: booleanVal }),
}));