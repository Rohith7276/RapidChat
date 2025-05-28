import getResponse from "../lib/ai.js";
import { AiMessage } from "../models/aiMessage.model.js";
import Message from "../models/message.model.js";
import { YoutubeTranscript } from 'youtube-transcript';
import { getReceiverSocketId, io } from "../lib/socket.js";
import fs from "fs";
// import pdfParse from "pdf-parse";
export const AiChat = async (req, res) => {
  try {
    const { input, receiverId, groupId } = req.body;
    // let text = `You are an chat app Rapid AI named Rapid AI. A user named ${user} sent ${input} to you, reply accordingly`;
    let text = input
    const response = await getResponse(text);


    const newMessage = new Message({
      text: response,
      type: "ai",
      groupId,
      senderInfo: {
        fullName: "RapidAI",
        ai: true,
        profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg",
      },
      senderId: req.user._id,
      receiverId
    });

    await newMessage.save();

    let msg = newMessage.toJSON();
    console.log("hgfdiiiiiii")
    console.log(groupId)
    if (groupId == null) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", msg);
        console.log("hiiiiiii")
      }
    }
    else {
      io.to(groupId).emit("receiveGroupMessage", msg);
    }
    res.status(200).json(newMessage);
  } catch (error) {
    console.log("Error in ai chat controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// export const AiSummary = async(youtubeUrl, pdfData)=>{
export const AiSummary = async (x) => {
  try {
    // const youtubeId = youtubeUrl.split('v=')[1].split('&')[0]; 
    // async function getYouTubeTranscript(videoId) { 
    //     const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    //     return transcript.map(entry => entry.text).join(" ");
    // }

    // const text = await getYouTubeTranscript(youtubeId)
    const text = x
    const response = await getResponse("here the notes\n" + text + "\n give me some questions to solve");
    console.log(response)
    return response;
  }
  catch (error) {
    console.log("Error in ai summary controller", error?.message);
    return { message: "Internal Server Error" };
  }
}

export const streamAi = async (req, res) => {
  try {
    const { data, input } = req.body
    const { receiverId, groupId } = req.body;
    // let text = `You are an chat app Rapid AI named Rapid AI. A user named ${user} sent ${input} to you, reply accordingly`;
   

    const response = await getResponse(input + "\nhere is the pdf text for reference:\n" + data  );

    const newMessage = new Message({
      text: response,
      type: "ai",
      groupId,
      senderInfo: {
        fullName: "RapidAI",
        ai: true,
        profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg",
      },
      senderId: req.user._id,
      receiverId
    });

    await newMessage.save();

    let msg = newMessage.toJSON();
    if (groupId == null) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", msg);
      }
    }
    else {
      io.to(groupId).emit("receiveGroupMessage", msg);
    }
    res.status(200).json(newMessage);
  }
  catch (error) {
    console.log("Error in ai summary controller", error?.message);
    return { message: "Internal Server Error" };
  }
}


// export const extractTextFromPDF = async (filePath) => {
//   try {
//     const dataBuffer = fs.readFileSync(filePath); // Read PDF file
//     const data = await pdfParse(dataBuffer); // Extract text
//     console.log("Extracted Text:", data.text);
//   } catch (error) {
//     console.error("Error extracting text:", error);
//   }
// };