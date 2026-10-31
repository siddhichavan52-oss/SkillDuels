import mongoose from 'mongoose';

// Disconnect Recovery Draft Schema (NFR-04)
// Stores active duel state after each answer.
// If the tab closes or connection drops, progress is safely preserved.

const MatchDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    categoryId: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      default: 'live',
    },
    oppName: {
      type: String,
      default: 'Opponent',
    },
    myScore: {
      type: Number,
      default: 0,
    },
    oppScore: {
      type: Number,
      default: 0,
    },
    correct: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 6,
    },
    quick: {
      type: Number,
      default: 0,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
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

// Auto-expire drafts older than 7 days if abandoned
MatchDraftSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

export const MatchDraft = mongoose.model('MatchDraft', MatchDraftSchema);
