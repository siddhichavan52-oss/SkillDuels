// Client-side data layer for SkillDuels.
//
// This module stands in for the Express + MongoDB backend so the frontend is fully
// usable on its own. Every exported action mirrors an API call you would make later
// (POST /auth/login, POST /matches, POST /admin/questions ...), so replacing it with
// fetch() calls only touches this file.
//
// - Data persists in localStorage and syncs across browser tabs.
// - The signed-in user is kept per tab (sessionStorage) so two tabs can sign in as
//   two different players and duel each other live.
// - Admin actions check the signed-in user's role (NFR-03).

import { useSyncExternalStore } from 'react'
import {
  AVATAR_COLORS,
  BADGES,
  MATCH_QUESTIONS,
  MIN_QUESTIONS_TO_PLAY,
  RESULT_BONUS,
  SEED_CATEGORIES,
  SEED_PLAYERS,
  SEED_QUESTIONS,
  tierFor,
} from './data'
import { dayKey, hashPassword, shuffle, slug, uid, weekKey } from './utils'

const USER_PREFIX = 'skillduels.user.v1.' // one record per player
const CONTENT_KEY = 'skillduels.content.v1' // categories + questions
const SESSION_KEY = 'skillduels.session.v1'
const DRAFT_KEY = 'skillduels.draft.v1'

/* ---------- Seed ---------- */

function blankStats() {
  return {
    xp: 0,
    weekly: { key: weekKey(), xp: 0, matches: 0 },
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    streak: 0,
    lastPlayed: null,
    perfect: 0,
    quick: 0,
    categoriesPlayed: [],
    badges: [],
    history: [],
  }
}

function colorFor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function buildSeed() {
  const now = Date.now()
  const users = [
    {
      ...blankStats(),
      id: 'u_admin',
      name: 'Admin',
      email: 'admin@skillduels.dev',
      passwordHash: hashPassword('Admin@123'),
      role: 'admin',
      avatarColor: '#C3A1FF',
    },
    {
      ...blankStats(),
      id: 'u_ava',
      name: 'Ava Sharma',
      email: 'ava@skillduels.dev',
      passwordHash: hashPassword('Player@123'),
      role: 'player',
      avatarColor: '#FFC93C',
      xp: 2650,
      weekly: { key: weekKey(), xp: 410, matches: 2 },
      matches: 12,
      wins: 7,
      losses: 4,
      draws: 1,
      winStreak: 1,
      streak: 2,
      lastPlayed: dayKey(-1),
      perfect: 0,
      quick: 6,
      categoriesPlayed: ['technical', 'aptitude', 'logic'],
      badges: ['first_win', 'polymath', 'veteran'],
      history: [
        { id: 'h3', at: now - 26 * 3600e3, categoryId: 'technical', oppName: 'Kabir Shah', myScore: 610, oppScore: 540, result: 'win', xp: 710, mode: 'live' },
        { id: 'h2', at: now - 50 * 3600e3, categoryId: 'logic', oppName: 'Priya Nair', myScore: 380, oppScore: 560, result: 'loss', xp: 405, mode: 'live' },
        { id: 'h1', at: now - 74 * 3600e3, categoryId: 'aptitude', oppName: 'Nova', myScore: 480, oppScore: 480, result: 'draw', xp: 530, mode: 'bot' },
      ],
    },
    ...SEED_PLAYERS.map((p) => ({
      ...blankStats(),
      id: `u_${slug(p.name)}`,
      name: p.name,
      email: `${slug(p.name)}@skillduels.dev`,
      passwordHash: hashPassword(uid('seed')),
      role: 'player',
      avatarColor: colorFor(p.name),
      xp: p.xp,
      weekly: { key: weekKey(), xp: p.weekly, matches: Math.ceil(p.weekly / 400) },
      matches: p.matches,
      wins: p.wins,
      losses: p.matches - p.wins,
    })),
  ]
  return { users, categories: SEED_CATEGORIES, questions: SEED_QUESTIONS }
}

/* ---------- State container ---------- */

// Players are stored one record each. A player's own tab is the only writer of that
// record, so two players finishing a duel at the same moment never overwrite each other.
function load() {
  try {
    const users = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(USER_PREFIX)) users.push(JSON.parse(localStorage.getItem(key)))
    }
    const content = JSON.parse(localStorage.getItem(CONTENT_KEY) || 'null')
    if (users.length && content?.categories && content?.questions) return { users, ...content }
  } catch {
    /* fall through to seed */
  }
  const seeded = buildSeed()
  persist({ users: [], categories: null, questions: null }, seeded)
  return seeded
}

