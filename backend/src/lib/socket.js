import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
const app = express();
const server = http.createServer(app);
app.use(
  cors({ 
    // origin: process.env.CORS_ORIGIN,
    origin: "https://rapid-chat-five.vercel.app",
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     credentials: true,
    // origin: "http://localhost:5173",
  })
);
const io = new Server(server, {
  cors: {
    origin: [process.env.CORS_ORIGIN],
    // origin: ["https://rapid-chat-five.vercel.app"],
    // origin: ["http://localhost:5173"],
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




  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));


  socket.on("joinGroup", ({ groupId, userId }) => {
    socket.join(groupId);
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} joined group ${groupId}`);
  });

  socket.on('get-peer-id', (userId, name, group) => {
    console.log("getting peer id", group);

    if (!group) {
      const requesterSocketId = socket.id;
      const receiverSocketId = getReceiverSocketId(userId);
      console.log(requesterSocketId)
      // Ask the receiver for their peer ID, and pass along who’s asking
      io.to(receiverSocketId).emit('get-local-peer-id', requesterSocketId, name);
    }
    else {
      console.log(userId)
      const requesterSocketId = socket.id
      userId.members.forEach(element => {
        if (element != name._id) { 
          const receiverSocketId = getReceiverSocketId(element)
          io.to(receiverSocketId).emit('get-local-peer-id', requesterSocketId, userId);
        }
      });
    }
  });

  socket.on('send-peer-id', (peerId, requesterSocketId) => {
    console.log("data", peerId, requesterSocketId)
    io.to(requesterSocketId).emit('take-peer-id', peerId)
  })



  // socket.on('send-peer-id-back', ({ toSocketId, peerId }) => {
  //   io.to(toSocketId).emit('take-peer-id', peerId);

  // });

  // Keep a temp map
  const pendingPeerIdRequests = {};

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});


export { io, app, server };