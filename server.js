const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Simulated bots
const maleBots = Array.from({ length: 40 }, (_, i) => ({
  id: `male_bot_${i + 1}`,
  name: `Raj${i + 1}`,
  gender: "male"
}));

const femaleBots = Array.from({ length: 25 }, (_, i) => ({
  id: `female_bot_${i + 1}`,
  name: `Neha${i + 1}`,
  gender: "female"
}));

// Real connected users
let users = []; // array of { id, name, gender }
let realUsers = {}; // socket.id -> user info

function getRandomBots(botArray, count) {
  const shuffled = [...botArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Real user registration
  socket.on("register", (user) => {
    user.id = socket.id;
    users.push(user);
    realUsers[socket.id] = user;
    io.emit("userList", users);

    // Trigger bots
    let botsToUse = [];
    if (user.gender === "female") {
      botsToUse = getRandomBots(maleBots, 6 + Math.floor(Math.random() * 2));
    } else if (user.gender === "male") {
      botsToUse = getRandomBots(femaleBots, 6 + Math.floor(Math.random() * 2));
    }

    // Simulate bot greetings
    botsToUse.forEach((bot, index) => {
      setTimeout(() => {
        socket.emit("receiveMessage", {
          message: `Hi ${user.name}, I'm ${bot.name}! 😊`,
          from: bot.name
        });
      }, 1000 + index * 1000);
    });
  });

  // Handle messaging between users
  socket.on("sendMessage", ({ to, message, from }) => {
    io.to(to).emit("receiveMessage", { message, from });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter(u => u.id !== socket.id);
    delete realUsers[socket.id];
    io.emit("userList", users);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
