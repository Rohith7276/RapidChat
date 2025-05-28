import User from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import Stream from "../models/stream.model.js";
import fs from 'fs';
import path from 'path';
import { getReceiverSocketId, io } from "../lib/socket.js";



export const getVideoId = async (req, res) => {
    try {
        console.log("hello guys")
        const { friendId, videoId, send } = req.body
        console.log(friendId, videoId, send)
        if (send == "1") {
            const receiverSocketId = getReceiverSocketId(friendId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("takeVideoId", videoId); 
                console.log("Sent from send 1"+videoId)
            }
        }
        else {
            const receiverSocketId = getReceiverSocketId(friendId);
            console.log(receiverSocketId)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("giveVideoId"); 
                console.log("Sent from send 0")
            }
        }
    } catch (error) {
        console.log("Error in getVideoId controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const createStream = async (req, res) => {
    try {
        let { title, description, pdfUrl, pdfData, videoUrl, groupId, pdfName, recieverId } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const summary = null;
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!videoUrl && !pdfUrl) return res.status(400).json({ message: "Any one url is required" });

        if (!groupId && !recieverId) {
            return res.status(400).json({ message: "Either groupId or recieverId is required" });
        }
        const group = groupId ? await Group.findById(groupId) : null;
        console.log("ye deko", recieverId)
        if (!group) {
            groupId = ""
            const receiver = await User.findById(recieverId);
            recieverId = receiver?._id;
        }
        else {
            groupId = group?._id
        }
        console.log("hi")
        let isPdf = "video"
        if (pdfUrl) isPdf = "pdf"

        // console.log(title, description, videoUrl, groupId, recieverId, userId, summary, user.fullName, user.profilePic);
        const stream = await Stream.create({
            streamerId: userId,
            groupId,
            receiverId: recieverId,
            streamInfo: {
                type: isPdf,
                videoUrl,
                pdfName,
                pdfUrl,
                pdfData,
                title,
                description
            },
            senderInfo: {
                fullName: user.fullName,
                profilePic: user.profilePic
            },
            summary
        });
        if (!stream) return res.status(400).json({ message: "Stream not created" });
        const receiverSocketId = getReceiverSocketId(recieverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stream", stream);
        }

        return res.status(201).json(stream);
    }
    catch (err) {
        console.error("Error in createStream: ", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const streamControls = async (req, res) => {
    try {
        const { id: friendId, streamId, action } = req.params;
        const userId = req.user._id;
        let friend = await User.findById(friendId);
        if (!friend) {
            friend = await Group.findById(friendId)
        }
        if (!friend) return res.status(404).json({ message: "Friend not found" });
        
        const stream = await Stream.findById(streamId);
        const receiverSocketId = getReceiverSocketId(friend._id);
        console.log(userId, friendId)
        if (!stream) return res.status(400).json({ message: "Stream not found" });

        if (!receiverSocketId) {
            return res.status(400).json({ message: "Streamer is offline" });
        }
        io.to(receiverSocketId).emit("streamControls", action, stream, userId);
        return res.status(200).json({ message: "Stream action sent" });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getStream = async (req, res) => {
    try {
        let { id: friendId } = req.params;
        const userId = req.user._id;
        if (!friendId) {
            return res.status(400).json({ message: "ID parameter is required" });
        }
        let friend = await User.findById(friendId);
        if (!friend) {
            friend = await Group.findById(friendId)
        }
        if (!friend) return res.status(404).json({ message: "Friend not found" });
        const streams = await Stream.find(
            {
                $and: [{
                    $or: [{
                        $and: [{ streamerId: userId }, { receiverId: friend._id }]
                    }, {
                        $and: [{ receiverId: userId }, { streamerId: friend._id }]
                    }, {
                        groupId: friendId
                    },]
                }, {
                    stopTime: null
                }]
            });
        return res.status(200).json(streams);
    } catch (error) {
        console.error("Error in getStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}


export const endStream = async (req, res) => {
    try {
        let { id: friendId } = req.params;
        const userId = req.user._id;
        if (!friendId) {
            return res.status(400).json({ message: "ID parameter is required" });
        }
        let friend = await User.findById(friendId);
        if (!friend) {
            friend = await Group.findById(friendId)
        }
        if (!friend) return res.status(404).json({ message: "Friend not found" });

        const streams = await Stream.findOneAndUpdate(
            {
                $and: [
                    {
                        $or: [
                            { $and: [{ streamerId: userId }, { receiverId: friend._id }] },
                            { $and: [{ receiverId: userId }, { streamerId: friend._id }] },
                            { groupId: friendId }
                        ]
                    },
                    { stopTime: null }
                ]
            },
            { $set: { stopTime: new Date() } },
            { new: true }
        );

        if (streams && streams.streamInfo) {
            const fileUrl = streams.streamInfo.type === "pdf" ? streams.streamInfo.pdfUrl : "";
            if (fileUrl != "") {
                const filePath = path.resolve('uploads', path.basename(fileUrl));
                fs.unlink(filePath, (err) => {
                    if (err) {
                        return res.status(500).json({ error: "Error deleting file" });
                    }
                });
            }
        }
        const receiverSocketId = getReceiverSocketId(friendId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stream", streams);
        }
        return res.status(200).json(streams);
    } catch (error) {
        console.error("Error in endStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}
