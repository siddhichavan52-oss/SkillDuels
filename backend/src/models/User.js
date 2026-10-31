import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['player', 'admin'],
      default: 'player',
      index: true,
    },
    avatarColor: {
      type: String,
      default: '#FFC93C',
    },
    xp: {
      type: Number,
      default: 0,
      index: true,
    },
    weekly: {
      key: { type: String, default: '' },
      xp: { type: Number, default: 0 },
      matches: { type: Number, default: 0 },
    },
    matches: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    draws: {
      type: Number,
      default: 0,
    },
    winStreak: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastPlayed: {
      type: String,
      default: null,
    },
    perfect: {
      type: Number,
      default: 0,
    },
    quick: {
      type: Number,
      default: 0,
    },
    categoriesPlayed: {
      type: [String],
      default: [],
    },
    badges: {
      type: [String],
      default: [],
    },
    history: {
      type: [
        {
          id: String,
          at: Number,
          categoryId: String,
          oppName: String,
          myScore: Number,
          oppScore: Number,
          result: { type: String, enum: ['win', 'loss', 'draw'] },
          xp: Number,
          mode: String,
          forfeited: Boolean,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-performance compound indexes (NFR-01)
UserSchema.index({ role: 1, xp: -1, name: 1 });
UserSchema.index({ 'weekly.key': 1, 'weekly.xp': -1 });

// Password hashing middleware
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', UserSchema);
