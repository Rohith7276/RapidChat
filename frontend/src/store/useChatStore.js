import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { io } from "socket.io-client";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: true,
  streamMode: false,
  isMessagesLoading: false,
  sidebarRefresh: true,
  isUserMessageLoading: false,
  streamData: [],
  streamSet: false,
  getNotifications: async () => {
    const socket = useAuthStore.getState().socket;

    socket.on("notification", () => {
      set({ sidebarRefresh: true })

    }
    )
  },
  getStreamCreation: async () => {
    const socket = useAuthStore.getState().socket;

    socket.on("stream", (data) => {
      console.log('streamset', data)
      if(data.stopTime ==null) {
      set({streamData:data })

      set({streamSet: true})
      }
      else{
      set({streamData: [] })

      set({ streamSet: false })
      }
    }
    )
  },

  getUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: [...res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addFriend: async (friendId) => {
    try {
      const res = await axiosInstance.patch(`/messages/add-friend/${friendId}`);
      set({ users: res.data.updatedFriends });
      toast.success("Friend added successfully");
      set({ sidebarRefresh: true })
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  removeFriend: async (friendId) => {
    try {
      const res = await axiosInstance.patch(`/messages/add-friend/${friendId}`);
      set({ users: res.data.updatedFriends });
      toast.success("Friend removed successfully");
      set({ sidebarRefresh: true })
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },


  createGroup: async (groupData) => {
    try {
      const { groups } = get();
      const res = await axiosInstance.post("/groups/create-group", groupData);
      set({ groups: res.data.updatedGroups });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.data.message);
    }
  },

  getMessages: async (user, page) => {
    if (page == 1) set({ isMessagesLoading: true });
    try {
      let res
      if (user.fullName === undefined) res = await axiosInstance.get(`/groups/get-group-messages/${user._id}`);
      else res = await axiosInstance.get(`/messages/${user._id}/${page}`);

      // const stream = await axiosInstance.get(`/auth/get-stream/${user._id}`);
      // console.log("stream",stream)
      if (res.data != null)
        set({ messages: res.data });
      //   set({ streamData: stream.data });
      // }
    } catch (error) {
      toast.error(error.response?.message || "An error occurred while fetching messages.");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getAiMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      let res = {};
      if (selectedUser.fullName !== undefined)
        res = await axiosInstance.post(`/messages/ai-chat`, { ...messageData, receiverId: selectedUser._id, groupId: null });
      else
        res = await axiosInstance.post(`/messages/ai-chat`, { ...messageData, receiverId: null, groupId: selectedUser._id });
      const newMes = { ...res.data, _id: "1", senderId: "67af8f1706ba3b36e9679f9d", senderInfo: { fullName: "Rapid AI", profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg" } };

      set({ messages: [...messages, newMes] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  getStreamAiMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      let res = {};
      if (selectedUser.fullName !== undefined){

        const { streamData } = get();
        console.log("streamData", streamData)
        res = await axiosInstance.post(`/messages/stream-ai`, { ...messageData, data: streamData?.streamInfo?.pdfData?.slice(0, 5800), receiverId: selectedUser._id, groupId: null });
      }
      else
        res = await axiosInstance.post(`/messages/stream-ai`, { ...messageData, receiverId: null, groupId: selectedUser._id });
      const newMes = { ...res.data, _id: "1", senderId: "67af8f1706ba3b36e9679f9d", senderInfo: { fullName: "Rapid AI", profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg" } };

      set({ messages: [...messages, newMes] });
    } catch (error) {
      toast.error("error in getting stream ai message" + error);
    }
  },


  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    set({ isUserMessageLoading: true });
    try {
      let res;
      if (selectedUser.name !== undefined)
        res = await axiosInstance.post(`/groups/send-group-message`, { ...messageData, groupId: selectedUser._id });
      else res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);

      set({ messages: [...messages, res.data] });
      set({ sidebarRefresh: true })

    } catch (error) {
      toast.error(error.response.data.message);
    }
    finally {
      set({ isUserMessageLoading: false });
    }
  },
  sendImage: async (messageData) => {
    const { selectedUser, messages } = get();

    try {
      const res = await axiosInstance.post(`/messages/send-image/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      set({ sidebarRefresh: true })

    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  createStream: async (data) => {
    try {
      const res = await axiosInstance.post("/messages/create-stream", data);

      set({ streamData: res.data });

      toast.success("Stream created successfully" + res.data);
    }
    catch (error) {
      toast.error("Couldn't create the stream");
    }
  },

  getStream: async () => {
    try{
    const { selectedUser } = get();

    const res = await axiosInstance.get(`/auth/user/get-stream/${selectedUser._id}`)

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
      const { selectedUser } = get();
      const res = await axiosInstance.get(`/auth/user/end-stream/${selectedUser._id}`)
      console.log("here ", res.data)
      toast.success("Stream ended successfully");
    } catch (error) {
      toast.error("Couldn't end the stream");

    }
  },

  subscribeToGroup: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    socket.emit("joinGroup", { groupId: selectedUser._id, userId: authUser._id });

    socket.on("receiveGroupMessage", (newMessage) => {
      set({ sidebarRefresh: true })
      const isMessageSentFromSelectedUser = (newMessage.groupId === selectedUser._id);
      if (!isMessageSentFromSelectedUser) {
        return;
      }
      set({
        messages: [...get().messages, newMessage],
      });
    })
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;


    socket.on("newMessage", (newMessage) => {
      set({ sidebarRefresh: true })

      const isMessageSentFromSelectedUser = (newMessage.senderId === selectedUser._id);
      if (!isMessageSentFromSelectedUser) {
        return;
      }
      set({
        messages: [...get().messages, newMessage],
      });

    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (selectedUser?.fullName) socket.off("newMessage");
    else socket.off("receiveGroupMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setSidebarRefresh: (booleanVal) => set({ sidebarRefresh: booleanVal }),
  setStreamMode: (booleanVal) => set({ streamMode: booleanVal }),
  setStreamData: (data) => set({ streamData: data }),
}));