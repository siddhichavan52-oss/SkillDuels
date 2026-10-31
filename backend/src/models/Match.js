import mongoose from 'mongoose';

const AnswerRecordSchema = new mongoose.Schema(
  {
    q: Number,
    choice: Number,
    correct: Boolean,
    points: Number,
    time: Number,
  },
  { _id: false }
);

const PlayerRecordSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    avatarColor: String,
    score: { type: Number, default: 0 },
    forfeited: { type: Boolean, default: false },
    answers: [AnswerRecordSchema],
  },
  { _id: false }
);

const MatchSchema = new mongoose.Schema(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['live', 'bot'],
      default: 'live',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'forfeited', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    players: [PlayerRecordSchema],
    questions: [
      {
        id: String,
        text: String,
        options: [String],
        answer: Number,
        difficulty: String,
      },
    ],
    winnerId: {
      type: String,
      default: null,
    },
    resultSummary: {
      type: String,
      default: null,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-performance compound index for player history queries (NFR-01)
MatchSchema.index({ 'players.userId': 1, createdAt: -1 });

export const Match = mongoose.model('Match', MatchSchema);
