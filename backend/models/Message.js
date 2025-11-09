const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    media: {
        url: { type: String, default: null },     // URL del archivo (si existe)
        type: { type: String, enum: ['image', 'video', 'audio', 'file', null], default: null }, // tipo de archivo
        name: { type: String, default: null }     // nombre original del archivo
    },
    isEncrypted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;