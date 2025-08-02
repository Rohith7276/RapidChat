import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import Peer from 'peerjs';
import { useChatStore } from "./useChatStore.js";

// const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : import.meta.env.VITE_API_BASE_URL +"/";
const BASE_URL = import.meta.env.VITE_API_BASE_URL + "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  peer: null,
  peerId: null,
  friendPeerId: null,
  callerName: null,
  removePeerId: () => {
    set({ friendPeerId: null })
  },
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check"); 
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getPeerId: () => {
    const user = useChatStore.getState().selectedUser;
    const authUser = get().authUser
    const socket1 = get().socket;

    console.log("calling");
    if (user.name !== undefined) {
      socket1.emit('get-peer-id', user, authUser, true);

    }
    else
      socket1.emit('get-peer-id', user._id, authUser, false);

  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });
    console.log("socket", socket)
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on('send-local-peer-id', (data, callback) => {
      console.log("sending local peer id");

      const peerId = get().peerId;
      callback(peerId)

    });

    socket.on('get-local-peer-id', (requesterSocketId, name) => {
      set({ callerName: name.fullName })
      const setSelectedUser = useChatStore.getState().setSelectedUser
      const setVideoCall = useChatStore.getState().setVideoCall
      setSelectedUser({ ...name })
      setVideoCall(true)

      console.log("getting local peer id", requesterSocketId);
      const peerId = get().peerId
      console.log("this is peerid", peerId)
      //  callback(peerId)
      const socket1 = get().socket;

      socket1.emit('send-peer-id', peerId, requesterSocketId);

    });
    socket.on('take-peer-id', (data) => {
      console.log("taking peer id here", data);
      set({ friendPeerId: data })
    })
    const p = new Peer();
    set({ peer: p });
    p.on('open', (id) => {
      set({ peerId: id });
      console.log("do now")
    });




  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));