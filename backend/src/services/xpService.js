// XP, Tier, Streak, and Match Scoring Calculation Logic (FR-02, Phase 3)

import { checkBadges } from './badgeService.js';

export const RESULT_BONUS = {
  win: 100,
  draw: 50,
  loss: 25,
};

export const TIERS = [
  { id: 'rookie', name: 'Rookie', min: 0, color: '#AEB5DA' },
  { id: 'challenger', name: 'Challenger', min: 2000, color: '#6CC4FF' },
  { id: 'strategist', name: 'Strategist', min: 5000, color: '#3DD9A8' },
  { id: 'master', name: 'Master', min: 10000, color: '#C3A1FF' },
  { id: 'grandmaster', name: 'Grandmaster', min: 20000, color: '#FFC93C' },
];

export function tierFor(xp = 0) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (xp >= t.min) tier = t;
  }
  return tier;
}

export function tierProgress(xp = 0) {
  const current = tierFor(xp);
  const next = TIERS.find((t) => t.min > xp) || null;
  if (!next) {
    return { current, next: null, pct: 100, remaining: 0 };
  }
  const pct = Math.round((100 * (xp - current.min)) / (next.min - current.min));
  return { current, next, pct, remaining: next.min - xp };
}

export function dayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// Points for a correct answer: 100 base plus up to 50 for speed
export function scorePoints(remainingSeconds, totalSeconds = 15) {
  const ratio = clamp(remainingSeconds / totalSeconds, 0, 1);
  return 100 + Math.round(50 * ratio);
}

/**
 * Calculates outcome, bonuses, streak, badges, and next stats for a user
 * @param {Object} user Current user document / object
 * @param {Object} matchResult Match completion details
 */
export function calculateMatchProgress(user, matchResult) {
  const {
    categoryId,
    myScore = 0,
    oppScore = 0,
    forfeited = false,
    oppForfeit = false,
    correct = 0,
    total = 6,
    quick = 0,
    mode = 'live',
    oppName = 'Opponent',
  } = matchResult;

  let result;
  if (forfeited) result = 'loss';
  else if (oppForfeit) result = 'win';
  else result = myScore > oppScore ? 'win' : myScore < oppScore ? 'loss' : 'draw';

  const resultBonus = forfeited ? 0 : RESULT_BONUS[result];

  // Daily streak calculation
  const today = dayKey();
  let streak = user.streak || 0;
  let streakBonus = 0;
  if (user.lastPlayed !== today) {
    streak = user.lastPlayed === dayKey(-1) ? streak + 1 : 1;
    if (streak >= 2) {
      streakBonus = Math.min(streak, 7) * 10;
    }
  }

  // ISO weekly stats
  const currentWeek = weekKey();
  const currentWeekly = user.weekly?.key === currentWeek
    ? { ...user.weekly }
    : { key: currentWeek, xp: 0, matches: 0 };
  currentWeekly.matches += 1;

  // New win streak
  const winStreak = result === 'win' ? (user.winStreak || 0) + 1 : 0;

  // Category history
  const categoriesPlayed = Array.from(new Set([...(user.categoriesPlayed || []), categoryId]));

  const perfect = (user.perfect || 0) + (!forfeited && total > 0 && correct === total ? 1 : 0);
  const totalQuick = (user.quick || 0) + quick;

  // Temporary candidate stats to test badge qualification
  const candidateStats = {
    ...user,
    matches: (user.matches || 0) + 1,
    wins: (user.wins || 0) + (result === 'win' ? 1 : 0),
    losses: (user.losses || 0) + (result === 'loss' ? 1 : 0),
    draws: (user.draws || 0) + (result === 'draw' ? 1 : 0),
    winStreak,
    streak,
    perfect,
    quick: totalQuick,
    categoriesPlayed,
    weekly: currentWeekly,
  };

  const { newBadges, badgeBonus, allBadgeIds } = checkBadges(candidateStats, user.badges || []);

  const xpGained = myScore + resultBonus + streakBonus + badgeBonus;
  const newTotalXp = (user.xp || 0) + xpGained;
  currentWeekly.xp = (currentWeekly.xp || 0) + xpGained;

  const historyItem = {
    id: `h_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`,
    at: Date.now(),
    categoryId,
    oppName,
    myScore,
    oppScore,
    result,
    xp: xpGained,
    mode,
    forfeited: !!forfeited,
  };

  const updatedStats = {
    xp: newTotalXp,
    weekly: currentWeekly,
    matches: candidateStats.matches,
    wins: candidateStats.wins,
    losses: candidateStats.losses,
    draws: candidateStats.draws,
    winStreak,
    streak,
    lastPlayed: today,
    perfect,
    quick: totalQuick,
    categoriesPlayed,
    badges: allBadgeIds,
    history: [historyItem, ...(user.history || [])].slice(0, 30),
  };

  return {
    result,
    xpGained,
    breakdown: {
      match: myScore,
      result: resultBonus,
      streak: streakBonus,
      badges: badgeBonus,
    },
    newBadges,
    streak,
    updatedStats,
  };
}
