import { useMemo } from 'react'
import { BADGES, tierProgress } from './data'
import { canPlay, computeBoard, useStore } from './store'
import { Avatar, EmptyState, ProgressBar, TierChip } from './ui'
import { Icon } from './Icons'
import { effectiveStreak, formatNumber, timeAgo, winRate } from './utils'

export default function Dashboard({ user, navigate }) {
  const { data } = useStore()
  const board = useMemo(() => computeBoard(data.users, 'global'), [data.users])
  const weekly = useMemo(() => computeBoard(data.users, 'weekly'), [data.users])
  const position = board.find((r) => r.user.id === user.id)?.rank
  const prog = tierProgress(user.xp)
  const streak = effectiveStreak(user)
  const firstName = user.name.split(' ')[0]
  const catName = (id) => data.categories.find((c) => c.id === id)?.name || 'Removed category'

  return (
    <div className="stack">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-title">Ready for a duel, {firstName}?</h1>
          <p>
            {user.matches === 0
              ? 'Pick a category and play your first match. Every correct answer earns XP, and quicker answers earn more.'
              : prog.next
                ? `You are ${formatNumber(prog.remaining)} XP away from ${prog.next.name}. One good duel could close that gap.`
                : 'You have reached the top tier. Defend your place on the leaderboard.'}
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-gold btn-lg" onClick={() => navigate('/play')}>
              <Icon name="swords" size={20} /> Find a match
            </button>
            <button type="button" className="btn btn-light btn-lg" onClick={() => navigate('/leaderboard')}>
              <Icon name="trophy" size={20} /> See the rankings
            </button>
          </div>
        </div>

        <div className="hero-standing">
          <div className="hero-tier">
            <TierChip tier={prog.current} />
            <span className="hero-xp"><strong>{formatNumber(user.xp)}</strong> XP</span>
          </div>
          <ProgressBar pct={prog.pct} label={prog.next ? `Progress to ${prog.next.name}` : 'Top tier reached'} tone="gold" />
          <p className="hero-next">{prog.next ? `${prog.pct}% of the way to ${prog.next.name}` : 'Grandmaster reached'}</p>
        </div>
      </section>

      <section className="stats" aria-label="Your stats">
        <div className="stat">
          <span className="stat-icon stat-gold"><Icon name="bolt" size={20} /></span>
          <strong>{formatNumber(user.xp)}</strong>
          <span>Total XP</span>
        </div>
        <div className="stat">
          <span className="stat-icon stat-you"><Icon name="trophy" size={20} /></span>
          <strong>#{position}</strong>
          <span>Global rank of {board.length}</span>
        </div>
        <div className="stat">
          <span className="stat-icon stat-win"><Icon name="target" size={20} /></span>
          <strong>{winRate(user)}%</strong>
          <span>Win rate over {user.matches} {user.matches === 1 ? 'duel' : 'duels'}</span>
        </div>
        <div className="stat">
          <span className="stat-icon stat-foe"><Icon name="flame" size={20} /></span>
          <strong>{streak}</strong>
          <span>Day streak</span>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="cats-title">
          <div className="panel-head">
            <h2 id="cats-title">Jump into a category</h2>
            <a href="#/play" className="link">All categories</a>
          </div>
          <div className="cat-quick">
            {data.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="cat-chip"
                style={{ '--cat': c.color }}
                disabled={!canPlay(data, c.id)}
                onClick={() => navigate(`/play?cat=${c.id}`)}
              >
                <span className="cat-chip-icon"><Icon name={c.icon} size={20} /></span>
                {c.name}
              </button>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="weekly-title">
          <div className="panel-head">
            <h2 id="weekly-title">This week's top five</h2>
            <a href="#/leaderboard" className="link">Full board</a>
          </div>
          <ol className="mini-board">
            {weekly.slice(0, 5).map((r) => (
              <li key={r.user.id} className={r.user.id === user.id ? 'is-me' : ''}>
                <span className="mini-rank">{r.rank}</span>
                <Avatar name={r.user.name} color={r.user.avatarColor} size={30} />
                <span className="mini-name">{r.user.name}{r.user.id === user.id && ' (you)'}</span>
                <span className="mini-xp">{formatNumber(r.xp)} XP</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel" aria-labelledby="recent-title">
          <div className="panel-head">
            <h2 id="recent-title">Recent duels</h2>
          </div>
          {user.history.length === 0 ? (
            <EmptyState icon="swords" title="No duels yet" action={<button type="button" className="btn btn-primary btn-small" onClick={() => navigate('/play')}>Play your first duel</button>}>
              Your results will show up here once you finish a match.
            </EmptyState>
          ) : (
            <ul className="history">
              {user.history.slice(0, 5).map((h) => (
                <li key={h.id}>
                  <span className={`result-dot result-${h.result}`} aria-hidden="true" />
                  <div className="history-main">
                    <strong>{h.result === 'win' ? 'Won' : h.result === 'loss' ? 'Lost' : 'Drew'} against {h.oppName}</strong>
                    <small>{catName(h.categoryId)}, {timeAgo(h.at)}</small>
                  </div>
                  <div className="history-score">
                    <strong>{h.myScore} to {h.oppScore}</strong>
                    <small>+{formatNumber(h.xp)} XP</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="badges-title">
          <div className="panel-head">
            <h2 id="badges-title">Badges</h2>
            <a href="#/profile" className="link">{user.badges.length} of {BADGES.length} earned</a>
          </div>
          <ul className="badge-row">
            {BADGES.map((b) => {
              const earned = user.badges.includes(b.id)
              return (
                <li key={b.id} className={`badge-mini ${earned ? 'is-earned' : ''}`} title={`${b.name}: ${b.description}`}>
                  <Icon name={earned ? b.icon : 'lock'} size={22} />
                  <span className="sr-only">{b.name}, {earned ? 'earned' : 'locked'}. {b.description}</span>
                </li>
              )
            })}
          </ul>
          <p className="panel-note">Play consistently to unlock badges. Each one also pays out bonus XP.</p>
        </section>
      </div>
    </div>
  )
}
