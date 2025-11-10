const mongoose = require('mongoose');

const roomKeyOfferSchema = new mongoose.Schema({
    roomId: String,
    fromUserId: String,
    toUserId: String,
    encryptedRoomKey: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoomKeyOffer', roomKeyOfferSchema);