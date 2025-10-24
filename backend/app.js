require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// CORS settings
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(express.json());

connectDB();

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Welcome to Users API 🚀');
});

io.on('connection', (socket) => {
  console.log('a user connected, socket id:', socket.id);

  socket.on('message', (msg) => {
    console.log('received message from', socket.id, msg);
    // Broadcast message with sender's socket id
    io.emit('message', { from: socket.id, text: `${msg}` })
  });

  socket.on('disconnect', (reason) => {
    console.log('user disconnected', socket.id, 'reason:', reason);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
