const express = require('express');
const router = express.Router();

// Importa el modelo correcto
const User = require('../models/User');

// ✅ GET: Listar todos los usuarios
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});

// ✅ GET: Buscar usuario por ID
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});

// ✅ POST: Crear usuario
router.post('/', async (req, res) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();  // 👈 te faltaba el await
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});

// ✅ PUT: Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedUser = await User.findOneAndUpdate(
            { _id: id },
            { $set: req.body },
            { new: true } // devuelve el documento actualizado
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});

// ✅ DELETE: Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deletedUser = await User.findByIdAndDelete(id); // más directo que deleteOne

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully", deletedUser });
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});

// ✅ POST: Login seguro
router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        // Validar que se envíen datos
        if (!name || !password) {
            return res.status(400).json({ message: "Name and password are required" });
        }

        // Buscar usuario por nombre
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Comparar contraseñas directamente (texto plano)
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Si todo es correcto
        res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        res.status(500).json({ message: "An error occurred", error });
    }
});


 
module.exports = router;
