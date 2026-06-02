import getResponse from "../lib/ai.js";
import { AiMessage } from "../models/aiMessage.model.js";
import Message from "../models/message.model.js";
import Stream from "../models/stream.model.js";
import { YoutubeTranscript } from 'youtube-transcript';
import { getReceiverSocketId, io } from "../lib/socket.js";
import fs from "fs";
import { getStreamContextForQuestion } from "../lib/rag/similarity.js";
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
  return await AiMessage.findOne({ conversationKey, role: "memory" }).sort({ createdAt: -1 });
};

const getTurnsSinceMemory = async (conversationKey, memoryCreatedAt) => {
  const query = {
    conversationKey,
    role: { $in: ["user", "assistant"] },
  };

  if (memoryCreatedAt) {
    query.createdAt = { $gt: memoryCreatedAt };
  }

  return await AiMessage.find(query).sort({ createdAt: 1 });
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

export const replyAns = async (req, res) => {
  try {
    const question = req.body.question;
    console.log(req.body.question)
     const response = await getResponse("give me only important keywords which helps me to explain the question without any extra text or symantic tags or chars like \\n for : " + question);
     console.log("AI response:", response);
     res.status(200).json({ answer: response });
      return response;
 
  } catch (error) {
    console.error("Error in replyAns: ", error.message);
    res.status(500).json({ error: "Internal server error" });
    return error
  }
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
    console.log("Error in ai chat controller", error?.message);
    return res.status(500).json({ message: "Internal Server Error" });
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
    const { data, input, streamId } = req.body;
    const { receiverId, groupId } = req.body;
    const normalizedInput = String(input || "").trim();

    if (!normalizedInput) {
      return res.status(400).json({ message: "Input is required" });
    }

    let activeStream = null;

    if (streamId) {
      activeStream = await Stream.findById(streamId);
    }

    if (!activeStream && groupId) {
      activeStream = await Stream.findOne({ groupId, stopTime: null }).sort({ createdAt: -1 });
    }

    if (!activeStream && receiverId) {
      activeStream = await Stream.findOne({
        $and: [
          { stopTime: null },
          {
            $or: [
              { receiverId, streamerId: req.user._id },
              { streamerId: receiverId, receiverId: req.user._id },
            ],
          },
        ],
      }).sort({ createdAt: -1 });
    }

    // Resolve the correct stream first so retrieval searches the right in-memory index.
    const streamContext = await getStreamContextForQuestion({
      streamId: activeStream?._id || streamId || `${req.user._id}:${receiverId || groupId || "stream"}`,
      question: normalizedInput,
      topK: Number(process.env.RAG_TOP_K || 4),
      textFallback: activeStream?.streamInfo?.data || data || "",
      transcriptSegmentsFallback: activeStream?.streamInfo?.transcriptSegments || [],
      transcriptChunksFallback: activeStream?.streamInfo?.transcriptChunks || [],
    });

    const retrievalLabel = streamContext.retrievalMode === "timestamp"
      ? `The user asked about the moment at ${streamContext.timestamp}. Answer based on what is happening around that moment in the video.`
      : "Answer using the most relevant context about the video content.";

    const retrievedChunksText = streamContext.context || (streamContext.chunks.length
      ? streamContext.chunks
          .map((chunk) => `Transcript excerpt ${chunk.index + 1} (score: ${chunk.score.toFixed(4)}):\n${chunk.text}`)
          .join("\n\n")
      : "No relevant transcript excerpt was found.");

    const response = await runAiConversation({
      input: normalizedInput,
      senderId: req.user._id,
      receiverId,
      groupId,
      referenceData: [
        `You are Rapid AI, a helpful assistant discussing this video with the user.`,
        `Answer naturally, clearly, and briefly in a conversational tone.`,
        `Speak as if you understand the video content directly.`,
        `Do not mention transcript excerpts, backend details, embeddings, chunks, retrieval, context windows, or system internals.`,
        `If the user asks about a timestamp, explain what is happening around that moment and mention the timestamp clearly.`,
        `If exact moment coverage is limited, use the nearest relevant moment confidently without exposing retrieval limitations.`,
        `If information is truly unavailable, say you do not have enough information from this video yet.`,
        `Stream title: ${activeStream?.streamInfo?.title || "Untitled stream"}`,
        retrievalLabel,
        `Video context:\n${retrievedChunksText}`,
      ].join("\n\n"),
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
    const responsePayload = {
      ...newMessage.toJSON(),
      answer: response,
      timestamp: streamContext.retrievalMode === "timestamp" ? (streamContext.timestamp || null) : null,
      timestampSeconds: streamContext.retrievalMode === "timestamp" ? (streamContext.seconds ?? null) : null,
      aiMetadata: {
        retrievalMode: streamContext.retrievalMode || "semantic",
      retrievalSource: streamContext.retrievalSource || null,
        timestamp: streamContext.retrievalMode === "timestamp" ? (streamContext.timestamp || null) : null,
        timestampSeconds: streamContext.retrievalMode === "timestamp" ? (streamContext.seconds ?? null) : null,
        matchedTimestamp: streamContext.matchedTimestamp || null,
        matchedSeconds: streamContext.matchedSeconds ?? null,
        context: streamContext.context || "",
      },
    };

    res.status(200).json(responsePayload);
  }
  catch (error) {
    console.log("Error in ai stream controller", error?.message);
    return res.status(500).json({ message: "Internal Server Error" });
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