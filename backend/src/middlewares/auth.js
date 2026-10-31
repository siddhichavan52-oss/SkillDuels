import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Authentication required. Missing or malformed token.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Optional Auth Middleware (attaches user if valid token present, otherwise proceeds as guest)
export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const user = await User.findById(decoded.id).lean();
        if (user) req.user = user;
      } catch {
        // ignore invalid token for optional auth
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Role-Based Access Control Middleware (NFR-03)
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      ok: false,
      message: 'Forbidden: Admin access required.',
    });
  }
  next();
}