function persist(prev, next) {
  try {
    const nextIds = new Set(next.users.map((u) => u.id))
    for (const u of prev.users) if (!nextIds.has(u.id)) localStorage.removeItem(USER_PREFIX + u.id)
    const before = new Map(prev.users.map((u) => [u.id, u]))
    for (const u of next.users) if (before.get(u.id) !== u) localStorage.setItem(USER_PREFIX + u.id, JSON.stringify(u))
    if (prev.categories !== next.categories || prev.questions !== next.questions)
      localStorage.setItem(CONTENT_KEY, JSON.stringify({ categories: next.categories, questions: next.questions }))
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

let state = load()
let sessionId = readSession()
let snapshot = { data: state, sessionId }
const listeners = new Set()

function emit() {
  snapshot = { data: state, sessionId }
  listeners.forEach((l) => l())
}

function commit(next) {
  const prev = state
  state = next
  persist(prev, next)
  emit()
}

function setSession(id) {
  sessionId = id
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
  emit()
}

if (typeof window !== 'undefined') {
  // Another tab changed the data (for example a duel finished): refresh this tab.
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === CONTENT_KEY || e.key.startsWith(USER_PREFIX)) {
      state = load()
      emit()
    }
  })
}

// Read-modify-write safety across tabs: every write action starts from the latest
// stored data, so two players finishing a duel at the same moment cannot overwrite
// each other's results. (A real backend gets this from MongoDB atomic updates.)
function refresh() {
  state = load()
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
const getSnapshot = () => snapshot

export const useStore = () => useSyncExternalStore(subscribe, getSnapshot)

export function useCurrentUser() {
  const { data, sessionId: id } = useStore()
  return data.users.find((u) => u.id === id) || null
}

/* ---------- Selectors ---------- */

export const weeklyXpOf = (u) => (u.weekly?.key === weekKey() ? u.weekly.xp : 0)

// kind: 'global' (all-time XP) or 'weekly' (XP earned this ISO week). Admins are excluded.
export function computeBoard(users, kind = 'global') {
  return users
    .filter((u) => u.role !== 'admin')
    .map((u) => ({ user: u, xp: kind === 'weekly' ? weeklyXpOf(u) : u.xp }))
    .sort((a, b) => b.xp - a.xp || a.user.name.localeCompare(b.user.name))
    .map((row, i) => ({ ...row, rank: i + 1 }))
}

export const positionOf = (users, userId, kind = 'global') =>
  computeBoard(users, kind).find((r) => r.user.id === userId)?.rank ?? null

export const categoryById = (data, id) => data.categories.find((c) => c.id === id)

export const playableCount = (data, categoryId) =>
  data.questions.filter((x) => x.categoryId === categoryId && x.status === 'published').length

export const canPlay = (data, categoryId) => playableCount(data, categoryId) >= MIN_QUESTIONS_TO_PLAY

/* ---------- Auth (FR-01) ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function register({ name, email, password }) {
  refresh()
  const errors = {}
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()
  if (cleanName.length < 2) errors.name = 'Enter your name (at least 2 characters).'
  if (!EMAIL_RE.test(cleanEmail)) errors.email = 'Enter a valid email address, like name@college.edu.'
  else if (state.users.some((u) => u.email === cleanEmail)) errors.email = 'An account with this email already exists. Log in instead.'
  if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/\d/.test(password))
    errors.password = 'Use at least 6 characters with a letter and a number.'
  if (Object.keys(errors).length) return { ok: false, errors }

  const user = {
    ...blankStats(),
    id: uid('u'),
    name: cleanName,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: 'player',
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  }
  commit({ ...state, users: [...state.users, user] })
  setSession(user.id)
  return { ok: true, user }
}

export function login({ email, password }) {
  refresh()
  const errors = {}
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) errors.email = 'Enter your email address.'
  if (!password) errors.password = 'Enter your password.'
  if (Object.keys(errors).length) return { ok: false, errors }

  const user = state.users.find((u) => u.email === cleanEmail)
  if (!user || user.passwordHash !== hashPassword(password))
    return { ok: false, errors: { form: 'Email or password is incorrect. Check both and try again.' } }
  setSession(user.id)
  return { ok: true, user }
}

export const logout = () => setSession(null)

/* ---------- Match setup ---------- */

// Picks a question set and shuffles each question's options (answer index is remapped).
export function pickQuestions(categoryId, count = MATCH_QUESTIONS) {
  const pool = state.questions.filter((x) => x.categoryId === categoryId && x.status === 'published')
  return shuffle(pool)
    .slice(0, count)
    .map((item) => {
      const order = shuffle(item.options.map((text, i) => ({ text, i })))
      return {
        id: item.id,
        categoryId: item.categoryId,
        text: item.text,
        difficulty: item.difficulty,
        options: order.map((o) => o.text),
        answer: order.findIndex((o) => o.i === item.answer),
      }
    })
}

/* ---------- Recording results (FR-02, FR-10) ---------- */

export function recordMatch(userId, m) {
  refresh()
  const u = state.users.find((x) => x.id === userId)
  if (!u) return null

  const before = { xp: u.xp, position: positionOf(state.users, userId), tier: tierFor(u.xp) }

  let result
  if (m.forfeited) result = 'loss'
  else if (m.oppForfeit) result = 'win'
  else result = m.myScore > m.oppScore ? 'win' : m.myScore < m.oppScore ? 'loss' : 'draw'

  const resultBonus = m.forfeited ? 0 : RESULT_BONUS[result]

  // Daily streak: first duel of a new day extends (or restarts) the streak.
  const today = dayKey()
  let streak = u.streak || 0
  let streakBonus = 0
  if (u.lastPlayed !== today) {
    streak = u.lastPlayed === dayKey(-1) ? streak + 1 : 1
    if (streak >= 2) streakBonus = Math.min(streak, 7) * 10
  }

  const wk = weekKey()
  const weekly = u.weekly?.key === wk ? { ...u.weekly } : { key: wk, xp: 0, matches: 0 }
  weekly.matches += 1

  const next = {
    ...u,
    matches: u.matches + 1,
    wins: u.wins + (result === 'win' ? 1 : 0),
    losses: u.losses + (result === 'loss' ? 1 : 0),
    draws: u.draws + (result === 'draw' ? 1 : 0),
    winStreak: result === 'win' ? (u.winStreak || 0) + 1 : 0,
    streak,
    lastPlayed: today,
    perfect: (u.perfect || 0) + (!m.forfeited && m.total > 0 && m.correct === m.total ? 1 : 0),
    quick: (u.quick || 0) + (m.quick || 0),
    categoriesPlayed: Array.from(new Set([...(u.categoriesPlayed || []), m.categoryId])),
    weekly,
  }

  // Badges and their bonus points.
  const newBadges = []
  let badgeBonus = 0
  next.badges = [...(u.badges || [])]
  for (const b of BADGES) {
    if (!next.badges.includes(b.id) && b.test(next)) {
      next.badges.push(b.id)
      newBadges.push(b)
      badgeBonus += b.bonus
    }
  }

  const xpGained = m.myScore + resultBonus + streakBonus + badgeBonus
  next.xp = u.xp + xpGained
  next.weekly = { ...weekly, xp: weekly.xp + xpGained }
  next.history = [
    {
      id: uid('h'),
      at: Date.now(),
      categoryId: m.categoryId,
      oppName: m.opponent?.name || 'Opponent',
      myScore: m.myScore,
      oppScore: m.oppScore,
      result,
      xp: xpGained,
      mode: m.mode,
      forfeited: !!m.forfeited,
    },
    ...(u.history || []),
  ].slice(0, 20)

  const users = state.users.map((x) => (x.id === userId ? next : x))
  commit({ ...state, users })

  return {
    result,
    xpGained,
    breakdown: { match: m.myScore, result: resultBonus, streak: streakBonus, badges: badgeBonus },
    newBadges,
    streak,
    before,
    after: { xp: next.xp, position: positionOf(users, userId), tier: tierFor(next.xp) },
  }
}

/* ---------- Unsaved-match protection (NFR-04) ---------- */
// The running score is saved after each answer. If the tab closes or the connection
// drops mid-duel, the work is recorded the next time the player signs in.

const draftKey = (userId) => `${DRAFT_KEY}.${userId}`

export function saveDraft(userId, draft) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch {
    /* ignore */
  }
}

