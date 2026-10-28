import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export const useStreamStore = create((set, get) => ({
  streamMode: false,
  streamData: null,
  streamSet: false,
  streamYoutube: false,
  streamLoading: false,
  streamHistory: [],
  pdfScroll: 0,
  pdfScrollTop: 0,
  pdfCheck: false,
  startStreaming: false,

  setStreamYoutube: (boolval) => set({ streamYoutube: boolval }),
  setPdfScroll: (scroll) => set({ pdfScroll: scroll }),
  setPdfScrollTop: (scroll) => set({ pdfScrollTop: scroll }),

  checkAndLoadUrl: async (url) => {
    try {
      await axiosInstance.get(`/stream/check-url/?url=${url}`);
    } catch (e) {
      // ignore
    }
  },

  getStreamCreation: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("stream");
    socket.on("stream", async (data) => {
      if (data && data._id && data.stopTime == null) {
        set({ streamData: data, streamSet: true, streamMode: true });
        const authUser = useAuthStore.getState().authUser;
        if (data.streamerId !== authUser?._id) {
          toast.success(`Stream started by ${data.senderInfo?.fullName || "Friend"}!`, { id: "stream-start-notify" });
        }
      } else {
        set({ streamData: null, streamSet: false });
        toast("Stream ended", { icon: "⏹️", id: "stream-end-notify" });
      }
    });

    socket.off("streamControls");
    socket.on("streamControls", async (data, stream, userId) => {
      set({ pdfCheck: !get().pdfCheck });
      setTimeout(async () => {
        const pdfScroll = get().pdfScroll;
        const streamData = get().streamData;
        if (data == 999999 && streamData?._id == stream._id) {
          await axiosInstance.get(`/stream/stream-control/${userId}/${pdfScroll}/${stream._id}`);
        } else {
          set({ pdfScrollTop: data });
        }
      }, 100);
    });
  },

  createStream: async (data) => {
    try {
      const res = await axiosInstance.post("/stream/create-stream", data);
      set({ streamData: res.data, streamSet: true, streamMode: true });
      toast.success("Stream created successfully!");
      return res;
    } catch (error) {
      console.error("Create stream error:", error);
      toast.error(error.response?.data?.message || "Couldn't create the stream");
      throw error;
    }
  },

  getSpecificStream: (id) => {
    return new Promise(async (resolve, reject) => {
      try { 
        const selectedUser = useChatStore.getState().selectedUser;
        const res = await axiosInstance.get(`/stream/get-specific-stream/${id}`);
        const allStream = selectedUser?._id
          ? await axiosInstance.get(`/stream/get-all-stream/${selectedUser._id}`)
          : { data: [] };
        set({ streamData: res.data, streamSet: true, streamMode: true, streamHistory: allStream.data || [] });
        resolve(res);
        toast.success("Stream loaded successfully");
      } catch (error) {
        console.log(error);
        reject(error);
        toast.error("Couldn't load the stream");
      }
    });
  },

  getStream: async () => {
    set({ streamLoading: true });
    try {
      const selectedUser = useChatStore.getState().selectedUser;
      if (!selectedUser?._id) {
        set({ streamData: null, streamSet: false, streamHistory: [] });
        return;
      }

      const res = await axiosInstance.get(`/stream/get-stream/${selectedUser._id}`);
      const allStream = await axiosInstance.get(`/stream/get-all-stream/${selectedUser._id}`);
     
      const activeStream = (res.data && res.data._id && !res.data.stopTime) ? res.data : null;
      set({
        streamData: activeStream,
        streamSet: Boolean(activeStream),
        streamHistory: allStream.data || [],
      });
    } catch (error) {
      set({ streamData: null, streamSet: false, streamHistory: [] });
    } finally {
      set({ streamLoading: false });
    }
  },

  streamStart: async () => {
    console.log("stream start");
  },

  endStream: async () => {
    try { 
      const selectedUser = useChatStore.getState().selectedUser;
      const currentStream = get().streamData;
      const targetId = currentStream?._id || selectedUser?._id || currentStream?.groupId || currentStream?.receiverId;
      
      if (!targetId) {
        set({ streamData: null, streamSet: false });
        return;
      }
      
      const res = await axiosInstance.get(`/stream/end-stream/${targetId}`);
      set({ streamData: null, streamSet: false });
      toast.success("Stream ended successfully");
      return res.data;
    } catch (error) {
      console.log("stream end error:", error);
      set({ streamData: null, streamSet: false });
    }
  },

  setStreamMode: (booleanVal) => set({ streamMode: booleanVal }),
  setStreamData: (data) => set({ streamData: data }),
  setStartStreaming: (booleanVal) => set({ startStreaming: booleanVal }),
}));