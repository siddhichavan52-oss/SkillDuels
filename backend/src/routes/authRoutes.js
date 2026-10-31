import { Router } from 'express';
import { getMe, login, logout, register } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validateLogin, validateRegister } from '../middlewares/validate.js';

const router = Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
