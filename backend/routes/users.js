const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Crear usuario
router.post('/', userController.createUser);

// Actualizar usuario general
router.put('/:id', userController.updateUser);

// Login
router.post('/login', userController.loginUser);

// Actualizar status a online
router.put('/:id/online', userController.setOnline);

router.get('/me', userController.getCurrentUser)

// Logout
router.post('/logout', userController.logoutUser);

module.exports = router;
