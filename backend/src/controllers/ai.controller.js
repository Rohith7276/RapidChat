import getResponse from "../lib/ai.js";
import { AiMessage } from "../models/aiMessage.model.js";
import Message from "../models/message.model.js";
import { YoutubeTranscript } from 'youtube-transcript';
import { getReceiverSocketId, io } from "../lib/socket.js";

export const AiChat = async (req, res) => {
    try {
        const { input, receiverId, groupId  } = req.body;  
        // let text = `You are an chat app Rapid AI named Rapid AI. A user named ${user} sent ${input} to you, reply accordingly`;
        let text = input
        const response = await getResponse(text);
         

        const newMessage = new Message({ 
            text: response,
            type: "ai",
            groupId,
            senderInfo:{
              fullName: "RapidAI",
              ai: true,
              profilePic: "https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg",
            },
            senderId: req.user._id,
            receiverId
        });

        await newMessage.save();

        let msg = newMessage.toJSON();
       
        if(groupId ==""){const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", msg);
        } }
        else{       
          io.to(groupId).emit("receiveGroupMessage", msg);
        }
        res.status(200).json(newMessage);
    } catch (error) {
        console.log("Error in ai chat controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const AiSummary = async(youtubeUrl)=>{
  try{    
    const youtubeId = youtubeUrl.split('v=')[1].split('&')[0]; 
    async function getYouTubeTranscript(videoId) { 
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map(entry => entry.text).join(" ");
    }
    
    const text = await getYouTubeTranscript(youtubeId)
    const response = await getResponse("Summarize this video lecture from YouTube with full information in details :\n" + text.slice(0, 5980));

   return response;
  }
  catch{
    console.log("Error in ai summary controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}