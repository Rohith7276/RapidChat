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
    methods: ['GET', 'POST','PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    // origin: "http://localhost:5173", 
  })
);
const io = new Server(server, {
  cors: {
    // origin: [process.env.CORS_ORIGIN],
    origin: ["https://rapid-chat-five.vercel.app"],
    // origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {}; // {userId: socketId}
const emailToSocketMapping = new Map()
const socketToEmailMapping = new Map()
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


  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    isSharing: false,
    currentRoom: null
  });

  socket.on("join-room", (data)=>{
    const {emailId, roomId } = data; 
    socketToEmailMapping.set(socket.id, emailId)
    emailToSocketMapping.set(emailId, socket.id)
    socket.join(roomId)
    socket.emit("joined-room", {roomId})
    
    socket.broadcast.to(roomId).emit("user-joined", {emailId})
  })
  socket.on("call-user", data =>{
    const { emailId, offer } = data
    const fromEmail = socketToEmailMapping.get(socket.id)
    const socketId = emailToSocketMapping.get(emailId)
    socket.to(socketId).emit('incomming-call', {from: fromEmail, offer})

  })

  socket.on('call-accepted', data =>{
    const {emailId, ans} = data;
    const socketId = socketToEmailMapping.get(emailId)
    socket.to(socketId).emit('call-accepted', {ans})
  })

  // Send user their socket ID
  socket.emit('user-connected', {
    socketId: socket.id,
    message: 'Connected successfully'
  });

 

  // Handle WebRTC offer
  socket.on('offer', (data) => {
    const { offer, to } = data;
 

    io.to(to).emit('offer', {
      offer: offer,
      from: socket.id
    });
  });

  // Handle WebRTC answer
  socket.on('answer', (data) => {
    const { answer, to } = data;
 

    io.to(to).emit('answer', {
      answer: answer,
      from: socket.id
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { candidate, to } = data;
 

    io.to(to).emit('ice-candidate', {
      candidate: candidate,
      from: socket.id
    });
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
  socket.on('disconnect', (reason) => { 

    const userInfo = getUserInfo(socket.id);

    // Remove from room if exists
    if (userInfo && userInfo.currentRoom) {
      const room = activeRooms.get(userInfo.currentRoom);
      if (room) {
        room.participants = room.participants.filter(id => id !== socket.id);

        // Notify others in room
        socket.to(userInfo.currentRoom).emit('user-left', {
          userId: socket.id,
          userName: userInfo.userName,
          participants: room.participants.length
        });

        // If screen was being shared, notify about end
        if (userInfo.isSharing) {
          socket.to(userInfo.currentRoom).emit('screen-share-ended', {
            from: socket.id,
            fromUser: userInfo.userName,
            reason: 'user-disconnected'
          });
        }

        // Clean up empty room
        if (room.participants.length === 0) {
          activeRooms.delete(userInfo.currentRoom); 
        }
      }
    }

    // Remove from connected users
    connectedUsers.delete(socket.id);
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

  socket.on('get-peer-id', (userId, name, group) => { 

    if (!group) {
      const requesterSocketId = socket.id;
      const receiverSocketId = getReceiverSocketId(userId); 
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
