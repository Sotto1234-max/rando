const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Helper: Generate random ID
const randomId = () => Math.random().toString(36).substring(2, 10);

// ✅ Predefined bot messages
const botMessages = [
  "Video chat?", "Telegram ID?", "Where are you from?", "Hi!", "Are you free now?",
  "I'm alone, let's chat!", "Wanna talk?", "You look nice!", "Send me your pic?", "Are you single?"
];

// ✅ Sample names
const maleNames = [
  "Amit", "Raj", "Hiro", "Ken", "Ali", "Farhan", "Wei", "Minh", "Ravi", "Sung",
  "Nikhil", "Anwar", "Sanjay", "Bao", "Takeshi", "Dinesh", "Jun", "Hasan", "Yuki", "Kumar"
];

const femaleNames = [
  "Mina", "Anika", "Sakura", "Ayesha", "Linh", "Sana", "Mei", "Nadia", "Haruka", "Tina",
  "Rani", "Kavita", "Jia", "Lea", "Sumaiya"
];

// ✅ Generate bots once at server start
const maleBots = maleNames.map(name => ({
  id: `bot_male_${randomId()}`,
  name,
  gender: 'male',
  isBot: true
}));

const femaleBots = femaleNames.map(name => ({
  id: `bot_female_${randomId()}`,
  name,
  gender: 'female',
  isBot: true
}));

// ✅ Global user list (bots + real users)
let users = [...maleBots, ...femaleBots];

// ✅ Socket connection handler
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // 🔐 Login handler
  socket.on('login', (user) => {
    user.id = socket.id;
    user.isBot = false;

    // Remove any existing user with the same name
    users = users.filter(u => u.name !== user.name);
    users = [user, ...users.filter(u => u.name !== user.name && !u.isBot), ...users.filter(u => u.isBot)];


    // Send user list to new user and all others
    socket.emit('userList', users);
    socket.broadcast.emit('userList', users);

    // Simulate bots sending messages (optional)
    handleBotMessages(user, socket);
  });

  // 📩 Message handler
  socket.on('sendMessage', (msg) => {
    const targetUser = users.find(u => u.name === msg.to);
    if (targetUser) {
      io.to(targetUser.id).emit('receiveMessage', msg);
      console.log(`📨 Message from ${msg.from} to ${msg.to}`);
    }
  });

  // ❌ Disconnect handler
  socket.on('disconnect', () => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
      console.log('❌ User disconnected:', user.name);
    }
    users = users.filter(u => u.id !== socket.id);
    io.emit('userList', users);
  });
});

// 🧠 Optional: Simulate bots chatting
function handleBotMessages(realUser, socket) {
  const bots = users.filter(u => u.isBot);
  const randomBot = bots[Math.floor(Math.random() * bots.length)];

  if (randomBot) {
    setTimeout(() => {
      const msg = {
        from: randomBot.name,
        to: realUser.name,
        text: botMessages[Math.floor(Math.random() * botMessages.length)]
      };
      socket.emit('receiveMessage', msg);
      console.log(`🤖 Bot ${msg.from} messaged ${msg.to}`);
    }, 3000);
  }
}

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
