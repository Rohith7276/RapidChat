import getResponse from "../lib/ai.js";
import { AiMessage } from "../models/aiMessage.model.js";
import Message from "../models/message.model.js";
import { YoutubeTranscript } from 'youtube-transcript';
import { getReceiverSocketId, io } from "../lib/socket.js";
import fs from "fs";
// import pdfParse from "pdf-parse";

const AI_MEMORY_TRIGGER_TURNS = 12;
const AI_MEMORY_RECENT_TURNS = 8;

const buildConversationKey = ({ senderId, receiverId, groupId }) => {
  if (groupId) {
    return `group:${groupId}`;
  }

  const participants = [String(senderId), String(receiverId)].sort();
  return `direct:${participants.join(":")}`;
};

const saveAiTurn = async ({ conversationKey, text, role, senderId, receiverId, groupId }) => {
  return AiMessage.create({
    conversationKey,
    text,
    role,
    senderId,
    receiverId,
    groupId,
  });
};

const getLatestMemory = async (conversationKey) => {
  return AiMessage.findOne({ conversationKey, role: "memory" }).sort({ createdAt: -1 });
};

const getTurnsSinceMemory = async (conversationKey, memoryCreatedAt) => {
  const query = {
    conversationKey,
    role: { $in: ["user", "assistant"] },
  };

  if (memoryCreatedAt) {
    query.createdAt = { $gt: memoryCreatedAt };
  }

  return AiMessage.find(query).sort({ createdAt: 1 });
};

const buildCompletionMessages = ({ memorySummary, turns, referenceData }) => {
  const normalizedReferenceData =
    typeof referenceData === "string"
      ? referenceData
      : referenceData
        ? JSON.stringify(referenceData, null, 2)
        : "";

  const systemParts = [
    "You are Rapid AI.",
    "Use the long-term memory if it is relevant to the current conversation.",
    memorySummary ? `Long-term memory:\n${memorySummary}` : "Long-term memory: none yet.",
  ];

  if (normalizedReferenceData) {
    systemParts.push(`Reference data:\n${normalizedReferenceData}`);
  }

  return [
    {
      role: "system",
      content: systemParts.join("\n\n"),
    },
    ...turns.map((turn) => ({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: turn.text,
    })),
  ];
};

const summarizeConversation = async ({ conversationKey, senderId, receiverId, groupId, turns, existingSummary }) => {
  if (!turns.length) {
    return existingSummary || "";
  }

  const snippet = turns
    .map((turn) => `${turn.role === "assistant" ? "AI" : "User"}: ${turn.text}`)
    .join("\n");

  const summaryPrompt = [
    {
      role: "system",
      content:
        "You compress conversation history into a short memory summary. Keep only durable facts, preferences, goals, names, unresolved tasks, and important context. Ignore filler, greetings, and repeated phrases. Return plain text only.",
    },
    {
      role: "user",
      content: [
        `Existing memory:\n${existingSummary || "none"}`,
        `New conversation:\n${snippet}`,
        "Updated memory:",
      ].join("\n\n"),
    },
  ];

  const summary = await getResponse(summaryPrompt, {
    max_tokens: 350,
    temperature: 0.2,
  });

  if (!summary) {
    return existingSummary || "";
  }

  await AiMessage.create({
    conversationKey,
    text: summary,
    role: "memory",
    senderId,
    receiverId,
    groupId,
  });

  return summary;
};

const runAiConversation = async ({ input, senderId, receiverId, groupId, referenceData = "" }) => {
  const conversationKey = buildConversationKey({ senderId, receiverId, groupId });

  await saveAiTurn({
    conversationKey,
    text: input,
    role: "user",
    senderId,
    receiverId,
    groupId,
  });

  const latestMemory = await getLatestMemory(conversationKey);
  const turnsSinceMemory = await getTurnsSinceMemory(conversationKey, latestMemory?.createdAt);
  const recentTurns = turnsSinceMemory.slice(-AI_MEMORY_RECENT_TURNS);

  const response = await getResponse(
    buildCompletionMessages({
      memorySummary: latestMemory?.text || "",
      turns: recentTurns,
      referenceData,
    }),
    {
      max_tokens: referenceData ? 1500 : 1200,
      temperature: 0.7,
    }
  );

  await saveAiTurn({
    conversationKey,
    text: response,
    role: "assistant",
    senderId,
    receiverId,
    groupId,
  });

  const refreshedTurns = await getTurnsSinceMemory(conversationKey, latestMemory?.createdAt);
  if (refreshedTurns.length >= AI_MEMORY_TRIGGER_TURNS) {
    const turnsToSummarize = refreshedTurns.slice(0, Math.max(0, refreshedTurns.length - AI_MEMORY_RECENT_TURNS));
    await summarizeConversation({
      conversationKey,
      senderId,
      receiverId,
      groupId,
      turns: turnsToSummarize,
      existingSummary: latestMemory?.text || "",
    });
  }

  return response;
};

export const AiChat = async (req, res) => {
  try {
    const { input, receiverId, groupId } = req.body;
    const normalizedInput = String(input || "").trim();

    if (!normalizedInput) {
      return res.status(400).json({ message: "Input is required" });
    }

    // let text = `You are an chat app Rapid AI named Rapid AI. A user named ${user} sent ${input} to you, reply accordingly`;
    const response = await runAiConversation({
      input: normalizedInput,
      senderId: req.user._id,
      receiverId,
      groupId,
    });

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
  } catch (error) { 
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// export const AiSummary = async(youtubeUrl, data)=>{
export const AiSummary = async (x, isPdf) => {
  try {
    if (!isPdf) {

      const youtubeId = youtubeUrl.split('v=')[1].split('&')[0];
      async function getYouTubeTranscript(videoId) {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map(entry => entry.text).join(" ");
      }
      return await getYouTubeTranscript(youtubeId)
    } 
    else{
      const text = x
      const response = await getResponse("here the notes\n" + text + "\n give me some questions to solve");
      return response;
    } 
  }
  catch (error) { 
    return { message: "Internal Server Error" };
  }
}

export const streamAi = async (req, res) => {
  try {
    const { data, input } = req.body
    const { receiverId, groupId } = req.body;  
    const normalizedInput = String(input || "").trim();

    if (!normalizedInput) {
      return res.status(400).json({ message: "Input is required" });
    }

    const response = await runAiConversation({
      input: normalizedInput,
      senderId: req.user._id,
      receiverId,
      groupId,
      referenceData: data,
    });

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
    console.log("Error in ai stream controller", error?.message);
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