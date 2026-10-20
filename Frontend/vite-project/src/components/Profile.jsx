import { BADGES, tierProgress } from './data'
import { computeBoard, useStore } from './store'
import { Avatar, EmptyState, PageHeader, ProgressBar, TierChip } from './ui'
import { Icon } from './Icons'
import { effectiveStreak, formatNumber, timeAgo, winRate } from './utils'

export default function Profile({ user, navigate }) {
  const { data } = useStore()
  const position = computeBoard(data.users, 'global').find((r) => r.user.id === user.id)?.rank
  const weeklyPos = computeBoard(data.users, 'weekly').find((r) => r.user.id === user.id)?.rank
  const prog = tierProgress(user.xp)
  const catName = (id) => data.categories.find((c) => c.id === id)?.name || 'Removed category'

  return (
    <div className="stack">
      <PageHeader title="Your profile" />

      <section className="profile-card" aria-labelledby="profile-name">
        <Avatar name={user.name} color={user.avatarColor} size={96} />
        <div className="profile-main">
          <h2 id="profile-name">{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="profile-tier">
            <TierChip tier={prog.current} />
            <span><strong>{formatNumber(user.xp)}</strong> XP</span>
            <span>Global #{position}</span>
            <span>Weekly #{weeklyPos}</span>
          </div>
          <ProgressBar pct={prog.pct} label={prog.next ? `Progress to ${prog.next.name}` : 'Top tier reached'} />
          <p className="panel-note">{prog.next ? `${formatNumber(prog.remaining)} XP to ${prog.next.name}` : 'You are in the top tier.'}</p>
        </div>
      </section>

      <section className="stats stats-6" aria-label="Career stats">
        <div className="stat"><strong>{user.matches}</strong><span>Duels played</span></div>
        <div className="stat"><strong>{user.wins}</strong><span>Wins</span></div>
        <div className="stat"><strong>{user.losses}</strong><span>Losses</span></div>
        <div className="stat"><strong>{user.draws}</strong><span>Draws</span></div>
        <div className="stat"><strong>{winRate(user)}%</strong><span>Win rate</span></div>
        <div className="stat"><strong>{effectiveStreak(user)}</strong><span>Day streak</span></div>
      </section>

      <section className="panel" aria-labelledby="badges-h">
        <div className="panel-head">
          <h2 id="badges-h">Badges</h2>
          <span className="panel-note">{user.badges.length} of {BADGES.length} earned</span>
        </div>
        <ul className="badge-grid">
          {BADGES.map((b) => {
            const earned = user.badges.includes(b.id)
            return (
              <li key={b.id} className={`badge-card ${earned ? 'is-earned' : ''}`}>
                <span className={`badge-big ${earned ? 'is-earned' : ''}`}><Icon name={earned ? b.icon : 'lock'} size={26} /></span>
                <div>
                  <strong>{b.name}</strong>
                  <small>{b.description}</small>
                  <small className="badge-bonus">{earned ? 'Earned' : `Worth +${b.bonus} XP`}</small>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel" aria-labelledby="hist-h">
        <div className="panel-head"><h2 id="hist-h">Match history</h2></div>
        {user.history.length === 0 ? (
          <EmptyState icon="swords" title="Nothing here yet" action={<button type="button" className="btn btn-primary btn-small" onClick={() => navigate('/play')}>Start a duel</button>}>
            Finish a match and it will be listed here with the XP you earned.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Result</th>
                  <th scope="col">Opponent</th>
                  <th scope="col" className="col-hide">Category</th>
                  <th scope="col" className="num">Score</th>
                  <th scope="col" className="num">XP</th>
                  <th scope="col" className="col-hide num">When</th>
                </tr>
              </thead>
              <tbody>
                {user.history.map((h) => (
                  <tr key={h.id}>
                    <td><span className={`chip chip-${h.result === 'win' ? 'win' : h.result === 'loss' ? 'lose' : 'draw'}`}>{h.result === 'win' ? 'Win' : h.result === 'loss' ? (h.forfeited ? 'Forfeit' : 'Loss') : 'Draw'}</span></td>
                    <td>{h.oppName}</td>
                    <td className="col-hide">{catName(h.categoryId)}</td>
                    <td className="num">{h.myScore} to {h.oppScore}</td>
                    <td className="num"><strong>+{formatNumber(h.xp)}</strong></td>
                    <td className="col-hide num">{timeAgo(h.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
