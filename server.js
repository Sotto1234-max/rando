const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Store online users and their socket info
let users = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle login
  socket.on('login', (user) => {
    user.id = socket.id;
    users.push(user);
    io.emit('userList', users); // update all users
  });

  // Handle messaging
  socket.on('sendMessage', (msg) => {
    const targetUser = users.find(u => u.name === msg.to);
    if (targetUser) {
      io.to(targetUser.id).emit('receiveMessage', msg);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit('userList', users);
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
