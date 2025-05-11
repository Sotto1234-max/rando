const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Online users list
let users = [];

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Handle login
  socket.on('login', (user) => {
    user.id = socket.id;

    // Prevent duplicate users with same name (optional)
    users = users.filter(u => u.name !== user.name);

    users.push(user);
    io.emit('userList', users);
    console.log('👤 User logged in:', user.name);
  });

  // Handle messaging
  socket.on('sendMessage', (msg) => {
    const targetUser = users.find(u => u.name === msg.to);
    if (targetUser) {
      io.to(targetUser.id).emit('receiveMessage', msg);
      console.log(`📨 Message from ${msg.from} to ${msg.to}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
      console.log('❌ User disconnected:', user.name);
    }
    users = users.filter(u => u.id !== socket.id);
    io.emit('userList', users);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