export function clearDraft(userId) {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {
    /* ignore */
  }
}

export function recoverInterrupted(userId) {
  let draft = null
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (raw) draft = JSON.parse(raw)
    localStorage.removeItem(draftKey(userId))
  } catch {
    return null
  }
  if (!draft) return null
  return recordMatch(userId, {
    ...draft,
    opponent: { name: draft.oppName },
    forfeited: true,
  })
}

/* ---------- Admin actions (FR-09) ---------- */

function requireAdmin() {
  refresh()
  const u = state.users.find((x) => x.id === sessionId)
  if (!u || u.role !== 'admin') throw new Error('Admin access required.')
  return u
}

function guard(fn) {
  try {
    return fn()
  } catch (e) {
    return { ok: false, errors: { form: e.message } }
  }
}

function validateCategory({ name, description }, ignoreId) {
  const errors = {}
  const clean = name.trim()
  if (clean.length < 2 || clean.length > 30) errors.name = 'Enter a name between 2 and 30 characters.'
  else if (state.categories.some((c) => c.id !== ignoreId && c.name.toLowerCase() === clean.toLowerCase()))
    errors.name = 'A category with this name already exists.'
  if (description.trim().length < 10) errors.description = 'Describe the category in at least 10 characters.'
  return errors
}

export const addCategory = (input) =>
  guard(() => {
    requireAdmin()
    const errors = validateCategory(input)
    if (Object.keys(errors).length) return { ok: false, errors }
    const category = {
      id: `${slug(input.name)}-${uid('c').slice(-4)}`,
      name: input.name.trim(),
      description: input.description.trim(),
      icon: input.icon,
      color: input.color,
    }
    commit({ ...state, categories: [...state.categories, category] })
    return { ok: true, category }
  })

