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

// Create 40 male bots
const maleBots = Array.from({ length: 40 }, (_, i) => ({
  id: `male_bot_${i + 1}`,
  name: `Raj${i + 1}`,
  gender: "male"
}));

// Create 25 female bots
const femaleBots = Array.from({ length: 25 }, (_, i) => ({
  id: `female_bot_${i + 1}`,
  name: `Neha${i + 1}`,
  gender: "female"
}));

// Store connected real users
const realUsers = {}; // socket.id -> user info

// Helper: shuffle array and pick n items
function getRandomBots(botArray, count) {
  const shuffled = [...botArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// When a user connects
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_login", (user) => {
    realUsers[socket.id] = user;
    console.log("Real user logged in:", user);

    // Decide which bots to respond
    let botsToUse = [];
    if (user.gender === "female") {
      botsToUse = getRandomBots(maleBots, 6 + Math.floor(Math.random() * 2)); // 6–7 male bots
    } else if (user.gender === "male") {
      botsToUse = getRandomBots(femaleBots, 6 + Math.floor(Math.random() * 2)); // 6–7 female bots
    }

    // Simulate messages from bots
    botsToUse.forEach((bot, index) => {
      setTimeout(() => {
        socket.emit("receive_message", {
          from: bot.name,
          text: `Hi ${user.name}, I'm ${bot.name}! 😊`
        });
      }, 1000 + index * 1000);
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete realUsers[socket.id];
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
