import express from "express"
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { addFriend, removeFriend } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router()

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);
router.patch("/add-friend/:email", protectRoute, addFriend);

router.put("/update-profile", protectRoute, updateProfile)

router.get("/check", protectRoute, checkAuth)

router.patch("/remove-friend/:email", protectRoute, removeFriend);


export default router;
