// Static configuration and seed content for SkillDuels.
// In production these would live in MongoDB; the frontend reads them through store.js.

export const MATCH_QUESTIONS = 6 // questions per duel
export const QUESTION_SECONDS = 15 // countdown per question (FR-04)
export const REVEAL_MS = 1700 // pause after a question closes
export const MIN_QUESTIONS_TO_PLAY = 3 // a category needs this many published questions
export const SEARCH_SECONDS = 8 // how long to look for a live opponent before offering a bot

export const RESULT_BONUS = { win: 100, draw: 50, loss: 25 }

/* ---------- Tiers (rank titles driven by XP) ---------- */

export const TIERS = [
  { id: 'rookie', name: 'Rookie', min: 0, color: '#AEB5DA' },
  { id: 'challenger', name: 'Challenger', min: 2000, color: '#6CC4FF' },
  { id: 'strategist', name: 'Strategist', min: 5000, color: '#3DD9A8' },
  { id: 'master', name: 'Master', min: 10000, color: '#C3A1FF' },
  { id: 'grandmaster', name: 'Grandmaster', min: 20000, color: '#FFC93C' },
]

export function tierFor(xp) {
  let tier = TIERS[0]
  for (const t of TIERS) if (xp >= t.min) tier = t
  return tier
}

export function tierProgress(xp) {
  const current = tierFor(xp)
  const next = TIERS.find((t) => t.min > xp) || null
  if (!next) return { current, next: null, pct: 100, remaining: 0 }
  const pct = Math.round((100 * (xp - current.min)) / (next.min - current.min))
  return { current, next, pct, remaining: next.min - xp }
}

/* ---------- Badges (FR-10) ---------- */

