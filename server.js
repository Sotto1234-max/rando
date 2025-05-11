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

// ✅ Master list of all bots
const allBots = [...maleBots, ...femaleBots];

// ✅ Active users (real + visible bots)
let users = [];

// ✅ Socket connection handler
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // 🔐 Login handler
  socket.on('login', (user) => {
    user.id = socket.id;
    user.isBot = false;

    users = users.filter(u => u.name !== user.name);
    users = [user, ...users];

    socket.emit('userList', users);
    socket.broadcast.emit('userList', users);

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

// 🧠 Bot Message Simulator (on user login)
function handleBotMessages(realUser, socket) {
  const bots = users.filter(u => u.isBot);
  if (bots.length === 0) return;

  const randomBot = bots[Math.floor(Math.random() * bots.length)];
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

// 🔄 Bot appear/disappear every 2–3 minutes
setInterval(() => {
  const numToShow = Math.floor(Math.random() * 2) + 5; // 5 to 6 bots
  const shuffled = allBots.sort(() => 0.5 - Math.random());
  const selectedBots = shuffled.slice(0, numToShow);

  // Remove existing bots
  users = users.filter(u => !u.isBot);

  // Add new bots
  users = [...users, ...selectedBots];

  io.emit('userList', users);
  console.log(`🔁 Updated bots (${numToShow} bots shown)`);
}, Math.floor(Math.random() * 60000) + 120000); // Every 2–3 mins

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
