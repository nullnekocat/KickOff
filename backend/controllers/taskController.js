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

        await Group.findByIdAndUpdate(groupId, { $push: { tasks: newTask._id } });
        const populatedTask = await Task.findById(newTask._id).populate('inChargeId', 'name email');

        // Emitir actualización via socket al grupo (excluir creador cuando sea posible)
        try {
            const io = global._io;
            const userSockets = global._userSockets || {};
            const senderSocketId = userSockets[req.user?.id];
            if (io) {
                if (senderSocketId && typeof io.to === 'function' && typeof io.to(String(groupId)).except === 'function') {
                    io.to(String(groupId)).except(senderSocketId).emit('task:new', populatedTask);
                } else {
                    io.to(String(groupId)).emit('task:new', populatedTask);
                }
            }
        } catch (emitErr) {
            console.warn('⚠️ No se pudo emitir task:new:', emitErr);
        }

        res.status(201).json(populatedTask);
    } catch (err) {
        console.error('❌ Error al crear tarea:', err);
        res.status(500).json({ message: 'Error al crear tarea.' });
    }
};

// Obtener todas las tareas de un grupo
exports.getTasksByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        // Por defecto sólo devolver tareas no ocultas
        const tasks = await Task.find({ groupId, hidden: false }).populate('inChargeId', 'name');
        res.json(tasks);
    } catch (err) {
        console.error('❌ Error al obtener tareas:', err);
        res.status(500).json({ message: 'Error al obtener tareas.' });
    }
};

// Obtener tareas ocultas de un grupo
exports.getHiddenTasksByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const tasks = await Task.find({ groupId, hidden: true }).populate('inChargeId', 'name');
        res.json(tasks);
    } catch (err) {
        console.error('❌ Error al obtener tareas ocultas:', err);
        res.status(500).json({ message: 'Error al obtener tareas ocultas.' });
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
        const populated = await Task.findById(task._id).populate('inChargeId', 'name email');

        try {
            const io = global._io;
            const userSockets = global._userSockets || {};
            const senderSocketId = userSockets[req.user?.id];
            if (io) {
                if (senderSocketId && typeof io.to === 'function' && typeof io.to(String(populated.groupId)).except === 'function') {
                    io.to(String(populated.groupId)).except(senderSocketId).emit('task:toggle', populated);
                } else {
                    io.to(String(populated.groupId)).emit('task:toggle', populated);
                }
            }
        } catch (emitErr) {
            console.warn('⚠️ No se pudo emitir task:toggle:', emitErr);
        }

        res.json(populated);
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
        // Sólo permitir eliminar si la tarea ya está oculta
        if (!task.hidden) {
            return res.status(400).json({ message: 'La tarea debe estar oculta antes de eliminarla.' });
        }

        await Task.findByIdAndDelete(taskId);
        await Group.findByIdAndUpdate(task.groupId, { $pull: { tasks: taskId } });

        try {
            const io = global._io;
            const userSockets = global._userSockets || {};
            const senderSocketId = userSockets[req.user?.id];
            if (io) {
                if (senderSocketId && typeof io.to === 'function' && typeof io.to(String(task.groupId)).except === 'function') {
                    io.to(String(task.groupId)).except(senderSocketId).emit('task:delete', taskId);
                } else {
                    io.to(String(task.groupId)).emit('task:delete', taskId);
                }
            }
        } catch (emitErr) {
            console.warn('⚠️ No se pudo emitir task:delete:', emitErr);
        }

        res.json({ message: 'Tarea eliminada correctamente.' });
    } catch (err) {
        console.error('❌ Error al eliminar tarea:', err);
        res.status(500).json({ message: 'Error al eliminar tarea.' });
    }
};

// Marcar/Desmarcar tarea como oculta (no la borra)
exports.setTaskHidden = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { hidden } = req.body;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        task.hidden = !!hidden;
        await task.save();

        const populated = await Task.findById(task._id).populate('inChargeId', 'name email');

        // Emitir evento de hide al grupo (excluir originador cuando sea posible)
        try {
            const io = global._io;
            const userSockets = global._userSockets || {};
            const senderSocketId = userSockets[req.user?.id];
            if (io) {
                if (senderSocketId && typeof io.to === 'function' && typeof io.to(String(populated.groupId)).except === 'function') {
                    io.to(String(populated.groupId)).except(senderSocketId).emit('task:hide', populated);
                } else {
                    io.to(String(populated.groupId)).emit('task:hide', populated);
                }
            }
        } catch (emitErr) {
            console.warn('⚠️ No se pudo emitir task:hide:', emitErr);
        }

        res.json(populated);
    } catch (err) {
        console.error('❌ Error al setear hidden en tarea:', err);
        res.status(500).json({ message: 'Error al actualizar visibilidad de la tarea.' });
    }
};