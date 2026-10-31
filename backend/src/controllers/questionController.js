import { Question } from '../models/Question.js';
import { Category } from '../models/Category.js';

export async function getQuestions(req, res, next) {
  try {
    const { categoryId, status } = req.query;
    const filter = {};

    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, count: questions.length, questions });
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const { categoryId, text, options, answer, difficulty } = req.body;

    const categoryExists = await Category.findOne({ id: categoryId });
    if (!categoryExists) {
      return res.status(400).json({
        ok: false,
        errors: { categoryId: 'Selected category does not exist.' },
      });
    }

    const id = `q_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-3)}`;

    const question = await Question.create({
      id,
      categoryId,
      text,
      options,
      answer,
      difficulty: difficulty || 'easy',
      status: 'published',
    });

    res.status(201).json({ ok: true, question: question.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const { categoryId, text, options, answer, difficulty } = req.body;

    const question = await Question.findOne({ id });
    if (!question) {
      return res.status(404).json({ ok: false, message: 'Question not found' });
    }

    if (categoryId && categoryId !== question.categoryId) {
      const categoryExists = await Category.findOne({ id: categoryId });
      if (!categoryExists) {
        return res.status(400).json({
          ok: false,
          errors: { categoryId: 'Selected category does not exist.' },
        });
      }
      question.categoryId = categoryId;
    }

    question.text = text;
    question.options = options;
    question.answer = answer;
    if (difficulty) question.difficulty = difficulty;

    await question.save();

    res.json({ ok: true, question: question.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;

    const question = await Question.findOneAndDelete({ id });
    if (!question) {
      return res.status(404).json({ ok: false, message: 'Question not found' });
    }

    res.json({ ok: true, message: 'Question deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function setQuestionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'hidden'].includes(status)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid status. Must be "published" or "hidden".',
      });
    }

    const question = await Question.findOne({ id });
    if (!question) {
      return res.status(404).json({ ok: false, message: 'Question not found' });
    }

    question.status = status;
    await question.save();

    res.json({ ok: true, question: question.toJSON() });
  } catch (err) {
    next(err);
  }
}
