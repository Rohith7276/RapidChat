import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkUrl, endStream, geSpecificStream, getAllStream, getStream, streamControls, updateStream, uploadPdf } from "../controllers/stream.controller.js";
import { createStream,  getVideoId } from "../controllers/stream.controller.js"; 
import {streamAi } from "../controllers/ai.controller.js"
import { upload } from "../middleware/multer.middleware.js"; 
const router = express.Router()
 
 
router.post("/uploadPdf", protectRoute, upload.single("pdf"), uploadPdf)
router.get("/get-stream/:id", protectRoute, getStream);
router.get("/get-all-stream/:id", protectRoute, getAllStream);
router.get("/get-specific-stream/:id", protectRoute, geSpecificStream);
router.get("/end-stream/:id", protectRoute, endStream);
router.get("/update-stream/:id/:points", protectRoute, updateStream);
router.get("/stream-control/:id/:action/:streamId", protectRoute, streamControls);
router.get("/check-url/",protectRoute, checkUrl);
router.post("/stream-ai", protectRoute, streamAi);
router.post("/create-stream", protectRoute, createStream);

export default router;
