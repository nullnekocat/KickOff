const Message = require('../models/Message');
const User = require('../models/User');

// Crear y guardar un nuevo mensaje
exports.createMessage = async (req, res) => {
    try {
        const { roomId, senderId, text, isEncrypted } = req.body;

        if (!roomId || !senderId) {
            return res.status(400).json({ message: 'roomId y senderId son requeridos' });
        }

        const newMessage = new Message({
            roomId,
            senderId,
            text,
            isEncrypted
        });

        const saved = await newMessage.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error('❌ Error al crear mensaje:', error);
        res.status(500).json({ message: 'Error al crear mensaje', error });
    }
};

exports.getMessagesByRoom = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

        // Enriquecer mensajes con nombres reales
        const messagesWithNames = await Promise.all(messages.map(async (m) => {
            const user = await User.findById(m.senderId).select('name');
            return {
                ...m.toObject(),
                senderName: user ? user.name : 'Usuario desconocido'
            };
        }));

        res.json(messagesWithNames);
    } catch (err) {
        console.error('❌ Error al obtener mensajes:', err);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};