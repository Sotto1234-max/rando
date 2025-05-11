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
  user.isBot = false; // Mark as human

  // Remove any existing user with the same name
  users = users.filter(u => u.name !== user.name);
  users.push(user);

  // Show all users except self (bots included)
  const visibleUsers = users.filter(u => {
    if (u.isBot) return true;
    return u.id !== socket.id;
  });
  io.emit('userList', visibleUsers);

  // Trigger bots to message the user
  handleBotMessages(user, socket);
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
  const randomId = () => Math.random().toString(36).substring(2, 10);

const botMessages = [
  "Video chat?",
  "Telegram ID?",
  "Where are you from?",
  "Hi!",
  "Are you free now?",
  "I'm alone, let's chat!",
  "Wanna talk?",
  "You look nice!",
  "Send me your pic?",
  "Are you single?"
];

// Create bots (no socket.id because they're fake)
const maleBots = Array.from({ length: 20 }, (_, i) => ({
  id: `bot_male_${randomId()}`,
  name: `M_Bot_${i + 1}`,
  gender: 'male',
  isBot: true
}));

const femaleBots = Array.from({ length: 15 }, (_, i) => ({
  id: `bot_female_${randomId()}`,
  name: `F_Bot_${i + 1}`,
  gender: 'female',
  isBot: true
}));

// Add bots to the global list (don't emit these yet)
let users = [...maleBots, ...femaleBots];

});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
