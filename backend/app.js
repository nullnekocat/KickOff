const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

const PORT = 3000;

// Enable CORS
app.use(cors());
// Enable JSON parser
app.use(express.json());

// Importar rutas de usuarios
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.send('Welcome to Users API 🚀');
});

// Conexión a MongoDB
main().catch(err => console.error(err));
async function main() {
    try {
        mongoose.set('strictQuery', true);
        const connectionString = "mongodb+srv://andrew:pwj_evf*cam9vnv*XVW@cluster0.yzomxht.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(connectionString);
        console.log("✅ Connected to MongoDB Atlas");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
    }
}

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
