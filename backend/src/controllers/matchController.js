import { Match } from '../models/Match.js';
import { MatchDraft } from '../models/MatchDraft.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { calculateMatchProgress, tierFor } from '../services/xpService.js';

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function createMatch(req, res, next) {
  try {
    const { categoryId, mode = 'live', opponent } = req.body;
    const count = 6;

    if (!categoryId) {
      return res.status(400).json({ ok: false, message: 'categoryId is required' });
    }

    const pool = await Question.find({
      categoryId,
      status: 'published',
    }).lean();

    if (pool.length < 3) {
      return res.status(400).json({
        ok: false,
        message: 'Category does not have enough published questions to start a duel.',
      });
    }

    const shuffledQuestions = shuffle(pool)
      .slice(0, count)
      .map((item) => {
        const order = shuffle(item.options.map((text, i) => ({ text, i })));
        return {
          id: item.id,
          categoryId: item.categoryId,
          text: item.text,
          difficulty: item.difficulty,
          options: order.map((o) => o.text),
          answer: order.findIndex((o) => o.i === item.answer),
        };
      });

    const matchId = `m_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-3)}`;

    const match = await Match.create({
      matchId,
      categoryId,
      mode,
      status: 'in_progress',
      players: [
        {
          userId: req.user._id.toString(),
          name: req.user.name,
          avatarColor: req.user.avatarColor,
          score: 0,
        },
        ...(opponent
          ? [
              {
                userId: opponent.id || 'bot',
                name: opponent.name || 'Opponent',
                avatarColor: opponent.avatarColor,
                score: 0,
              },
            ]
          : []),
      ],
      questions: shuffledQuestions,
    });

    res.status(201).json({
      ok: true,
      matchId: match.matchId,
      categoryId,
      questions: shuffledQuestions,
    });
  } catch (err) {
    next(err);
  }
}

export async function recordMatch(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const outcome = calculateMatchProgress(user.toObject(), req.body);

    // Apply stats update atomically
    Object.assign(user, outcome.updatedStats);
    await user.save();

    // Clear any draft in progress since match concluded
    await MatchDraft.deleteOne({ userId });

    const currentTier = tierFor(user.xp);

    res.json({
      ok: true,
      result: outcome.result,
      xpGained: outcome.xpGained,
      breakdown: outcome.breakdown,
      newBadges: outcome.newBadges,
      streak: outcome.streak,
      after: {
        xp: user.xp,
        tier: currentTier,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Disconnect Persistence Endpoints (Phase 2 & NFR-04)
export async function saveDraft(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const {
      categoryId,
      mode = 'live',
      oppName = 'Opponent',
      myScore = 0,
      oppScore = 0,
      correct = 0,
      total = 6,
      quick = 0,
    } = req.body;

    const draft = await MatchDraft.findOneAndUpdate(
      { userId },
      {
        userId,
        categoryId,
        mode,
        oppName,
        myScore,
        oppScore,
        correct,
        total,
        quick,
        savedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, draft: draft.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function getDraft(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const draft = await MatchDraft.findOne({ userId }).lean();

    res.json({ ok: true, draft: draft || null });
  } catch (err) {
    next(err);
  }
}

export async function clearDraft(req, res, next) {
  try {
    const userId = req.user._id.toString();
    await MatchDraft.deleteOne({ userId });

    res.json({ ok: true, message: 'Draft cleared.' });
  } catch (err) {
    next(err);
  }
}

export async function recoverDraft(req, res, next) {
  try {
    const userId = req.user._id.toString();
    const draft = await MatchDraft.findOne({ userId });

    if (!draft) {
      return res.json({ ok: true, recovered: false, summary: null });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Recover match as forfeited so the player keeps earned score & daily streak
    const outcome = calculateMatchProgress(user.toObject(), {
      ...draft.toObject(),
      forfeited: true,
    });

    Object.assign(user, outcome.updatedStats);
    await user.save();

    await MatchDraft.deleteOne({ userId });

    res.json({
      ok: true,
      recovered: true,
      summary: {
        result: outcome.result,
        xpGained: outcome.xpGained,
        breakdown: outcome.breakdown,
        streak: outcome.streak,
        newBadges: outcome.newBadges,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('history').lean();
    res.json({ ok: true, history: user?.history || [] });
  } catch (err) {
    next(err);
  }
}
