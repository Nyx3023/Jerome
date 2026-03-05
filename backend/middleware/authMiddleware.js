const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Set the user data in the request
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// Middleware for authenticated users
const requireAuth = (req, res, next) => {
    authMiddleware(req, res, next);
};

// Middleware for admin, staff, or doctor roles
const requireAdminStaffDoctor = (req, res, next) => {
    authMiddleware(req, res, (err) => {
        if (err) return;
        
        if (!['admin', 'staff', 'doctor'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied. Admin, Staff, or Doctor role required." });
        }
        next();
    });
};

// Middleware for admin or staff roles
const requireAdminOrStaff = (req, res, next) => {
    authMiddleware(req, res, (err) => {
        if (err) return;
        
        if (!['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied. Admin or Staff role required." });
        }
        next();
    });
};

module.exports = {
    authMiddleware,
    requireAuth,
    requireAdminStaffDoctor,
    requireAdminOrStaff
};
