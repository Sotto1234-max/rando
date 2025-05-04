const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = []; // Stores users with their info and socket ID

// Handle incoming socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // When a new user connects, store their info
  socket.on('new-user', (userInfo) => {
    userInfo.id = socket.id; // Store socket id with the user info
    users.push(userInfo);
    console.log('Users online:', users);
    
    // Emit the updated user list to all clients
    io.emit('user-list', users);
  });

  // When a user sends a message, find the receiver by name and send the message to them
  socket.on('send-message', ({ to, message }) => {
    const receiver = users.find(user => user.name === to);
    
    if (receiver) {
      // Find the sender's name
      const senderName = users.find(u => u.id === socket.id)?.name || 'Unknown';
      io.to(receiver.id).emit('receive-message', {
        from: senderName,
        message
      });
    }
  });
  // image send korar jonno nicher code ta
  socket.on('send-image', ({ to, image }) => {
    const receiver = users.find(user => user.name === to);
    if (receiver) {
      const senderName = users.find(u => u.id === socket.id)?.name || 'Unknown';
      io.to(receiver.id).emit('receive-image', {
        from: senderName,
        image
      });
    }
  });

  // When a user disconnects, remove them from the user list
  socket.on('disconnect', () => {
    users = users.filter(user => user.id !== socket.id);
    io.emit('user-list', users); // Emit updated user list to all clients
    console.log('User disconnected:', socket.id);
  });
});

// Serve static files from 'public' directory
app.use(express.static('public'));

// Start the server
server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
