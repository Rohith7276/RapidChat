import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
// import Redis from "ioredis";
import pdfParse from "pdf-parse";

// const redis = new Redis({
//   host: "localhost", // Change to your Redis server if needed
//   port: 6379,
// });

// redis.on("connect", () => console.log("🚀 Redis connected!"));
// redis.on("error", (err) => console.error("❌ Redis Error:", err));

// export default redis;

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/groupMessage.route.js";
import { app, server } from "./lib/socket.js";
import multer from "multer"; 

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({limit: "50mb"}))

app.use(express.urlencoded({extended: true, limit: "50mb"}))
//this creates a public folder in our server which is used to store files like images and pdf, etc
app.use(express.static("public"))
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


app.use("/uploads", express.static("uploads")); // Serve uploaded PDFs
// Multer Storage for PDFs
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload PDF API
app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
  const x = path.join(__dirname, req.file.path); 
  const dataBuffer = fs.readFileSync(x); // Read PDF file
  let data = await pdfParse(dataBuffer); // Extract text
  // console.log("Extracted Text:", data.text);
  // const aiSum = await AiSummary(data.text)
  // console.log(aiSum);
  data = data.text.slice(0, 5980) 
  res.json({ fileUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`, fileName: req.file.filename, pdfText: data });
});



app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("🖥️ Server is running on PORT:" + PORT);
  connectDB();
});