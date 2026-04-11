import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js"; 
import { transcribe } from "../controllers/videoCall.controller.js"; 
import { upload } from "../middleware/multer.middleware.js"; 
// import multer from "multer";
// const upload = multer({ dest: "./public/temp" });
const router = express.Router()

router.post("/transcribe", protectRoute, upload.single("audio"), transcribe)
export default router