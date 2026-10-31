import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { runSeed } from '../seeds/seedRunner.js';
import { User } from '../models/User.js';
import { Question } from '../models/Question.js';
import { Category } from '../models/Category.js';
import { Match } from '../models/Match.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Admin dashboard summary stats
router.get('/stats', async (req, res, next) => {
  try {
    const [playersCount, questionsCount, categoriesCount, matchesCount] = await Promise.all([
      User.countDocuments({ role: 'player' }),
      Question.countDocuments(),
      Category.countDocuments(),
      Match.countDocuments(),
    ]);

    res.json({
      ok: true,
      stats: {
        players: playersCount,
        questions: questionsCount,
        categories: categoriesCount,
        matches: matchesCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Reset categories and questions to defaults
router.post('/reset-demo', async (req, res, next) => {
  try {
    await runSeed();
    res.json({ ok: true, message: 'Sample categories and questions reset to defaults.' });
  } catch (err) {
    next(err);
  }
});

export default router;
