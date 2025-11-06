require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

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
