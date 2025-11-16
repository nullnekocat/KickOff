require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const RoomKeyOffer = require('./models/RoomKeyOffer');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

// CORS settings
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://0.0.0.0:4200'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:4200',
      'http://0.0.0.0:4200'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

connectDB();
User.updateMany({ status: 1 }, { $set: { status: 0 } }).then(() => {
  console.log('Los status se han reseteado');
});

const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const taskRoutes = require('./routes/tasks');

app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tasks', taskRoutes);

// Endpoints
app.get('/', (req, res) => {
  res.send('The server root!');
});

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

const userPublicKeys = {}; // { userId: base64PublicKey }
const userSockets = {}; // { userId: socketId }

global._io = io;
global._userSockets = userSockets;

io.on('connection', async (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.user.id}), socket id: ${socket.id}`);
  const userId = socket.user.id;

  // Registrar socket para este userId
  userSockets[socket.user.id] = socket.id;

  // Marcar usuario como online al conectar
  try {
    await User.findByIdAndUpdate(userId, { status: 1 });
    console.log(`🟢 ${socket.user.name} está en línea`);
    io.emit('userStatus', { userId, status: 1 });
  } catch (err) {
    console.error('❌ Error al actualizar estado online:', err);
  }

  try {
    const onlineUsers = await User.find({ status: 1 }).select('_id');
    const onlineIds = onlineUsers.map(u => String(u._id));
    socket.emit('userStatus:init', { users: onlineIds });
    console.log('📡 Enviado userStatus:init al socket conectado:', socket.id, onlineIds.length);
  } catch (e) {
    console.warn('⚠️ No se pudo enviar userStatus:init:', e);
  }

  const pendingOffers = await RoomKeyOffer.find({ toUserId: userId });
  for (const offer of pendingOffers) {
    socket.emit('roomKeyOffered', {
      roomId: offer.roomId,
      fromUserId: offer.fromUserId,
      encryptedRoomKey: offer.encryptedRoomKey
    });
    console.log(`📬 Entregada roomKeyOffer pendiente de ${offer.fromUserId} a ${userId}`);
    await RoomKeyOffer.deleteOne({ _id: offer._id }); // eliminar tras entregar
  }

  // Cuando recibe oferta de roomKey (oferta cifrada destino)
  socket.on('roomKeyOffer', async ({ roomId, toUserId, encryptedRoomKey }) => {
    const targetSocketId = userSockets[toUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('roomKeyOffered', {
        roomId,
        fromUserId: socket.user.id,
        encryptedRoomKey
      });
      console.log(`🔐 roomKeyOffer de ${socket.user.id} -> ${toUserId} para ${roomId}`);
    } else {
      console.log(`💾 Guardando roomKeyOffer pendiente para ${toUserId}`);
      await RoomKeyOffer.create({ roomId, fromUserId: socket.user.id, toUserId, encryptedRoomKey });
    }
  });

  // Cuando un peer acepta/manda su propia oferta de vuelta (opcional)
  socket.on('roomKeyAck', ({ roomId, toUserId }) => {
    const targetSocketId = userSockets[toUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('roomKeyAck', { roomId, fromUserId: socket.user.id });
    }
  });

  // Recibir clave pública del usuario
  socket.on('publicKey', ({ userId, publicKey }) => {
    userPublicKeys[userId] = publicKey;
    console.log(`🔐 Clave pública recibida de ${userId}`);

    // Si ya está en un room, notificar a los demás
    if (socket.roomId) {
      socket.to(socket.roomId).emit('userPublicKey', { userId, publicKey });
    }
  });

  // Selecciona un chat y se une a un room privado
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`👥 ${socket.user.name} entró a room ${roomId}`);

    // Obtener otros sockets conectados al mismo room
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const otherUsers = clients
      .map((id) => io.sockets.sockets.get(id))
      .filter((s) => s && s.user?.id !== socket.user.id);

    // Enviar a este socket las claves públicas de los demás
    const publicKeys = otherUsers
      .map((s) => ({
        userId: s.user.id,
        publicKey: userPublicKeys[s.user.id],
      }))
      .filter((k) => k.publicKey); // Solo los que ya enviaron su clave

    if (publicKeys.length) {
      socket.emit('roomPublicKeys', publicKeys);
      console.log(`📦 Enviadas ${publicKeys.length} claves públicas al nuevo usuario`);
    }
  });

  socket.on('message', async ({ roomId, text, iv, isEncrypted = false, media = null }) => {
    if (!roomId) return console.warn('⚠️ message sin roomId');

    try {
      const msg = new Message({
        roomId,
        senderId: socket.user.id,
        text,
        iv,
        isEncrypted,
        media: media || { url: null, type: null, name: null }
      });

      const saved = await msg.save();

      // Emitir el mensaje guardado (con id, fecha) — así los clientes renderizan lo mismo.
      io.to(roomId).emit('message', {
        _id: saved._id,
        roomId: saved.roomId,
        senderName: socket.user.name,
        senderId: socket.user.id,
        text: saved.text,
        iv: saved.iv,
        isEncrypted: saved.isEncrypted,
        media: saved.media,
        createdAt: saved.createdAt
      });

    } catch (err) {
      console.error('❌ Error guardando mensaje en MongoDB:', err);
    }
  });

  socket.on('disconnect', (reason) => {
    delete userSockets[socket.user.id];
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

  // Presence events: allow client to declare visibility
  socket.on('presence', async ({ status }) => {
    try {
      const s = Number(status) === 1 ? 1 : 0;
      await User.findByIdAndUpdate(userId, { status: s });
      io.emit('userStatus', { userId, status: s });
      console.log(`🔔 Presence update from ${socket.user.name}: status=${s}`);
    } catch (err) {
      console.error('❌ Error handling presence event:', err);
    }
  });

  // --- SIGNALLING --- //
  socket.on('webrtc:offer', ({ roomId, sdp, isVideo }) => {
    console.log(`📡 Oferta WebRTC recibida de ${socket.user.id} para room ${roomId}`);
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    console.log(`👥 Usuarios en el room:`, socketsInRoom ? [...socketsInRoom] : 'ninguno');

    socket.to(roomId).emit('webrtc:offer', { from: socket.user.id, sdp, isVideo });
    console.log(`📤 Oferta reenviada a room ${roomId}`);
  });


  socket.on('webrtc:answer', ({ roomId, sdp }) => {
    console.log('⬅️ [server] webrtc:answer RECEIVED from', socket.user.id, 'roomId:', roomId);
    socket.to(roomId).emit('webrtc:answer', { from: socket.user.id, roomId, sdp });
  });

  socket.on('webrtc:ice-candidate', ({ roomId, candidate }) => {
    console.log('⬅️ [server] ice-candidate from', socket.user.id, 'roomId:', roomId);
    socket.to(roomId).emit('webrtc:ice-candidate', { from: socket.user.id, roomId, candidate });
  });

  socket.on('webrtc:end-call', ({ roomId }) => {
    console.log('⬅️ [server] end-call from', socket.user.id, 'roomId:', roomId);
    socket.to(roomId).emit('webrtc:end-call', { from: socket.user.id, roomId });
  });

});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on https://0.0.0.0:${PORT}`);
});
