const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join', ({ roomId, username }) => {
    socket.join(roomId);
    // Optionally: broadcast user join, update user list, etc.
  });

  socket.on('code-change', (data) => {
    socket.to(data.roomId).emit('sync-code', { code: data.code });
  });

  socket.on('chat-message', (data) => {
    io.to(data.roomId).emit('chat-message', { username: data.username, message: data.message });
  });

  socket.on('leave', ({ roomId, username }) => {
    socket.leave(roomId);
    // Optionally: broadcast user leave, update user list, etc.
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
