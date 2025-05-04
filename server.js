const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

const path = require('path');
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public'))); // Your index.html should be in /public

let users = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('new-user', (user) => {
    user.id = socket.id;
    users.push(user);
    io.emit('user-list', users);
  });

socket.on('send-message', ({ to, message }) => {
  io.to(to).emit('receive-message', {
    from: socket.id,
    message,
  });
});

  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users = users.filter(u => u.id !== socket.id);
    io.emit('user-list', users);
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
