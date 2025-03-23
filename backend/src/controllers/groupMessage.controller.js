import User from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import { GroupMessage } from "../models/groupMessage.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
// import { uploadOnCloudinary } from "../lib/cloudinary.js";
import { cloudinary } from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { AiMessage } from "../models/aiMessage.model.js";


 

export const createGroup = async (req, res) => {
  try {
    const { name, description, users, profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);


    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" })
    users.forEach(async (u) => {
      const x = await User.findById(u)
      if (!x) return res.status(404).json({ message: "Group user not found " + x })
    })
    const group = await Group.create({
      name,
      description,
      admin: userId,
      profilePic: uploadResponse.url,
      members: [...users, userId]
    })
    if (!group) return res.status(400).json({ message: "Group not created" })
    user.groups.push(group._id);
    await user.save();
    users.forEach(async (u) => {
      const x = await User.findById(u)
      x.groups.push(group._id);
      await x.save();
    })
    return res.status(201).json({ updatedGroups: user.groups })

  } catch (error) {

    console.error("Error in createGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const user = await User.findById(userId);
    const group = await Group.findById(groupId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() != user._id.toString()) return res.status(400).json({ message: "User not admin of group" });
    if (group.users.find(u => u.toString() === userId)) return res.status(400).json({ message: "User already in group" });
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        $set: {
          users: [...group.users, userId],
        },
      },
      { new: true }
    );
    if (!updatedGroup) return res.status(404).json({ message: "User not added to group" });
    return res.status(201).json({ updatedGroup, message: "User added to group successfully" });
  }
  catch (error) {
    console.error("Error in addUserToGroup: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const removeUserFromGroup = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const group = await Group.findById(new mongoose.Types.ObjectId(req.body.groupId));
    const userToRemove = await User.find({ email: req.params.userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!userToRemove) return res.status(404).json({ message: "User to remove not found" });
    if (group.admin.toString() != user._id.toString()) return res.status(400).json({ message: "User not admin of group" });


    const updatedGroup = await Group.findByIdAndUpdate(
      req.body.groupId,
      {
        $set: {
          members: group.members.filter(u => u.toString() !== userToRemove[0]._id.toString()),
        },
      },
      { new: true }
    );

    if (!updatedGroup) return res.status(404).json({ message: "User not removed from group" });
    return res.status(200).json({ updatedGroup, message: "User removed from group successfully" });

  } catch (error) {
    console.error("Error in removeUserFromGroup: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const myId = req.user?._id;

    if (!myId) {
      return res.status(400).json({ error: "User ID is required" });
    }


    let messages = await Message.find(
      { groupId }
    )

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.body;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    } 
    const user = await User.findById(senderId);
    const newMessage = new Message({
      groupId,
      senderId,
      text,
      group: true,
      senderInfo: {
        fullname: user.fullName,
        ai: false,
        profilePic: user.profilePic
      },
      image: imageUrl
    }); 
    await newMessage.save();
    const x = newMessage.toJSON()

    x.senderInfo = { _id: user._id, fullName: user.fullName, email: user.email, profilePic: user.profilePic }


    io.to(groupId).emit("receiveGroupMessage", x);


    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);

    res.status(500).json({ error: "Internal server error" });
  }
};


export const updateGroupProfile = async (req, res) => {
  try {
    const { groupIcon } = req.body;
    const userId = req.user._id;

    if (!groupIcon) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await uploadOnCloudinary(groupIcon);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { groupIcon: uploadResponse.url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

