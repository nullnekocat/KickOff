const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authToken = require('../middleware/authToken');

// Obtener todos los usuarios
router.get('/', authToken, userController.getAllOtherUsers);

// Crear usuario
router.post('/signin', userController.createUser);

// Login
router.post('/login', userController.loginUser);

// Get user
router.get('/me', userController.getCurrentUser)

// Actualizar status a online
router.put('/:id/online', userController.setOnline);

// Logout
router.post('/logout', userController.logoutUser);

// Actualizar usuario general
router.put('/:id', userController.updateUser);

module.exports = router;
