const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Guarda nuevo mensaje
router.post('/', messageController.createMessage);

// Obtener historial de un room
router.get('/:roomId', messageController.getMessagesByRoom);

module.exports = router;