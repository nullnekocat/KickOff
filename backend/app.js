require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const Message = require('./models/Message');
const User = require('./models/User');

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
User.updateMany({ status: 1 }, { $set: { status: 0 } }).then(() => {
  console.log('Los status se han reseteado');
});

const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

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

io.on('connection', async (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.user.id}), socket id: ${socket.id}`);
  const userId = socket.user.id;

  // 🟢 Marcar usuario como online al conectar
  try {
    await User.findByIdAndUpdate(userId, { status: 1 });
    console.log(`🟢 ${socket.user.name} está en línea`);
    io.emit('userStatus', { userId, status: 1 });
  } catch (err) {
    console.error('❌ Error al actualizar estado online:', err);
  }

  // Selecciona un chat y se une a un room privado
  socket.on('joinRoom', (data) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.join(roomId);
    console.log(`👥 ${socket.user.name} joined room ${roomId}`);
  });

  socket.on('message', async ({ roomId, text, isEncrypted = false }) => {
    if (!roomId) return console.warn('⚠️ message sin roomId');
    console.log(`💬 [${socket.user.name}] in room ${roomId}: ${text}`);

    // Guardar mensaje en MongoDB
    try {
      const msg = new Message({
        roomId,
        senderId: socket.user.id,
        text,
        isEncrypted
      });
      await msg.save();
    } catch (err) {
      console.error('❌ Error guardando mensaje en MongoDB:', err);
    }

    // Emitir mensaje a todos en el room
    io.to(roomId).emit('message', {
      senderName: socket.user.name,
      senderId: socket.user.id,
      text,
      roomId,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔴 User ${socket.user?.name || socket.id} disconnected:`, reason);

    // Esperar unos segundos por si se reconecta rápido
    setTimeout(async () => {
      const stillConnected = [...io.sockets.sockets.values()]
        .some(s => s.user?.id === userId);

      if (!stillConnected) {
        try {
          await User.findByIdAndUpdate(userId, { status: 0 });
          io.emit('userStatus', { userId, status: 0 });
          console.log(`⚫ ${socket.user.name} is offline`);
        } catch (err) {
          console.error('❌ Error al actualizar estado offline:', err);
        }
      }
    }, 1000); // 1 segundo de margen
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
