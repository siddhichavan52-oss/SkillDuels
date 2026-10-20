import { useEffect, useRef, useState } from 'react'
import { BOT_OPPONENTS, SEARCH_SECONDS } from './data'
import { pickQuestions } from './store'
import { createBotChannel, createLiveChannel, liveSupported, searchForOpponent } from './matchChannel'
import { Avatar, TierChip } from './ui'
import { Icon } from './Icons'

// Full-screen overlay: searches for a live opponent, falls back to a practice bot,
// then shows a short "versus" splash before the duel starts.
export default function Matchmaking({ user, category, onCancel, onReady }) {
  const [seconds, setSeconds] = useState(SEARCH_SECONDS)
  const [found, setFound] = useState(null)
  const cancelSearch = useRef(() => {})
  const settled = useRef(false)

  const startWith = (opponent, mode, matchId, questions) => {
    if (settled.current) return
    settled.current = true
    cancelSearch.current()
    setFound({ opponent, mode })
    setTimeout(() => {
      onReady({
        mode,
        matchId,
        category,
        questions,
        me: user,
        opponent,
        makeChannel: () =>
          mode === 'live' ? createLiveChannel({ matchId, meId: user.id }) : createBotChannel(opponent),
      })
    }, 1700)
  }

  const playBot = () => {
    const bot = BOT_OPPONENTS[Math.floor(Math.random() * BOT_OPPONENTS.length)]
    startWith({ ...bot, isBot: true }, 'bot', `bot_${Date.now()}`, pickQuestions(category.id))
  }

  // Look for a human opponent in another tab, and count down to the bot fallback.
  useEffect(() => {
    settled.current = false
    cancelSearch.current = searchForOpponent({
      me: user,
      categoryId: category.id,
      makeQuestions: () => pickQuestions(category.id),
      onFound: ({ matchId, questions, opponent }) => startWith(opponent, 'live', matchId, questions),
    })
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => {
      clearInterval(tick)
      cancelSearch.current()
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (seconds === 0 && !settled.current) playBot()
    // eslint-disable-next-line
  }, [seconds])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !settled.current && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="mm" role="dialog" aria-modal="true" aria-labelledby="mm-title">
      {!found ? (
        <div className="mm-card">
          <div className="radar" aria-hidden="true">
            <span /><span /><span />
            <Avatar name={user.name} color={user.avatarColor} size={64} />
          </div>
          <h2 id="mm-title">Looking for an opponent in {category.name}</h2>
          <p className="mm-sub" aria-live="polite">
            A practice bot joins in {seconds} {seconds === 1 ? 'second' : 'seconds'} if nobody else is available.
          </p>
          {liveSupported() && (
            <p className="mm-tip">
              <Icon name="users" size={16} />
              To duel a friend live, open SkillDuels in a second tab, log in as another player, and choose the same category.
            </p>
          )}
          <div className="mm-actions">
            <button type="button" className="btn btn-primary" onClick={playBot} autoFocus>Play a practice bot now</button>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mm-card mm-found" role="status">
          <h2 id="mm-title">Opponent found</h2>
          <div className="versus">
            <div className="versus-side versus-you">
              <Avatar name={user.name} color={user.avatarColor} size={84} />
              <strong>{user.name}</strong>
              <TierChip xp={user.xp} />
            </div>
            <span className="versus-vs">VS</span>
            <div className="versus-side versus-foe">
              <Avatar name={found.opponent.name} color={found.opponent.avatarColor} size={84} />
              <strong>{found.opponent.name}</strong>
              {found.mode === 'bot' ? <span className="bot-tag">Practice bot</span> : <TierChip xp={found.opponent.xp} />}
            </div>
          </div>
          <p className="mm-sub">Category: {category.name}. Get ready.</p>
        </div>
      )}
    </div>
  )
}
