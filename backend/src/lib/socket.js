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
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    // origin: process.env.development?"http://localhost:5173" : "https://rapid-chat-five.vercel.app" , 
  })
);
const io = new Server(server, {
  cors: {
    // origin: [process.env.CORS_ORIGIN],
    origin: ["https://rapid-chat-five.vercel.app"],
    // origin: [process.env.development?"http://localhost:5173" : "https://rapid-chat-five.vercel.app"],
  },
});
const rooms = {}; // add this at top

const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}


const connectedUsers = new Map();
const activeRooms = new Map();

// Helper function to get user info
const getUserInfo = (socketId) => {
  return connectedUsers.get(socketId) || null;
};

// Helper function to broadcast to room




io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;


  socket.on("call-user", ({ targetUserId, roomId }) => {
  const receiverSocket = userSocketMap[targetUserId];

  if (receiverSocket) {
    io.to(receiverSocket).emit("incoming-call", {
      roomId,
      from: socket.id
    });
  }
});

  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    isSharing: false,
    currentRoom: null
  });

  socket.on("join-room", ({ roomId, emailId }) => {

    socket.join(roomId);
    socket.roomId = roomId;

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    // 🔥 IMPORTANT: send existing users to new user
    const otherUsers = rooms[roomId].filter(id => id !== socket.id);
    socket.emit("all-users", otherUsers);

    // notify others
    socket.to(roomId).emit("user-joined", {
      caller: socket.id,
      emailId
    });
  });




  // Send user their socket ID
  socket.emit('user-connected', {
    socketId: socket.id,
    message: 'Connected successfully'
  });



  // Handle WebRTC offer
  socket.on("offer", ({ target, sdp }) => {
    io.to(target).emit("offer", { sdp, caller: socket.id });
  });

  socket.on("answer", ({ target, sdp }) => {
    io.to(target).emit("answer", { sdp, caller: socket.id });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Handle screen share request
  socket.on('screen-share-request', (data) => {
    const { to } = data;
    const userInfo = getUserInfo(socket.id);


    // Update user status
    connectedUsers.set(socket.id, {
      ...userInfo,
      isSharing: true
    });

    io.to(to).emit('screen-share-request', {
      from: socket.id,
      fromUser: userInfo.userName || `User-${socket.id.substr(0, 6)}`,
      timestamp: new Date()
    });
  });

  // Handle screen share response
  socket.on('screen-share-response', (data) => {
    const { accepted, to } = data;
    const userInfo = getUserInfo(socket.id);


    io.to(to).emit('screen-share-response', {
      accepted: accepted,
      from: socket.id,
      fromUser: userInfo.userName || `User-${socket.id.substr(0, 6)}`,
      timestamp: new Date()
    });
  });

  // Handle screen share ended
  socket.on('screen-share-ended', (data) => {
    const { to } = data;
    const userInfo = getUserInfo(socket.id);


    // Update user status
    connectedUsers.set(socket.id, {
      ...userInfo,
      isSharing: false
    });

    // Notify specific user or broadcast to room
    if (to) {
      io.to(to).emit('screen-share-ended', {
        from: socket.id,
        fromUser: userInfo.userName
      });
    } else if (userInfo.currentRoom) {
      socket.to(userInfo.currentRoom).emit('screen-share-ended', {
        from: socket.id,
        fromUser: userInfo.userName
      });
    }
  });

  // Handle getting room participants
  socket.on('get-room-participants', (data) => {
    const { roomId } = data;
    const room = activeRooms.get(roomId);

    if (room) {
      const participants = room.participants.map(id => {
        const user = getUserInfo(id);
        return {
          id: id,
          userName: user?.userName || `User-${id.substr(0, 6)}`,
          isSharing: user?.isSharing || false
        };
      });

      socket.emit('room-participants', {
        roomId: roomId,
        participants: participants
      });
    } else {
      socket.emit('room-participants', {
        roomId: roomId,
        participants: []
      });
    }
  });

  // Handle getting connected users (for direct connection)
  socket.on('get-connected-users', () => {
    const users = Array.from(connectedUsers.values())
      .filter(user => user.id !== socket.id)
      .map(user => ({
        id: user.id,
        userName: user.userName || `User-${user.id.substr(0, 6)}`,
        isSharing: user.isSharing,
        connectedAt: user.connectedAt
      }));

    socket.emit('connected-users', users);
  });

  // Handle ping for connection health
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date(),
      serverTime: Date.now()
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
  console.log("A user disconnected", socket.id);

  const roomId = socket.roomId;

  // 🔹 Remove from room (WebRTC mesh cleanup)
  if (roomId && rooms[roomId]) {
    rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);

    // notify others
    socket.to(roomId).emit("user-left", socket.id);

    // optional: delete empty room
    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
    }
  }

  // 🔹 Remove from userSocketMap
  if (userId) {
    delete userSocketMap[userId];
  }

  // 🔹 Remove from connectedUsers
  connectedUsers.delete(socket.id);

  // 🔹 Broadcast updated online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
});

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
    socket.emit('error', {
      message: 'An error occurred',
      error: error.message
    });
  });



  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));


  socket.on("getSocketId", (user, socketId) => {
    const data = getReceiverSocketId(user)
    io.to(socketId).emit("takeSocketId", data)
  });
  socket.on("joinGroup", ({ groupId, userId }) => {
    socket.join(groupId);
    userSocketMap[userId] = socket.id;
  });






  // socket.on('send-peer-id-back', ({ toSocketId, peerId }) => {
  //   io.to(toSocketId).emit('take-peer-id', peerId);

  // });

  // Keep a temp map
  const pendingPeerIdRequests = {};

  
});


export { io, app, server };
