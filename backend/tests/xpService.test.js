import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchProgress,
  clamp,
  dayKey,
  scorePoints,
  tierFor,
  tierProgress,
  weekKey,
} from '../src/services/xpService.js';
import { checkBadges } from '../src/services/badgeService.js';

test('xpService: scorePoints calculates correct score based on remaining time', () => {
  // 15 seconds remaining out of 15 -> max speed bonus = 150
  assert.equal(scorePoints(15, 15), 150);
  // 0 seconds remaining -> 100 base
  assert.equal(scorePoints(0, 15), 100);
  // 7.5 seconds remaining -> 100 + round(50 * 0.5) = 125
  assert.equal(scorePoints(7.5, 15), 125);
});

test('xpService: tierFor and tierProgress return correct rank tiers', () => {
  assert.equal(tierFor(0).name, 'Rookie');
  assert.equal(tierFor(1999).name, 'Rookie');
  assert.equal(tierFor(2000).name, 'Challenger');
  assert.equal(tierFor(5000).name, 'Strategist');
  assert.equal(tierFor(10000).name, 'Master');
  assert.equal(tierFor(20000).name, 'Grandmaster');
  assert.equal(tierFor(35000).name, 'Grandmaster');

  const prog = tierProgress(2500); // Between Challenger (2000) and Strategist (5000)
  assert.equal(prog.current.name, 'Challenger');
  assert.equal(prog.next.name, 'Strategist');
  assert.equal(prog.remaining, 2500);
  assert.equal(prog.pct, 17);
});

test('xpService: dayKey and weekKey format validation', () => {
  const today = dayKey();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);

  const thisWeek = weekKey();
  assert.match(thisWeek, /^\d{4}-W\d{2}$/);
});

test('badgeService: unlocks first_win, hat_trick, veteran, and calculates bonuses', () => {
  // Brand new player wins their first match
  const stats1 = { wins: 1, winStreak: 1, matches: 1 };
  const res1 = checkBadges(stats1, []);
  assert.ok(res1.newBadges.some((b) => b.id === 'first_win'));
  assert.equal(res1.badgeBonus, 50);

  // Player gets 3 win streak
  const stats2 = { wins: 3, winStreak: 3, matches: 3 };
  const res2 = checkBadges(stats2, ['first_win']);
  assert.ok(res2.newBadges.some((b) => b.id === 'hat_trick'));
  assert.equal(res2.badgeBonus, 75);

  // Player hits 10 matches
  const stats3 = { wins: 5, winStreak: 1, matches: 10 };
  const res3 = checkBadges(stats3, ['first_win']);
  assert.ok(res3.newBadges.some((b) => b.id === 'veteran'));
  assert.equal(res3.badgeBonus, 120);
});

test('xpService: calculateMatchProgress handles win bonus, streak bonus, and updates stats', () => {
  const user = {
    xp: 1000,
    matches: 2,
    wins: 1,
    losses: 1,
    draws: 0,
    winStreak: 0,
    streak: 1,
    lastPlayed: dayKey(-1), // played yesterday -> streak will increment to 2!
    categoriesPlayed: ['technical'],
    badges: ['first_win'],
    weekly: { key: weekKey(), xp: 500, matches: 2 },
  };

  const matchData = {
    categoryId: 'aptitude',
    myScore: 450,
    oppScore: 300,
    forfeited: false,
    correct: 4,
    total: 6,
    quick: 2,
    mode: 'live',
    oppName: 'Rohan Mehta',
  };

  const outcome = calculateMatchProgress(user, matchData);

  assert.equal(outcome.result, 'win');
  assert.equal(outcome.breakdown.result, 100); // 100 XP for win
  assert.equal(outcome.streak, 2);
  assert.equal(outcome.breakdown.streak, 20); // 2 * 10 = 20 streak bonus
  assert.equal(outcome.xpGained, 450 + 100 + 20); // 570 total

  assert.equal(outcome.updatedStats.xp, 1570);
  assert.equal(outcome.updatedStats.wins, 2);
  assert.equal(outcome.updatedStats.matches, 3);
  assert.equal(outcome.updatedStats.winStreak, 1);
  assert.deepEqual(outcome.updatedStats.categoriesPlayed, ['technical', 'aptitude']);
});

test('xpService: calculateMatchProgress handles forfeited match (0 result bonus, loss)', () => {
  const user = {
    xp: 500,
    matches: 1,
    wins: 1,
    losses: 0,
    draws: 0,
    winStreak: 1,
    streak: 1,
    lastPlayed: dayKey(),
    badges: [],
  };

  const matchData = {
    categoryId: 'logic',
    myScore: 200,
    oppScore: 300,
    forfeited: true,
  };

  const outcome = calculateMatchProgress(user, matchData);

  assert.equal(outcome.result, 'loss');
  assert.equal(outcome.breakdown.result, 0); // forfeited gets 0 result bonus
  assert.equal(outcome.updatedStats.losses, 1);
  assert.equal(outcome.updatedStats.winStreak, 0);
});
