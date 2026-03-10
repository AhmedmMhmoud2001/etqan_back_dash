const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/response');
const { prisma } = require('../prisma/client');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });
    if (!user) return error(res, 'User not found.', 401);
    if (!user.isActive) return error(res, 'Account is deactivated.', 403);
    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return error(res, 'Token expired.', 401);
    if (e.name === 'JsonWebTokenError') return error(res, 'Invalid token.', 401);
    next(e);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized.', 401);
  if (!roles.includes(req.user.role)) {
    return error(res, 'Forbidden. Insufficient permissions.', 403);
  }
  next();
};

/** Optional auth: sets req.user if valid token present, does not fail if missing */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });
    if (user && user.isActive) req.user = user;
  } catch (_) { /* ignore */ }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
