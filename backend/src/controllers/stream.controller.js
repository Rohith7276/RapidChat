import User from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import Stream from "../models/stream.model.js";
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

        const pdfUrl = uploadResponse.secure_url;
        return res.status(201).json({ url: pdfUrl, text: data.text })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Invalid Document" });
    }
}
 

export const createStream = async (req, res) => {
    try { 
        let { title, description, pdfUrl, pdfData, videoUrl, groupId, pdfName, recieverId, type } = req.body;
        const userId = req.user._id;
        const user = await User.findById(userId);
        const summary = null;
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!videoUrl && !pdfUrl) return res.status(400).json({ message: "Any one url is required" });

        if (!groupId && !recieverId) {
            return res.status(400).json({ message: "Either groupId or recieverId is required" });
        }

        if (type == "youtube") {
            const transcriptResult = await supadata.transcript({
                url: videoUrl,
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
            pdfData = transcriptResult.content;
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

        // console.log(title, description, videoUrl, groupId, recieverId, userId, summary, user.fullName, user.profilePic);
        const stream = await Stream.create({
            streamerId: userId,
            groupId,
            receiverId: recieverId,
            streamInfo: {
                type,
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

// In Next.js API Route (pages/api/check-url.ts)
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
