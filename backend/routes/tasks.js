const express = require('express');
const router = express.Router();
const authToken = require('../middleware/authToken');
const taskController = require('../controllers/taskController');

// Crear nueva tarea
router.post('/', authToken, taskController.createTask);

// Obtener tareas por grupo
router.get('/:groupId', authToken, taskController.getTasksByGroup);

// Cambiar estado (completada/no completada)
router.put('/:taskId/toggle', authToken, taskController.toggleTaskStatus);

// Eliminar tarea
router.delete('/:taskId', authToken, taskController.deleteTask);

module.exports = router;