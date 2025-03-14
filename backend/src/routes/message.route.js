import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsers,getMessages,sendMessage, addFriend } from "../controllers/message.controller.js"; 
import { AiChat } from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/users",protectRoute,getUsers);
router.get("/:id",protectRoute,getMessages);
router.post("/send/:id",protectRoute,sendMessage);
router.patch("/add-friend/:id", protectRoute, addFriend);
router.post("/ai-chat", protectRoute, AiChat);

export default router;