import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsers,getMessages,sendMessage, addFriend, removeFriend } from "../controllers/message.controller.js"; 
import { AiChat, AiSummary, streamAi } from "../controllers/ai.controller.js";
import { createStream, getStream } from "../controllers/stream.controller.js"; 
// import  {CacheMiddleware}  from "../middleware/CacheMiddleware.js";
const router = express.Router();

router.get("/users",protectRoute,getUsers);
router.post("/send/:id",protectRoute,sendMessage);
router.patch("/add-friend/:email", protectRoute, addFriend);
router.patch("/remove-friend/:email", protectRoute, removeFriend);
router.post("/ai-chat", protectRoute, AiChat);
router.post("/ai-summary", protectRoute, AiSummary);
router.post("/stream-ai", protectRoute, streamAi);
router.post("/create-stream", protectRoute, createStream);
router.get("/:id/:page",protectRoute,  getMessages);
export default router;