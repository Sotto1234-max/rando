const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('new-user', (userInfo) => {
    userInfo.id = socket.id;
    users.push(userInfo);
    io.emit('user-list', users);
  });

  socket.on('send-message', ({ to, message }) => {
    const receiver = users.find(user => user.name === to);
    if (receiver) {
      io.to(receiver.id).emit('receive-message', {
        from: users.find(u => u.id === socket.id)?.name || 'Unknown',
        message
      });
    }
  });

  socket.on('disconnect', () => {
    users = users.filter(user => user.id !== socket.id);
    io.emit('user-list', users);
  });
});

app.use(express.static('public'));

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
