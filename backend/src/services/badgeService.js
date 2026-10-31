// Badges configuration and validation logic (FR-10)

export const BADGES = [
  {
    id: 'first_win',
    name: 'Opening move',
    description: 'Win your first duel.',
    icon: 'swords',
    bonus: 50,
    test: (u) => (u.wins || 0) >= 1,
  },
  {
    id: 'hat_trick',
    name: 'Hat-trick',
    description: 'Win three duels in a row.',
    icon: 'flame',
    bonus: 75,
    test: (u) => (u.winStreak || 0) >= 3,
  },
  {
    id: 'streak_3',
    name: 'Three-day streak',
    description: 'Play on three days in a row.',
    icon: 'bolt',
    bonus: 60,
    test: (u) => (u.streak || 0) >= 3,
  },
  {
    id: 'week_warrior',
    name: 'Week warrior',
    description: 'Play five duels in one week.',
    icon: 'shield',
    bonus: 100,
    test: (u) => (u.weekly?.matches || 0) >= 5,
  },
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description: 'Answer every question correctly in a duel.',
    icon: 'target',
    bonus: 80,
    test: (u) => (u.perfect || 0) >= 1,
  },
  {
    id: 'quick_draw',
    name: 'Quick draw',
    description: 'Land 10 correct answers within 3 seconds.',
    icon: 'clock',
    bonus: 60,
    test: (u) => (u.quick || 0) >= 10,
  },
  {
    id: 'polymath',
    name: 'Polymath',
    description: 'Play duels in three different categories.',
    icon: 'globe',
    bonus: 100,
    test: (u) => (u.categoriesPlayed || []).length >= 3,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Complete 10 duels.',
    icon: 'medal',
    bonus: 120,
    test: (u) => (u.matches || 0) >= 10,
  },
];

/**
 * Checks all badges against user's updated stats.
 * Returns newly unlocked badges and total bonus XP.
 */
export function checkBadges(userStats, currentBadgeIds = []) {
  const newBadges = [];
  let badgeBonus = 0;
  const existingSet = new Set(currentBadgeIds);

  for (const b of BADGES) {
    if (!existingSet.has(b.id) && b.test(userStats)) {
      newBadges.push(b);
      badgeBonus += b.bonus;
      existingSet.add(b.id);
    }
  }

  return {
    newBadges,
    badgeBonus,
    allBadgeIds: Array.from(existingSet),
  };
}
