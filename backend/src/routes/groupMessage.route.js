import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js"; 
import { upload } from "../middleware/multer.middleware.js";

import {  createGroup, removeUserFromGroup, getGroupMessages, sendGroupMessage } from "../controllers/groupMessage.controller.js";
import { CacheMiddleware } from "../middleware/CacheMiddleware.js";

const router = express.Router();

router.post("/create-group",protectRoute, createGroup)
router.patch("/remove-user", protectRoute, removeUserFromGroup) 
router.get("/get-group-messages/:id", protectRoute,CacheMiddleware, getGroupMessages)
router.post("/send-group-message",protectRoute, sendGroupMessage)
// router.post("/send/:id",protectRoute,sendMessage) // protectRoute ensures that unautheticated user can't access this request.
// router.patch("/add-friend", protectRoute, addFriend);
// router.route("/send-image/:id").post(protectRoute, upload.single("image"), sendImage)

export default router;