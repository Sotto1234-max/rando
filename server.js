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

const publicBotMessages = [
  "Hi there", "Kya haal hai?", "I wanna fun with you baby, come to video call now I am alone",
  "Ami club e jabo, tumi ashbe?", "Koi hai jo video call pe ayega?", "Bore lagche tai chat e eshechi",
  "Uff amar ta vije ache, thela dile dhuke jabe baby", "Aapna number do phir 😅",
  "Arey baap re eto active log", "Video chat korle moja lage",
  "ntelegram id bata do", "Tum kahaan se ho?", "Kaw acho? Amake thanda kore dite parbe?",
  "Hi! Tumi ki korba amar sathe?", "Free signup diye chat korte paro 😄",
  "Chat e ashle moja lage", "Nice talking to you!", "wana see something? video chat join karo aabhi",
  "Tumi ki facebook use koro?", "Khelba?", "Tumi ki Bangladeshi?", "Call korbo naki? 😋",
  "Ami ekdom free ekhon", "telegram id bata do aap", "Dhaka te thako?", "I am very naughty baby",
  "Wanna fun with me? Come to video chat now", "Hey", "Mujhe lonely lag raha hai",
  "Tomar sathe kotha bole bhalo laglo", "thik hai ajaao",
  "Video chat e moja lage", "Aibar call e ashbo naki? 😅", "Free signup karke video call karo",
  "Video call pe ajao", "Kaha se ho?", "How old are you?"
];

// 🤖 Send random bot messages to public chat every 10-13 sec
setInterval(() => {
  const bots = users.filter(u => u.isBot); // Filter out the bots
  const numBotsToSend = Math.floor(Math.random() * 2) + 2; // 2 to 3 random bots to send messages
  const selectedBots = bots.sort(() => 0.5 - Math.random()).slice(0, numBotsToSend); // Shuffle and pick bots

  selectedBots.forEach(bot => {
    const message = publicBotMessages[Math.floor(Math.random() * publicBotMessages.length)]; // Select random message
    const msg = {
      name: bot.name,
      message: message
    };
    io.emit('publicMessage', msg); // Send to public chat
    console.log(`🤖 [Public] ${msg.name}: ${msg.message}`);
  });

}, Math.floor(Math.random() * 3000) + 10000); // Random interval between 10 to 13 seconds



// 🚀 Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
