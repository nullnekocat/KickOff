const User = require('../models/User');

// Crear usuario
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error); // 👈 agrega esto
    res.status(500).json({ message: 'An error occurred', error });
  }
};


// Actualizar usuario (general)
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: req.body },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred', error });
  }
};

// Actualizar status a 1 (online)
exports.setOnline = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status: 1 } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User is now online', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error });
  }
};

// Login simple
exports.loginUser = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred', error });
  }
};
