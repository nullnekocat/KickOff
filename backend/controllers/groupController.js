const Group = require('../models/Group');
const Task = require('../models/Task');

// Crear un nuevo grupo
exports.createGroup = async (req, res) => {
    try {
        const { name, members } = req.body;
        const ownerId = req.user.id;

        // Incluimos al creador automáticamente si no está
        const uniqueMembers = [...new Set([...members, ownerId])];

        const group = new Group({
            name,
            ownerId,
            members: uniqueMembers
        });

        await group.save();

        try {
            // Emitir evento a cada miembro si está conectado por socket
            const io = global._io;
            const userSockets = global._userSockets;

            if (io && userSockets) {
                const payload = {
                    _id: group._id,
                    name: group.name,
                    ownerId: group.ownerId,
                    members: group.members,
                    tasks: group.tasks,
                    createdAt: group.createdAt
                };

                for (const memberId of group.members.map(m => m.toString())) {
                    const sockId = userSockets[memberId];
                    if (sockId) {
                        io.to(sockId).emit('grupo:nuevo', payload);
                    }
                }
            }
        } catch (emitErr) {
            console.warn('⚠️ No se pudo emitir grupo:nuevo:', emitErr);
        }

        await group.populate('members', 'name email');
        res.status(201).json(group);
    } catch (err) {
        console.error('❌ Error al crear grupo:', err);
        res.status(500).json({ message: 'Error al crear el grupo' });
    }
};

// Obtener todos los grupos del usuario
exports.getMyGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await Group.find({ members: userId })
            .populate('members', 'name email')
            .populate({
                path: 'tasks',
                populate: { path: 'inChargeId', select: 'name dailyStreak points streakDate' }
            })
            .exec();

        res.json(groups);
    } catch (err) {
        console.error('❌ Error al obtener grupos:', err);
        res.status(500).json({ message: 'Error al obtener los grupos' });
    }
};

// Agregar tarea a un grupo
exports.addTaskToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, inChargeId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

        const task = new Task({
            text,
            inChargeId,
            groupId
        });
        await task.save();

        // Añadir referencia al grupo
        group.tasks.push(task._id);
        await group.save();

        res.status(201).json(task);
    } catch (err) {
        console.error('❌ Error al agregar tarea:', err);
        res.status(500).json({ message: 'Error al agregar tarea al grupo' });
    }
};

// Eliminar grupo y sus tareas asociadas
exports.deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Grupo no encontrado' });

        await Task.deleteMany({ groupId });
        await Group.findByIdAndDelete(groupId);

        res.json({ message: 'Grupo y sus tareas eliminados correctamente' });
    } catch (err) {
        console.error('❌ Error al eliminar grupo:', err);
        res.status(500).json({ message: 'Error al eliminar grupo' });
    }
};
