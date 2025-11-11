const User = require('../models/User');
const jwt = require("jsonwebtoken");

// Crear usuario
exports.createUser = async (req, res) => {
  //TODO: hash password
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
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

// Login
exports.loginUser = async (req, res) => {
  try {
    const { name, password } = req.body;

    //Validaciones
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

    //Creación de token
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    const accessToken = jwt.sign(
      payload, 
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('accessToken', accessToken, {
        httpOnly: true, //accesible solo desde el server
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60
      })
    
    res.status(200).json({
      message: 'Login successful',
      user: payload,
      token: accessToken
    });

  } catch (error) {
    res.status(500).json({ message: 'An error occurred', error });
  }
};

exports.logoutUser = async (req, res) => {
  res
    res
    .clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    .status(200)
    .json({ message: 'Logout successful' });
}

exports.getCurrentUser = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    res.json({ id: decoded.id, name: decoded.name });
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
}

exports.getAllOtherUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id; // <-- lo obtienes del JWT
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('_id name email status'); // ajusta los campos a tu modelo

    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};