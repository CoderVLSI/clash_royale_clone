const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

const rooms = {}; // Store room data: { roomId: { players: [socketId], ... } }

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create Room
  socket.on('create_room', (roomId) => {
    if (rooms[roomId]) {
      socket.emit('error', 'Room already exists');
      return;
    }
    rooms[roomId] = { players: [socket.id] };
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${socket.id}`);
    socket.emit('room_created', roomId);
  });

  // Join Room
  socket.on('join_room', (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Notify both players to start game
    io.to(roomId).emit('start_game', { 
      roomId, 
      players: room.players,
      startingPlayer: room.players[0] // Host is player 1
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Cleanup rooms (simplified)
    for (const id in rooms) {
      if (rooms[id].players.includes(socket.id)) {
        io.to(id).emit('opponent_disconnected');
        delete rooms[id];
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Clash Royale Clone Server running on port ${PORT}`);
});