export const BADGES = [
  {
    id: 'first_win',
    name: 'Opening move',
    description: 'Win your first duel.',
    icon: 'swords',
    bonus: 50,
    test: (u) => u.wins >= 1,
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
]

/* ---------- Visual options for categories (admin panel) ---------- */

export const CATEGORY_ICONS = ['code', 'calculator', 'bulb', 'database', 'book', 'globe', 'bolt', 'target']
export const CATEGORY_COLORS = ['#6CC4FF', '#FFC93C', '#3DD9A8', '#C3A1FF', '#FF9DBB', '#FFB07A', '#8EE3E0', '#B8E36B']
export const AVATAR_COLORS = ['#FFC93C', '#3DD9A8', '#C3A1FF', '#6CC4FF', '#FF9DBB', '#8EE3E0', '#FFB07A']

/* ---------- Categories (FR-08) ---------- */

export const SEED_CATEGORIES = [
  {
    id: 'technical',
    name: 'Technical',
    description: 'Web development, JavaScript and everyday engineering knowledge.',
    icon: 'code',
    color: '#6CC4FF',
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    description: 'Percentages, ratios, speed and number patterns under time pressure.',
    icon: 'calculator',
    color: '#FFC93C',
  },
  {
    id: 'logic',
    name: 'Logical reasoning',
    description: 'Syllogisms, series, relations and puzzles that reward a clear head.',
    icon: 'bulb',
    color: '#3DD9A8',
  },
  {
    id: 'database',
    name: 'Databases and SQL',
    description: 'Queries, keys, joins and the basics of MongoDB.',
    icon: 'database',
    color: '#C3A1FF',
  },
]

/* ---------- Questions ---------- */

const q = (id, categoryId, text, options, answer, difficulty = 'easy') => ({
  id,
  categoryId,
  text,
  options,
  answer,
  difficulty,
  status: 'published',
})

export const SEED_QUESTIONS = [
  // Technical
  q('t1', 'technical', 'Which React hook runs side effects after a component renders?', ['useState', 'useEffect', 'useMemo', 'useRef'], 1),
  q('t2', 'technical', 'What does typeof null return in JavaScript?', ['"null"', '"undefined"', '"object"', '"number"'], 2, 'medium'),
  q('t3', 'technical', 'Which HTTP status code means "Not Found"?', ['200', '301', '404', '500'], 2),
  q('t4', 'technical', 'Which CSS property controls the stacking order of positioned elements?', ['z-index', 'order', 'float', 'display'], 0),
  q('t5', 'technical', 'What does JSON stand for?', ['JavaScript Object Notation', 'Java Standard Object Network', 'JavaScript Online Node', 'Joined Script Object Name'], 0),
  q('t6', 'technical', 'Which array method adds an element to the end of an array?', ['pop()', 'push()', 'shift()', 'unshift()'], 1),
  q('t7', 'technical', 'Which of these is NOT a primitive type in JavaScript?', ['string', 'boolean', 'array', 'symbol'], 2, 'medium'),
  q('t8', 'technical', 'Which Git command creates a new branch and switches to it?', ['git branch -d feature', 'git checkout -b feature', 'git merge feature', 'git stash feature'], 1),

  // Aptitude
  q('a1', 'aptitude', 'A train covers 120 km in 2 hours. At the same speed, how far does it go in 5 hours?', ['250 km', '300 km', '350 km', '600 km'], 1),
  q('a2', 'aptitude', 'What is 15% of 240?', ['24', '30', '36', '45'], 2),
  q('a3', 'aptitude', '6 workers finish a job in 10 days. How many days would 12 workers need at the same rate?', ['3 days', '5 days', '15 days', '20 days'], 1),
  q('a4', 'aptitude', 'What is the average of 4, 8, 12, 16 and 20?', ['10', '12', '14', '15'], 1),
  q('a5', 'aptitude', 'A shirt costs ₹800 after a 20% discount. What was the original price?', ['₹960', '₹1,000', '₹1,040', '₹1,200'], 1, 'medium'),
  q('a6', 'aptitude', 'Two numbers are in the ratio 3:5 and add up to 64. What is the larger number?', ['24', '32', '40', '48'], 2, 'medium'),
  q('a7', 'aptitude', 'What is the simple interest on ₹5,000 at 8% per year for 3 years?', ['₹1,000', '₹1,200', '₹1,500', '₹2,000'], 1),
  q('a8', 'aptitude', 'What comes next? 2, 6, 12, 20, 30, ?', ['38', '40', '42', '44'], 2, 'medium'),

  // Logical reasoning
  q('l1', 'logic', 'All cats are animals. All animals need water. Which conclusion follows?', ['Some animals are not cats', 'All cats need water', 'No cat is an animal', 'All water is for cats'], 1),
  q('l2', 'logic', 'Which one is the odd one out?', ['Apple', 'Banana', 'Carrot', 'Mango'], 2),
  q('l3', 'logic', 'Find the next letter. A, C, F, J, ?', ['N', 'O', 'P', 'Q'], 1, 'hard'),
  q('l4', 'logic', 'Ravi is taller than Sam. Sam is taller than Tej. Who is the shortest?', ['Ravi', 'Sam', 'Tej', 'Cannot be determined'], 2),
  q('l5', 'logic', 'How many times do the hands of a clock overlap in 12 hours?', ['10', '11', '12', '13'], 1, 'hard'),
  q('l6', 'logic', 'Today is Wednesday. What day will it be after 100 days?', ['Thursday', 'Friday', 'Saturday', 'Sunday'], 1, 'medium'),
  q('l7', 'logic', 'Mira points to a man and says, "He is the son of my mother\'s only brother." How is he related to Mira?', ['Brother', 'Uncle', 'Cousin', 'Nephew'], 2, 'medium'),
  q('l8', 'logic', 'Complete the series. 1, 4, 9, 16, 25, ?', ['30', '34', '36', '49'], 2),

  // Databases
  q('d1', 'database', 'Which SQL clause filters rows after they have been grouped?', ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], 1, 'medium'),
  q('d2', 'database', 'Which MongoDB method inserts a single document into a collection?', ['insertOne()', 'addOne()', 'push()', 'create()'], 0),
  q('d3', 'database', 'Which MongoDB operator matches values strictly greater than a given value?', ['$gt', '$gte', '$lt', '$ne'], 0, 'medium'),
  q('d4', 'database', 'What does a primary key guarantee?', ['Each row is uniquely identified', 'Values are encrypted', 'Rows are sorted alphabetically', 'The table has no other keys'], 0),
  q('d5', 'database', 'Which JOIN returns only rows that have matches in both tables?', ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'], 0),
  q('d6', 'database', 'Which of these is a NoSQL document database?', ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'], 2),
  q('d7', 'database', 'Which command removes all rows from a table but keeps its structure?', ['DROP TABLE', 'TRUNCATE TABLE', 'ALTER TABLE', 'DELETE DATABASE'], 1, 'medium'),
  q('d8', 'database', 'What is a database index mainly used for?', ['Speeding up data lookups', 'Backing up data', 'Encrypting columns', 'Renaming tables'], 0),
]

/* ---------- Seed players (sample leaderboard data) ---------- */

export const SEED_PLAYERS = [
  { name: 'Rohan Mehta', xp: 21400, weekly: 1350, matches: 96, wins: 71 },
  { name: 'Priya Nair', xp: 17850, weekly: 2300, matches: 88, wins: 60 },
  { name: 'Kabir Shah', xp: 12600, weekly: 900, matches: 64, wins: 41 },
  { name: 'Ananya Rao', xp: 9800, weekly: 1780, matches: 57, wins: 33 },
  { name: 'Vikram Joshi', xp: 7350, weekly: 640, matches: 44, wins: 25 },
  { name: 'Sneha Patil', xp: 5900, weekly: 1210, matches: 39, wins: 21 },
  { name: 'Arjun Desai', xp: 4300, weekly: 380, matches: 30, wins: 15 },
  { name: 'Meera Iyer', xp: 3100, weekly: 1500, matches: 24, wins: 12 },
  { name: 'Dev Kulkarni', xp: 1950, weekly: 220, matches: 17, wins: 7 },
  { name: 'Isha Verma', xp: 1200, weekly: 540, matches: 12, wins: 5 },
  { name: 'Zoya Khan', xp: 760, weekly: 90, matches: 8, wins: 3 },
  { name: 'Tanmay Gupta', xp: 420, weekly: 0, matches: 4, wins: 1 },
]

/* ---------- Practice opponents ---------- */
// Used when no live opponent is found. accuracy = chance of a correct answer,
// minTime/maxTime = how quickly (in seconds) the bot tends to answer.

export const BOT_OPPONENTS = [
  { id: 'bot_nova', name: 'Nova', avatarColor: '#FF9DBB', xp: 3200, accuracy: 0.62, minTime: 4, maxTime: 11 },
  { id: 'bot_bolt', name: 'Bolt', avatarColor: '#8EE3E0', xp: 4800, accuracy: 0.55, minTime: 2, maxTime: 7 },
  { id: 'bot_quill', name: 'Quill', avatarColor: '#FFB07A', xp: 6500, accuracy: 0.74, minTime: 5, maxTime: 12 },
  { id: 'bot_pixel', name: 'Pixel', avatarColor: '#B8E36B', xp: 2400, accuracy: 0.5, minTime: 3, maxTime: 10 },
]
