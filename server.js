const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {}; // { username: socketId }

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // Handle new user joining
  socket.on('new-user', user => {
    users[user.name] = socket.id;

    // Send updated user list to all clients
    const userList = Object.entries(users).map(([name, id]) => ({
      name,
      socketId: id,
      ...user, // include other user data like gender, age, country, etc.
    }));
    io.emit('user-list', userList);
  });

  // Handle sending message to a specific user
  socket.on('send-message', ({ to, message }) => {
    const receiverSocketId = users[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', {
        from: getUsernameBySocketId(socket.id),
        message,
      });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const name = getUsernameBySocketId(socket.id);
    if (name) {
      delete users[name];
      io.emit('user-list', Object.entries(users).map(([name, id]) => ({
        name,
        socketId: id,
        // Include any other data if needed
      })));
    }
    console.log('User disconnected:', socket.id);
  });

  // Function to get username by socketId
  function getUsernameBySocketId(id) {
    return Object.keys(users).find(name => users[name] === id);
  }
});

// Serve static files from 'public' directory
app.use(express.static('public'));

// Start the server
server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
