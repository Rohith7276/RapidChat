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
  isUsersLoading: false,
  isMessagesLoading: false,
  isUserMessageLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: [...res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getGroups: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/groups/get-groups");
      set({ groups: [...res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  addFriend: async (friendId) => {
    try {
      const res = await axiosInstance.patch(`/messages/add-friend/${friendId}`);
      set({ users: [...users, res.data.updatedUser] });
      toast.success("Friend added successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },


  createGroup: async (groupData) => {
    try {
      const { groups } = get();
      const res = await axiosInstance.post("/groups/create-group", groupData);
      set({ groups: [...groups, res.data.group._id] });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.data.message);
    }
  },

  getMessages: async (user, page) => {
    if (page == 1) set({ isMessagesLoading: true });
    console.log(user, page)
    try {
      let res
      if (user.fullName === undefined) res = await axiosInstance.get(`/groups/get-group-messages/${user._id}`);
      else res = await axiosInstance.get(`/messages/${user._id}`);
      console.log(page);
      if (res.data != null) {
        // console.log(res.data)
        res.data = [...res.data, ...get().messages];
        console.log(res.data)
        set({ messages: res.data }); 
      }
    } catch (error) {
      toast.error(error.response.data.message);
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


  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    set({ isUserMessageLoading: true });
    try {
      let res;
      if (selectedUser.name !== undefined)
        res = await axiosInstance.post(`/groups/send-group-message`, { ...messageData, groupId: selectedUser._id });
      else res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
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
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToGroup: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    socket.emit("joinGroup", { groupId: selectedUser._id, userId: authUser._id });

    socket.on("receiveGroupMessage", (newMessage) => {
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
}));