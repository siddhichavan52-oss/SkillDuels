import { User } from '../models/User.js';
import { tierFor, weekKey } from '../services/xpService.js';

export async function getGlobalLeaderboard(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const search = (req.query.q || '').trim();

    const matchStage = {
      role: { $ne: 'admin' },
      ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
    };

    // High performance aggregation pipeline with ranking and pagination (NFR-01)
    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          id: { $toString: '$_id' },
          name: 1,
          avatarColor: 1,
          xp: 1,
          matches: 1,
          wins: 1,
          losses: 1,
          draws: 1,
          winRate: {
            $cond: [
              { $gt: ['$matches', 0] },
              { $round: [{ $multiply: [{ $divide: ['$wins', '$matches'] }, 100] }, 0] },
              0,
            ],
          },
        },
      },
      { $sort: { xp: -1, name: 1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const [result] = await User.aggregate(pipeline);
    const total = result.metadata[0]?.total || 0;
    const users = (result.data || []).map((u, index) => ({
      ...u,
      rank: skip + index + 1,
      tier: tierFor(u.xp),
    }));

    // Find requesting user's global rank if authenticated
    let userRank = null;
    if (req.user && req.user.role !== 'admin') {
      const higherCount = await User.countDocuments({
        role: { $ne: 'admin' },
        xp: { $gt: req.user.xp },
      });
      userRank = higherCount + 1;
    }

    res.json({
      ok: true,
      kind: 'global',
      total,
      page,
      limit,
      userRank,
      leaderboard: users,
    });
  } catch (err) {
    next(err);
  }
}

export async function getWeeklyLeaderboard(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const search = (req.query.q || '').trim();
    const currentWeek = weekKey();

    const matchStage = {
      role: { $ne: 'admin' },
      ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
    };

    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          id: { $toString: '$_id' },
          name: 1,
          avatarColor: 1,
          xp: {
            $cond: [
              { $eq: ['$weekly.key', currentWeek] },
              { $ifNull: ['$weekly.xp', 0] },
              0,
            ],
          },
          matches: {
            $cond: [
              { $eq: ['$weekly.key', currentWeek] },
              { $ifNull: ['$weekly.matches', 0] },
              0,
            ],
          },
          allTimeXp: '$xp',
        },
      },
      { $sort: { xp: -1, name: 1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const [result] = await User.aggregate(pipeline);
    const total = result.metadata[0]?.total || 0;
    const users = (result.data || []).map((u, index) => ({
      ...u,
      rank: skip + index + 1,
      tier: tierFor(u.allTimeXp),
    }));

    let userWeeklyRank = null;
    if (req.user && req.user.role !== 'admin') {
      const myWeeklyXp = req.user.weekly?.key === currentWeek ? req.user.weekly.xp : 0;
      const higherCount = await User.countDocuments({
        role: { $ne: 'admin' },
        'weekly.key': currentWeek,
        'weekly.xp': { $gt: myWeeklyXp },
      });
      userWeeklyRank = higherCount + 1;
    }

    res.json({
      ok: true,
      kind: 'weekly',
      weekKey: currentWeek,
      total,
      page,
      limit,
      userRank: userWeeklyRank,
      leaderboard: users,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRanks(req, res, next) {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      return res.json({ ok: true, admin: true, message: 'Admins are excluded from rankings.' });
    }

    const currentWeek = weekKey();
    const myWeeklyXp = user.weekly?.key === currentWeek ? user.weekly.xp : 0;

    const [globalRankCount, weeklyRankCount] = await Promise.all([
      User.countDocuments({
        role: { $ne: 'admin' },
        xp: { $gt: user.xp },
      }),
      User.countDocuments({
        role: { $ne: 'admin' },
        'weekly.key': currentWeek,
        'weekly.xp': { $gt: myWeeklyXp },
      }),
    ]);

    res.json({
      ok: true,
      globalRank: globalRankCount + 1,
      weeklyRank: weeklyRankCount + 1,
      xp: user.xp,
      weeklyXp: myWeeklyXp,
      tier: tierFor(user.xp),
    });
  } catch (err) {
    next(err);
  }
}