export const updateCategory = (id, input) =>
  guard(() => {
    requireAdmin()
    const errors = validateCategory(input, id)
    if (Object.keys(errors).length) return { ok: false, errors }
    commit({
      ...state,
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, name: input.name.trim(), description: input.description.trim(), icon: input.icon, color: input.color } : c,
      ),
    })
    return { ok: true }
  })

export const deleteCategory = (id) =>
  guard(() => {
    requireAdmin()
    commit({
      ...state,
      categories: state.categories.filter((c) => c.id !== id),
      questions: state.questions.filter((x) => x.categoryId !== id),
    })
    return { ok: true }
  })

function validateQuestion({ categoryId, text, options, answer }) {
  const errors = {}
  if (!state.categories.some((c) => c.id === categoryId)) errors.categoryId = 'Choose a category.'
  if (text.trim().length < 10) errors.text = 'Write the question in at least 10 characters.'
  const trimmed = options.map((o) => o.trim())
  trimmed.forEach((o, i) => {
    if (!o) errors[`option${i}`] = 'Fill in this answer.'
  })
  if (!errors.option0 && !errors.option1 && !errors.option2 && !errors.option3 && new Set(trimmed.map((o) => o.toLowerCase())).size < 4)
    errors.options = 'Each answer must be different.'
  if (!(answer >= 0 && answer <= 3)) errors.answer = 'Mark the correct answer.'
  return errors
}

export const addQuestion = (input) =>
  guard(() => {
    requireAdmin()
    const errors = validateQuestion(input)
    if (Object.keys(errors).length) return { ok: false, errors }
    const question = {
      id: uid('q'),
      categoryId: input.categoryId,
      text: input.text.trim(),
      options: input.options.map((o) => o.trim()),
      answer: input.answer,
      difficulty: input.difficulty,
      status: 'published',
    }
    commit({ ...state, questions: [question, ...state.questions] })
    return { ok: true, question }
  })

export const updateQuestion = (id, input) =>
  guard(() => {
    requireAdmin()
    const errors = validateQuestion(input)
    if (Object.keys(errors).length) return { ok: false, errors }
    commit({
      ...state,
      questions: state.questions.map((x) =>
        x.id === id
          ? { ...x, categoryId: input.categoryId, text: input.text.trim(), options: input.options.map((o) => o.trim()), answer: input.answer, difficulty: input.difficulty }
          : x,
      ),
    })
    return { ok: true }
  })

export const deleteQuestion = (id) =>
  guard(() => {
    requireAdmin()
    commit({ ...state, questions: state.questions.filter((x) => x.id !== id) })
    return { ok: true }
  })

// Moderation: hidden questions are never used in matches.
export const setQuestionStatus = (id, status) =>
  guard(() => {
    requireAdmin()
    commit({ ...state, questions: state.questions.map((x) => (x.id === id ? { ...x, status } : x)) })
    return { ok: true }
  })

export const resetDemoData = () =>
  guard(() => {
    requireAdmin()
    const admin = state.users.find((u) => u.id === sessionId)
    const seed = buildSeed()
    commit({ ...seed, users: seed.users.map((u) => (u.id === admin.id ? admin : u)) })
    return { ok: true }
  })
