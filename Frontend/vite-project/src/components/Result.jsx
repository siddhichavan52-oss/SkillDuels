import { useEffect, useState } from 'react'
import { Avatar, ProgressBar, TierChip } from './ui'
import { Icon } from './Icons'
import { tierProgress } from './data'
import { formatNumber } from './utils'

const LETTERS = ['A', 'B', 'C', 'D']

export default function Result({ outcome, user, navigate }) {
  const { summary, res } = outcome
  const { before, after, breakdown, newBadges, result } = summary

  // Animate the XP bar from where it was to where it is now (AC-04).
  const progBefore = tierProgress(before.xp)
  const progAfter = tierProgress(after.xp)
  const promoted = before.tier.id !== after.tier.id
  const [pct, setPct] = useState(promoted ? 0 : progBefore.pct)
  useEffect(() => {
    const id = setTimeout(() => setPct(progAfter.pct), 350)
    return () => clearTimeout(id)
  }, [progAfter.pct])

  const headline = res.forfeited
    ? 'You left the match'
    : res.oppForfeit
      ? `${res.opponent.name} left, so you win`
      : result === 'win'
        ? 'You won the duel'
        : result === 'loss'
          ? `${res.opponent.name} took this one`
          : "It's a draw"

  const moved = before.position - after.position
  const share = (res.myScore + 30) / (res.myScore + res.oppScore + 60)

  return (
    <div className="stack result">
      <section className={`result-banner result-banner-${result}`} aria-labelledby="result-title">
        <h1 id="result-title">{headline}</h1>
        <div className="result-scores">
          <div className="result-side">
            <Avatar name={user.name} color={user.avatarColor} size={56} />
            <strong>{user.name}</strong>
            <span className="result-pts result-pts-you">{res.myScore}</span>
          </div>
          <span className="versus-vs">VS</span>
          <div className="result-side">
            <Avatar name={res.opponent.name} color={res.opponent.avatarColor} size={56} />
            <strong>{res.opponent.name}</strong>
            <span className="result-pts result-pts-foe">{res.oppScore}</span>
          </div>
        </div>
        <div className="tug" role="img" aria-label={`Final score: you ${res.myScore}, ${res.opponent.name} ${res.oppScore}`}>
          <span className="tug-you" style={{ flexGrow: share * 100 }} />
          <span className="tug-foe" style={{ flexGrow: (1 - share) * 100 }} />
        </div>
        <p className="result-meta">
          {res.categoryName}. {res.correct} of {res.total} correct
          {res.avgTime != null && `, ${res.avgTime.toFixed(1)} seconds per answer`}.
        </p>
      </section>

      <div className="grid-2">
        <section className="panel" aria-labelledby="xp-title">
          <div className="panel-head"><h2 id="xp-title">XP earned</h2></div>
          <dl className="breakdown">
            <div><dt>Match points</dt><dd>+{formatNumber(breakdown.match)}</dd></div>
            <div><dt>{result === 'win' ? 'Win bonus' : result === 'draw' ? 'Draw bonus' : 'Participation bonus'}</dt><dd>+{breakdown.result}</dd></div>
            {breakdown.streak > 0 && <div><dt>Daily streak bonus ({summary.streak} days)</dt><dd>+{breakdown.streak}</dd></div>}
            {breakdown.badges > 0 && <div><dt>Badge bonus</dt><dd>+{breakdown.badges}</dd></div>}
            <div className="breakdown-total"><dt>Total</dt><dd>+{formatNumber(summary.xpGained)} XP</dd></div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="rank-title">
          <div className="panel-head"><h2 id="rank-title">Your standing</h2></div>
          <div className="standing">
            <div className="standing-row">
              <TierChip tier={after.tier} />
              <span><strong>{formatNumber(after.xp)}</strong> XP</span>
            </div>
            <ProgressBar pct={pct} label={progAfter.next ? `Progress to ${progAfter.next.name}` : 'Top tier reached'} tone="you" />
            <p className="panel-note">
              {promoted
                ? `Promoted from ${before.tier.name} to ${after.tier.name}.`
                : progAfter.next
                  ? `${formatNumber(progAfter.remaining)} XP to ${progAfter.next.name}.`
                  : 'You are in the top tier.'}
            </p>
            <p className="rank-move">
              <Icon name="trophy" size={18} />
              Global rank <strong>#{after.position}</strong>
              {moved > 0 && <span className="move move-up">up {moved} {moved === 1 ? 'place' : 'places'}</span>}
              {moved < 0 && <span className="move move-down">down {Math.abs(moved)} {Math.abs(moved) === 1 ? 'place' : 'places'}</span>}
              {moved === 0 && <span className="move">no change</span>}
            </p>
          </div>
        </section>
      </div>

      {newBadges.length > 0 && (
        <section className="panel unlocked" aria-labelledby="badge-title">
          <div className="panel-head"><h2 id="badge-title">Badges unlocked</h2></div>
          <ul className="unlocked-list">
            {newBadges.map((b) => (
              <li key={b.id}>
                <span className="badge-big is-earned"><Icon name={b.icon} size={26} /></span>
                <div>
                  <strong>{b.name}</strong>
                  <small>{b.description} +{b.bonus} XP</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {res.rows.length > 0 && (
        <section className="panel" aria-labelledby="review-title">
          <div className="panel-head"><h2 id="review-title">Question review</h2></div>
          <ol className="review">
            {res.rows.map((r, i) => (
              <li key={r.id + i}>
                <p className="review-q">{r.text}</p>
                <p className="review-a">Correct answer: <strong>{LETTERS[r.answer]}. {r.options[r.answer]}</strong></p>
                <div className="review-chips">
                  <span className={`chip ${r.mine?.correct ? 'chip-win' : 'chip-lose'}`}>
                    You: {r.mine ? (r.mine.choice === null ? 'no answer' : r.mine.correct ? `correct, +${r.mine.points}` : 'wrong') : 'not played'}
                  </span>
                  <span className={`chip ${r.theirs?.correct ? 'chip-win' : 'chip-lose'}`}>
                    {res.opponent.name}: {r.theirs ? (r.theirs.choice === null ? 'no answer' : r.theirs.correct ? `correct, +${r.theirs.points}` : 'wrong') : 'no answer'}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="result-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate(`/play?cat=${res.categoryId}`)}>
          <Icon name="refresh" size={20} /> Play again
        </button>
        <button type="button" className="btn btn-lg" onClick={() => navigate('/leaderboard')}>
          <Icon name="trophy" size={20} /> Leaderboard
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/')}>Back to home</button>
      </div>
    </div>
  )
}
