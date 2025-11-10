const Message = require('../models/Message');

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

    // Obtener todos los mensajes de un room
    exports.getMessagesByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) return res.status(400).json({ message: 'roomId requerido' });

        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error('❌ Error al obtener mensajes:', error);
        res.status(500).json({ message: 'Error al obtener mensajes', error });
    }
};