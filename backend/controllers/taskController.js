const Task = require('../models/Task');
const Group = require('../models/Group');

// Crear nueva tarea
exports.createTask = async (req, res) => {
    try {
        const { text, inChargeId, groupId } = req.body;

        if (!text || !inChargeId || !groupId) {
            return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }

        const newTask = new Task({ text, inChargeId, groupId });
        await newTask.save();

        // Vincular tarea al grupo
        await Group.findByIdAndUpdate(groupId, { $push: { tasks: newTask._id } });

        res.status(201).json(newTask);
    } catch (err) {
        console.error('❌ Error al crear tarea:', err);
        res.status(500).json({ message: 'Error al crear tarea.' });
    }
};

// Obtener todas las tareas de un grupo
exports.getTasksByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const tasks = await Task.find({ groupId }).populate('inChargeId', 'name');
        res.json(tasks);
    } catch (err) {
        console.error('❌ Error al obtener tareas:', err);
        res.status(500).json({ message: 'Error al obtener tareas.' });
    }
};

// Marcar tarea como completada o no
exports.toggleTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        task.completed = !task.completed;
        await task.save();

        res.json(task);
    } catch (err) {
        console.error('❌ Error al actualizar tarea:', err);
        res.status(500).json({ message: 'Error al actualizar tarea.' });
    }
};

// Eliminar tarea
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        await Task.findByIdAndDelete(taskId);
        await Group.findByIdAndUpdate(task.groupId, { $pull: { tasks: taskId } });

        res.json({ message: 'Tarea eliminada correctamente.' });
    } catch (err) {
        console.error('❌ Error al eliminar tarea:', err);
        res.status(500).json({ message: 'Error al eliminar tarea.' });
    }
};