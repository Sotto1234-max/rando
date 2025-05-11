const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const randomId = () => Math.random().toString(36).substring(2, 10);

const botMessages = [
  "Video chat?", "Telegram ID?", "Where are you from?", "Hi!", "Are you free now?",
  "I'm alone, let's chat!", "Wanna talk?", "You look nice!", "Send me your pic?", "Are you single?"
];

const maleNames = [
  "Amit", "Raj", "Hiro", "Ken", "Ali", "Farhan", "Wei", "Minh", "Ravi", "Sung",
  "Nikhil", "Anwar", "Sanjay", "Bao", "Takeshi", "Dinesh", "Jun", "Hasan", "Yuki", "Kumar"
];

const femaleNames = [
  "Mina", "Anika", "Sakura", "Ayesha", "Linh", "Sana", "Mei", "Nadia", "Haruka", "Tina",
  "Rani", "Kavita", "Jia", "Lea", "Sumaiya"
];

// ✅ Generate all bots
const allBots = [
  ...maleNames.map(name => ({ id: `bot_male_${randomId()}`, name, gender: 'male', isBot: true })),
  ...femaleNames.map(name => ({ id: `bot_female_${randomId()}`, name, gender: 'female', isBot: true }))
];

// ✅ Pick 80% of bots to always remain active
const alwaysActiveBots = allBots.sort(() => 0.5 - Math.random()).slice(0, Math.floor(allBots.length * 0.8));

// ✅ The rest will rotate
let rotatingBotsPool = allBots.filter(bot => !alwaysActiveBots.includes(bot));
let currentRotatingBots = [];

let users = [...alwaysActiveBots]; // Start with always active bots

// ✅ Socket connection
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  socket.on('login', (user) => {
    user.id = socket.id;
    user.isBot = false;

    users = users.filter(u => u.name !== user.name);
    users = [user, ...users];

    socket.emit('userList', users);
    socket.broadcast.emit('userList', users);

    handleBotMessages(user, socket);
  });
  socket.on('publicMessage', (data) => {
    io.emit('publicMessage', data); // broadcast to all clients
  });

  socket.on('sendMessage', (msg) => {
    const targetUser = users.find(u => u.name === msg.to);
    if (targetUser) {
      io.to(targetUser.id).emit('receiveMessage', msg);
      console.log(`📨 Message from ${msg.from} to ${msg.to}`);
    }
  });

  socket.on('disconnect', () => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
      console.log('❌ User disconnected:', user.name);
    }
    users = users.filter(u => u.id !== socket.id);
    io.emit('userList', users);
  });
});

// 🧠 Simulate bot sending message to real user
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

// 🔁 Rotate 2–4 bots every 2–3 minutes
setInterval(() => {
  const numToShow = Math.floor(Math.random() * 3) + 2; // 2 to 4 rotating bots
  const shuffled = rotatingBotsPool.sort(() => 0.5 - Math.random());
  currentRotatingBots = shuffled.slice(0, numToShow);

  const realUsers = users.filter(u => !u.isBot);
  users = [...realUsers, ...alwaysActiveBots, ...currentRotatingBots];

  io.emit('userList', users);
  console.log(`🔄 Rotated ${numToShow} bots (Total shown: ${users.length})`);
}, Math.floor(Math.random() * 60000) + 120000); // every 2–3 mins

// 🚀 Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
