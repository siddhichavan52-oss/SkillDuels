import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

// Strict Rate Limiter for Authentication Endpoints (Brute-force protection, NFR-02)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENV.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});
