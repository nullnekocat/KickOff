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
        maxAge: 1000 * 60 * 60 * 24 //24h
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

exports.getMyDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id).select('_id name email points dailyStreak streakDate');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Error al obtener detalles del usuario:', err);
    res.status(500).json({ message: 'Error fetching user details' });
  }
}

exports.adjustPoints = async (req, res) => {
  try {
    const id = req.user.id;
    const { delta } = req.body;
    if (typeof delta !== 'number') return res.status(400).json({ message: 'delta number required' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.points = (user.points || 0) + delta;
    await user.save();

    // Emit real-time update so ranking and other clients can refresh live
    try {
      if (global._io) {
        global._io.emit('user:points-updated', { userId: user._id, points: user.points, dailyStreak: user.dailyStreak });
      }
    } catch (e) {
      console.warn('Could not emit socket event user:points-updated', e);
    }

    res.json({ points: user.points });
  } catch (err) {
    console.error('❌ Error al ajustar puntos:', err);
    res.status(500).json({ message: 'Error adjusting points' });
  }
}

exports.getAllOtherUsers = async (req, res) => {
  try {
    // Return all users with points and dailyStreak, sorted descending by points
    const users = await User.find({})
      .select('_id name email points dailyStreak status')
      .sort({ points: -1 });

    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};