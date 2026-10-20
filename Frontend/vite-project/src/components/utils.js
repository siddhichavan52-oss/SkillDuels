// Small, dependency-free helpers shared across the app.

export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0))

export function dayKey(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ISO week key, e.g. "2026-W41". Weekly rankings reset when this changes.
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

// Demo-only hash. A real backend would use bcrypt/argon2 and issue a JWT.
export function hashPassword(pw) {
  let h = 5381
  for (const c of pw) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0
  return `x${h.toString(36)}`
}

// Points for a correct answer: 100 base plus up to 50 for answering quickly.
export function scorePoints(remainingSeconds, totalSeconds) {
  const ratio = clamp(remainingSeconds / totalSeconds, 0, 1)
  return 100 + Math.round(50 * ratio)
}

export function timeAgo(ts) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const days = Math.floor(hr / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export const winRate = (u) => (u.matches ? Math.round((100 * u.wins) / u.matches) : 0)

// A streak only counts if the player played today or yesterday.
export function effectiveStreak(u) {
  if (!u.lastPlayed) return 0
  return u.lastPlayed === dayKey() || u.lastPlayed === dayKey(-1) ? u.streak || 0 : 0
}

export const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
