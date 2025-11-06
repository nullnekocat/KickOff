require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

// CORS settings
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});

connectDB();

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Endpoints
app.get('/', (req, res) => {
  res.send('The server root!');
});

//app.get('/test', authToken, (req, res) => {
//  res.json(test.filter(test => test.name === req.user.name));
//})

/*
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
*/

io.use((socket, next) => {
  try {
    // Leer cookies desde la cabecera del handshake
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.accessToken;

    if (!token) {
      console.warn('❌ No token in cookies');
      return next(new Error('Authentication error'));
    }

    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = decoded; // Guardamos los datos del usuario en el socket
    next();
  } catch (err) {
    console.error('❌ Socket auth error:', err.message);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.user.id}), socket id: ${socket.id}`);

  socket.on('message', (msg) => {
    console.log(`💬 [${socket.user.name}] ${msg}`);

    // Emitir mensaje junto con datos de usuario (no usar socket.id)
    io.emit('message', {
      senderName: socket.user.name,
      senderId: socket.user.id,
      text: msg,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 User ${socket.user?.name || socket.id} disconnected:`, reason);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
