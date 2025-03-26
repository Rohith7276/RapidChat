import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  console.log(socket.id)
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;


   

    // Answering the call
    socket.on("answer-call", (data) => {
      console.log(`✅ Call answered by ${data.to}`);
    
      io.to(data.to).emit("call-accepted", data.signal);
    });




  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  
  socket.on("joinGroup", ({ groupId, userId }) => {
    socket.join(groupId);
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} joined group ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});


export { io, app, server };