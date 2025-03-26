import express from "express"
import { checkAuth, login, logout, signup,updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStream } from "../controllers/stream.controller.js";

const router = express.Router()

router.post("/signup",signup);

router.post("/login",login);

router.post("/logout",logout);

router.put("/update-profile", protectRoute, updateProfile)

router.get("/check", protectRoute, checkAuth)

router.get("/get-stream/:id", protectRoute, getStream);


export default router;
