require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Rutas
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Welcome to Users API 🚀');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
