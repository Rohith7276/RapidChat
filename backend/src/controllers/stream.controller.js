import User from "../models/user.model.js";
import { Group } from "../models/group.model.js"; 
import Stream from "../models/stream.model.js";
import { AiSummary } from "./ai.controller.js";



 

export const createStream = async (req, res) => {
    try {
        let { title, description, videoUrl, groupId, receiverId } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const summary = await AiSummary(videoUrl);
        console.log("hi")
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!summary) return res.status(400).json({ message: "Summary not generated" });
        if (!videoUrl) return res.status(400).json({ message: "Video url is required" });

        if (!groupId && !receiverId) {
            return res.status(400).json({ message: "Either groupId or receiverId is required" });
        }
        const group = groupId ? await Group.findById(groupId) : null;
        if (!group){ 
            groupId = ""
            const receiver = await User.findById(receiverId);
            receiverId = receiver._id;
        }
        else {
            groupId = group._id
        }
        // console.log(title, description, videoUrl, groupId, receiverId, userId, summary, user.fullName, user.profilePic);
        const stream = await Stream.create({
            streamerId: userId,
            groupId,
            receiverId,
            streamInfo: {
                videoUrl,
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
        return res.status(201).json(stream);
    }
    catch (err) {
        console.error("Error in createStream: ", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getStream = async (req, res) => {
    try {
        const { id: friendId } = req.params;
        const userId = req.user._id;
        console.log("hi");
        console.log(friendId)
        if (!friendId) {
            return res.status(400).json({ message: "ID parameter is required" });
        }
           
        console.log(friendId);
        const streams = await Stream.find(
            {$and: [{ 
                $or: [{ 
                    $and: [{streamerId: userId }, {receiverId: friendId}]}, { 
                    $and: [{receiverId: userId }, {streamerId: friendId}]},  {
                    groupId: friendId}, ] }, {
                stopTime: null}]}); 
        return res.status(200).json(streams);
    } catch (error) {
        console.error("Error in getStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}