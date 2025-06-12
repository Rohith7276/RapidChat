import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkUrl, endStream, getStream, streamControls } from "../controllers/stream.controller.js";
import { createStream,  getVideoId } from "../controllers/stream.controller.js"; 
import {streamAi } from "../controllers/ai.controller.js"

const router = express.Router()
 
 

router.get("/get-stream/:id", protectRoute, getStream);
router.get("/end-stream/:id", protectRoute, endStream);
router.get("/stream-control/:id/:action/:streamId", protectRoute, streamControls);
router.get("/check-url/",protectRoute, checkUrl);
router.post("/stream-ai", protectRoute, streamAi);
router.post("/create-stream", protectRoute, createStream);

export default router;
