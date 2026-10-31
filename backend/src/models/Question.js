import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    categoryId: {
      type: String,
      required: [true, 'Category ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [10, 'Question must be at least 10 characters'],
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: 'Question must have exactly 4 options',
      },
    },
    answer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    status: {
      type: String,
      enum: ['published', 'hidden'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-performance compound index for match pool selection (NFR-01)
QuestionSchema.index({ categoryId: 1, status: 1 });

export const Question = mongoose.model('Question', QuestionSchema);
