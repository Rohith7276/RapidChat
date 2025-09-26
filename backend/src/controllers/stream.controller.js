import User from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import Stream from "../models/stream.model.js";
import getResponse from "../lib/ai.js";

import fs from 'fs';
import path from 'path';
import { getReceiverSocketId, io } from "../lib/socket.js";
import { cloudinary } from "../lib/cloudinary.js";
import PdfParse from "pdf-parse";
// import { YoutubeTranscript, YoutubeTranscriptDisabledError, YoutubeTranscriptNotAvailableError } from 'youtube-transcript-plus';
import {
    Supadata,
} from '@supadata/js';

// Initialize the client
const supadata = new Supadata({
    apiKey: process.env.youtube,
});

export const getVideoId = async (req, res) => {
    try {
        console.log("hello guys")
        const { friendId, videoId, send } = req.body
        console.log(friendId, videoId, send)
        if (send == "1") {
            const receiverSocketId = getReceiverSocketId(friendId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("takeVideoId", videoId);
                console.log("Sent from send 1" + videoId)
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

export const uploadPdf = async (req, res) => {
    try {
        console.log("upload pdf", req.file)
        const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'raw', // For non-image files like PDFs
        });

        const dataBuffer = fs.readFileSync(req.file.path); // Read PDF file
        const data = await PdfParse(dataBuffer); // Extract text 

        fs.unlinkSync(req.file.path);

        const url = uploadResponse.secure_url;
        return res.status(201).json({ url: url, text: data.text })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Invalid Document" });
    }
}


export const createStream = async (req, res) => {
    try {
        let { title, description, url, data, groupId, name, recieverId, type } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const summary = null;
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!url) return res.status(400).json({ message: "Any one url is required" });

        if (!groupId && !recieverId) {
            return res.status(400).json({ message: "Either groupId or recieverId is required" });
        }

        if (type == "youtube") {
            const transcriptResult = await supadata.transcript({
                url: url,
                // lang: 'en', // optional
                text: true, // optional: return plain text instead of timestamped chunks
                mode: 'auto', // optional: 'native', 'auto', or 'generate'
            });

            // Check if we got a transcript directly or a job ID for async processing
            if ('jobId' in transcriptResult) {
                // For large files, we get a job ID and need to poll for results
                console.log(`Started transcript job: ${transcriptResult.jobId}`);

                // Poll for job status
                const jobResult = await supadata.transcript.getJobStatus(
                    transcriptResult.jobId
                );
                if (jobResult.status === 'completed') {
                    console.log('Transcript:', jobResult.result);
                } else if (jobResult.status === 'failed') {
                    console.error('Transcript failed:', jobResult.error);
                } else {
                    console.log('Job status:', jobResult.status); // 'queued' or 'active'
                }
            } else {
                // For smaller files, we get the transcript directly
                console.log('Transcript:', transcriptResult.content);
            }
            data = transcriptResult.content;
        }
        const group = groupId ? await Group.findById(groupId) : null;

        if (!group) {
            groupId = ""
            const receiver = await User.findById(recieverId);
            recieverId = receiver?._id;
        }
        else {
            groupId = group?._id
        }


        let quizData = null;
        if (type == "youtube" || type == "pdf") {
            quizData = await getResponse(
                `Give me only valid JSON, without any Markdown fences (no \`\`\`), no comments, no trailing commas, no explanations. The JSON must be directly usable with JSON.parse of 10 number of questions for a quiz in format of:
{
	"quiz":[
		{
			"question": "first question", 
			"options": [
				{
					"title": "title", 
				},
				{
					"title": "title", 
				},
				{
					"title": "title", 
				},
				{
					"title": "title", 
				}
			],
			"answer":{
				index: optionIndex,
				title: "title",
				description: "explanation"
			}
		},
		{
			"question": "second question", 
			"options": [
				{
					"title": "title", 
				},
				{
					"title": "title", 
				},
				{
					"title": "title", 
				},
				{
					"title": "title", 
				}
			],
			"answer":{
				index: optionIndex,
				title: "title",
				description: "explanation"
			}
			
		}
	]
}

regarding the information data : ${data}
`

            );
        }
        console.log(quizData)

        const stream = await Stream.create({
            streamerId: userId,
            groupId,
            receiverId: recieverId,
            streamInfo: {
                type,
                name,
                url,
                data,
                title,
                description,
                quizData: quizData,
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

export const checkUrl = async (req, res) => {
    const url = req.query.url;
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const xfo = response.headers.get('x-frame-options');
        const csp = response.headers.get('content-security-policy');

        if (xfo || (csp && csp.includes('frame-ancestors'))) {
            return res.status(400).json({ embeddable: false });
        }

        return res.status(200).json({ embeddable: true });
    } catch (error) {
        return res.status(500).json({ embeddable: false });
    }
}


export const streamControls = async (req, res) => {
    try {
        const { id: friendId, streamId, action } = req.params;
        const userId = req.user._id;
        console.log(friendId, streamId, action);
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
        console.log(streams)
        return res.status(200).json(streams);
    } catch (error) {
        console.error("Error in getStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}
export const getAllStream = async (req, res) => {
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
                $or: [{
                    $and: [{ streamerId: userId }, { receiverId: friend._id }]
                }, {
                    $and: [{ receiverId: userId }, { streamerId: friend._id }]
                }, {
                    groupId: friendId
                },]

            });
        console.log(streams)
        return res.status(200).json(streams);
    } catch (error) {
        console.error("Error in getAllStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}
export const geSpecificStream = async (req, res) => {
    try {
        let { id: streamId } = req.params;

        const streams = await Stream.findOne(
            { _id: streamId });

        const userId = req.user._id;

        let user = await User.findById(userId);
        const stream = await Stream.create({
            streamerId: user._id,
            groupId: streams.groupId,
            receiverId: streams.receiverId,
            streamInfo: streams.streamInfo,
            senderInfo: {
                fullName: user.fullName,
                profilePic: user.profilePic
            },
            summary: streams.summary
        });


        console.log(streams)
        return res.status(200).json(stream);
    } catch (error) {
        console.error("Error in getSpecificStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}



export const endStream = async (req, res) => {
    try {
        console.log("Hi")
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
        console.log(streams)


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
export const updateStream = async (req, res) => {
    try {
        let { id: streamId, points } = req.params;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const stream = await Stream.find(
            { _id: streamId }
        );
        console.log(stream)
        let data = null
        if (stream[0].streamInfo.leaderboard != "") {
            const temp = JSON.parse(stream[0].streamInfo?.leaderboard)
            data = [...temp, { name: user.fullName, points: points, badge: "" }]
        }
        else {
            data = [{ name: user.fullName, points: points, badge: "" }]
        }
        data.sort((a, b) => b.points - a.points);

        for (let index = 0; index < data.length; index++) {
            if (index == 0) {
                data[0].badge = "Gold"
            }
            else if (index == 1) {
                data[1].badge = "Silver"

            }
            else if (index == 2) {
                data[2].badge = "Bronze"

            }
            else{
                data[index].badge = "Keep Learning"
            }
        }

        console.log(data)

        const streams = await Stream.findOneAndUpdate(
            { _id: streamId },
            { $set: { "streamInfo.leaderboard": JSON.stringify(data) } },
            { new: true }
        );
        console.log(streams)
 
        return res.status(200).json(streams);
    } catch (error) {
        console.error("Error in endStream: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}
