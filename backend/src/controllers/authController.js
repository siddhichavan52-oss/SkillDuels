import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { tierProgress } from '../services/xpService.js';

const AVATAR_COLORS = [
  '#FFC93C',
  '#3DD9A8',
  '#C3A1FF',
  '#6CC4FF',
  '#FF9DBB',
  '#8EE3E0',
  '#FFB07A',
];

function signToken(userId, role) {
  return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({
        ok: false,
        errors: { email: 'An account with this email already exists. Log in instead.' },
      });
    }

    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? 'admin' : 'player';

    const user = await User.create({
      name,
      email,
      password,
      role,
      avatarColor,
    });

    const token = signToken(user._id, user.role);

    res.status(201).json({
      ok: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        ok: false,
        errors: { form: 'Email or password is incorrect. Check both and try again.' },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        errors: { form: 'Email or password is incorrect. Check both and try again.' },
      });
    }

    const token = signToken(user._id, user.role);

    res.json({
      ok: true,
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = req.user.toJSON();
    const progress = tierProgress(user.xp);

    res.json({
      ok: true,
      user,
      tierProgress: progress,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.json({
    ok: true,
    message: 'Logged out successfully',
  });
}
