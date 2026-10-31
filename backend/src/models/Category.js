import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [30, 'Name cannot exceed 30 characters'],
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    icon: {
      type: String,
      default: 'code',
    },
    color: {
      type: String,
      default: '#6CC4FF',
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

export const Category = mongoose.model('Category', CategorySchema);
