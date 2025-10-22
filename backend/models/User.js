const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // evita duplicados
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 0 // 0 = offline, 1 = online
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Modelo
const User = mongoose.model('User', UserSchema);

module.exports = User;
