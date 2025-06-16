import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms and user counts
const roomUsers = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    
    // Add user to room tracking
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId)?.add(socket.id);
    
    // Send updated user count to all users in the room
    const userCount = roomUsers.get(roomId)?.size || 0;
    io.to(roomId).emit('user-count', userCount);
    
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    
    // Remove user from room tracking
    roomUsers.get(roomId)?.delete(socket.id);
    
    // Send updated user count to all users in the room
    const userCount = roomUsers.get(roomId)?.size || 0;
    io.to(roomId).emit('user-count', userCount);
    
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  socket.on('new-message', (data) => {
    // Broadcast the message to all users in the room
    socket.to(data.roomId).emit('message-received', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        const userCount = users.size;
        io.to(roomId).emit('user-count', userCount);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});