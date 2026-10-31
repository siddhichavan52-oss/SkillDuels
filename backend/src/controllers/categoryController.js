import { Category } from '../models/Category.js';
import { Question } from '../models/Question.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function getAllCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ createdAt: 1 }).lean();

    // High performance aggregation to count published questions per category
    const questionCounts = await Question.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(questionCounts.map((q) => [q._id, q.count]));

    const result = categories.map((c) => ({
      ...c,
      playableCount: countMap.get(c.id) || 0,
      canPlay: (countMap.get(c.id) || 0) >= 3,
    }));

    res.json({ ok: true, categories: result });
  } catch (err) {
    next(err);
  }
}

export async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ id }).lean();
    if (!category) {
      return res.status(404).json({ ok: false, message: 'Category not found' });
    }

    const questionCount = await Question.countDocuments({
      categoryId: id,
      status: 'published',
    });

    res.json({
      ok: true,
      category: {
        ...category,
        playableCount: questionCount,
        canPlay: questionCount >= 3,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description, icon, color } = req.body;

    const baseSlug = slugify(name);
    const existing = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(400).json({
        ok: false,
        errors: { name: 'A category with this name already exists.' },
      });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const id = `${baseSlug}-${randomSuffix}`;

    const category = await Category.create({
      id,
      name,
      description,
      icon: icon || 'code',
      color: color || '#6CC4FF',
    });

    res.status(201).json({ ok: true, category: category.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const category = await Category.findOne({ id });
    if (!category) {
      return res.status(404).json({ ok: false, message: 'Category not found' });
    }

    // Check duplicate name on another category
    const duplicate = await Category.findOne({
      id: { $ne: id },
      name: new RegExp(`^${name}$`, 'i'),
    });
    if (duplicate) {
      return res.status(400).json({
        ok: false,
        errors: { name: 'A category with this name already exists.' },
      });
    }

    category.name = name;
    category.description = description;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.json({ ok: true, category: category.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const category = await Category.findOneAndDelete({ id });
    if (!category) {
      return res.status(404).json({ ok: false, message: 'Category not found' });
    }

    // Cascade delete associated questions
    await Question.deleteMany({ categoryId: id });

    res.json({ ok: true, message: 'Category and associated questions deleted.' });
  } catch (err) {
    next(err);
  }
}
