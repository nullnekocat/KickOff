const jwt = require('jsonwebtoken');

function authToken(req, res, next) {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('❌ Invalid token:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

module.exports = authToken;