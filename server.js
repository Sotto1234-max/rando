const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = []; // Real users with socket.id
const botNames = {
  male: ["Ravi", "Amit", "Rahul", "Hasan", "Arif", "Raj", "Sumon", "Kabir", "Anik", "Neel", "Tomal", "Abir", "Tareq", "Firoz khan", "Aniket"],
  female: ["Priya", "Anita", "Fatema", "Nusrat", "Lipi", "Meera", "Nishi", "Joya", "Salma", "Rima", "Sathi", "Disha", "Saniya", "Srity"]
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomUniqueName(list, usedSet) {
  const available = list.filter(name => !usedSet.has(name));
  if (available.length === 0) return getRandomItem(list);
  const name = getRandomItem(available);
  usedSet.add(name);
  return name;
}

function generateBots() {
  const bots = [];
  const usedNames = new Set();

  for (let i = 0; i < 30; i++) {
    bots.push({
      name: getRandomUniqueName(botNames.male, usedNames),
      gender: "Male",
      age: 20 + Math.floor(Math.random() * 10),
      region: "India",
      countryCode: "in",
      countryName: "India"
    });
  }

  for (let i = 0; i < 30; i++) {
    bots.push({
      name: getRandomUniqueName(botNames.female, usedNames),
      gender: "Female",
      age: 19 + Math.floor(Math.random() * 10),
      region: "Bangladesh",
      countryCode: "bd",
      countryName: "Bangladesh"
    });
  }

  return bots;
}

const allBotUsers = generateBots();


function sendBotMessages(socket, user) {
  const oppositeGender = user.gender === "Male" ? "Female" : "Male";
  const sampleMessages = [
     "Hi 😊",
    "Video chat?",
    "Give your Telegram id ?",
    "are you free?",
    "Hey 👋"
  ];

  const botList = allBotUsers.filter(b => b.gender === oppositeGender);
  const selectedBots = botList.sort(() => 0.5 - Math.random()).slice(0, 4 + Math.floor(Math.random() * 2));

  selectedBots.forEach((bot, index) => {
    const msg = getRandomItem(sampleMessages);

    // Delay: 15s to 20s per bot, add incremental base so bots don't send all at once
    const delay = 15000 + Math.random() * 5000 + (index * 3000); // e.g., 15–23s total

    setTimeout(() => {
      socket.emit('receive-message', {
        from: bot.name,
        message: msg
      });
    }, delay);
  });
}


// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('new-user', (userInfo) => {
    userInfo.id = socket.id;
    users.push(userInfo);
    console.log('Users online:', users.length);

    // Send user list to all real clients
    io.emit('user-list', users);

    // Bot messages to the new user
    sendBotMessages(socket, userInfo);
  });

  socket.on('send-message', ({ to, message }) => {
    const receiver = users.find(u => u.name === to);
    if (receiver) {
      const sender = users.find(u => u.id === socket.id);
      const senderName = sender?.name || 'Unknown';
      io.to(receiver.id).emit('receive-message', {
        from: senderName,
        message
      });
    }
  });

  socket.on('send-image', ({ to, image }) => {
    const receiver = users.find(user => user.name === to);
    const sender = users.find(u => u.id === socket.id);
    const senderName = sender?.name || 'Unknown';
    if (receiver) {
      io.to(receiver.id).emit('receive-image', {
        from: senderName,
        image
      });
    }
  });

  socket.on('disconnect', () => {
    users = users.filter(user => user.id !== socket.id);
    io.emit('user-list', users);
    console.log('User disconnected:', socket.id);
  });
});

// Serve static files
app.use(express.static('public'));

// Start server
server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
