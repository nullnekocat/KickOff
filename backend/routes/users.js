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

// Get full current user details (points, streak)
router.get('/me/details', authToken, userController.getMyDetails);

// Adjust points for current user
router.post('/me/points', authToken, userController.adjustPoints);

// Actualizar status a online
router.put('/:id/online', userController.setOnline);

// Logout
router.post('/logout', userController.logoutUser);

// Actualizar usuario general
router.put('/:id', userController.updateUser);

module.exports = router;
