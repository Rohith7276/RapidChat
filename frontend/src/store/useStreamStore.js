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
 
  
  setStreamYoutube: (boolval) => set({streamYoutube: boolval}),
  setPdfScroll: (scroll) => set({ pdfScroll: scroll }),
 
  checkAndLoadUrl : async (url) => {
  const res =  await axiosInstance.get(`/stream/check-url/?url=${url}`);
  
},

  getStreamCreation: async () => {
    const socket = useAuthStore.getState().socket;

    socket.on("stream", async (data) => {
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

 
  getStreamAiMessage: async (messageData) => {
    const selectedUser = useChatStore.getState().selectedUser;
    const messages  = useChatStore.getState().messages;
    try {
      let res = {};
      if (selectedUser.fullName !== undefined) {

        const { streamData } = get();
        console.log("streamData", streamData)
        res = await axiosInstance.post(`/stream/stream-ai`, { ...messageData, data: streamData?.streamInfo?.pdfData?.slice(0, 5800), receiverId: selectedUser._id, groupId: null });
      }
      else
        res = await axiosInstance.post(`/stream/stream-ai`, { ...messageData, receiverId: null, groupId: selectedUser._id });
      const newMes = { ...res.data, _id: "1", senderId: "67af8f1706ba3b36e9679f9d", senderInfo: { fullName: "Rapid AI", profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg" } };

      set({ messages: [...messages, newMes] });
    } catch (error) {
      toast.error("error in getting stream ai message" + error);
    }
  },
 

  createStream: async (data) => {
    try {
      const res = await axiosInstance.post("/stream/create-stream", data);

      set({ streamData: res.data });

      toast.success("Stream created successfully" + res.data);
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
      // const { selectedUser } = useChatStore();
       const selectedUser = useChatStore.getState().selectedUser; 
      
      const res = await axiosInstance.get(`/stream/end-stream/${selectedUser._id}`)
      console.log("here ", res.data)
      toast.success("Stream ended successfully");
    } catch (error) {
      toast.error("Couldn't end the stream");
    }
  },

 
 
  
  setStreamMode: (booleanVal) => set({ streamMode: booleanVal }),
  setStreamData: (data) => set({ streamData: data }),
  setStartStreaming: (booleanVal) => set({ startStreaming: booleanVal }),
}));