import { useEffect, useRef, useState } from 'react'
import { QUESTION_SECONDS, REVEAL_MS } from './data'
import { clearDraft, saveDraft } from './store'
import { scorePoints } from './utils'
import { Avatar, ConfirmDialog } from './ui'
import { Icon } from './Icons'

const LETTERS = ['A', 'B', 'C', 'D']
const sum = (rec) => Object.values(rec).reduce((n, r) => n + (r.points || 0), 0)

function PlayerCard({ side, player, score, label, answered }) {
  return (
    <div className={`duelist duelist-${side}`}>
      <Avatar name={player.name} color={player.avatarColor} size={52} />
      <div className="duelist-info">
        <strong>{player.name}</strong>
        <span>{label}</span>
      </div>
      <div className="duelist-score">
        <strong key={score} className="score-num">{score}</strong>
        <span className={`answered ${answered ? 'is-on' : ''}`}>
          <Icon name="check" size={12} /> {answered ? 'Answered' : 'Thinking'}
        </span>
      </div>
    </div>
  )
}

export default function Match({ config, onFinish }) {
  const { me, opponent, questions, category } = config
  const total = questions.length

  const [phase, setPhase] = useState('intro') // intro | question | reveal
  const [count, setCount] = useState(3)
  const [index, setIndex] = useState(0)
  const [mine, setMine] = useState({})
  const [theirs, setTheirs] = useState({})
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS)
  const [oppLeft, setOppLeft] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const channel = useRef(null)
  const deadline = useRef(0)
  const finished = useRef(false)
  const latest = useRef({ mine, theirs, phase, index })
  useEffect(() => {
    latest.current = { mine, theirs, phase, index }
  })

  const myScore = sum(mine)
  const oppScore = sum(theirs)
  const question = questions[index]

  /* ----- Real-time channel (bot or live opponent) ----- */
  useEffect(() => {
    const ch = config.makeChannel()
    channel.current = ch
    const offAnswer = ch.onOpponentAnswer((p) => {
      setTheirs((t) => ({ ...t, [p.q]: p }))
      const cur = latest.current
      if (cur.phase === 'question' && cur.index === p.q && cur.mine[p.q]) setPhase('reveal')
    })
    const offLeave = ch.onOpponentLeave(() => setOppLeft(true))
    return () => {
      offAnswer()
      offLeave()
      ch.close()
      channel.current = null
    }
  }, [config])

  /* ----- Get-ready countdown ----- */
  useEffect(() => {
    if (phase !== 'intro') return
    let n = 3
    const id = setInterval(() => {
      n -= 1
      setCount(n)
      if (n <= 0) {
        clearInterval(id)
        setTimeLeft(QUESTION_SECONDS)
        setPhase('question')
      }
    }, 900)
    return () => clearInterval(id)
  }, [phase])

  /* ----- Per-question countdown timer (FR-04) ----- */
  useEffect(() => {
    if (phase !== 'question') return
    deadline.current = Date.now() + QUESTION_SECONDS * 1000
    channel.current?.questionStarted({ index, question: questions[index], seconds: QUESTION_SECONDS })

    const id = setInterval(() => {
      const left = Math.max(0, (deadline.current - Date.now()) / 1000)
      setTimeLeft(left)
      if (left <= 0) {
        clearInterval(id)
        // Time is up: close the question and play advances (AC-03).
        setMine((m) => (m[index] ? m : { ...m, [index]: { q: index, choice: null, correct: false, points: 0, time: QUESTION_SECONDS } }))
        setPhase('reveal')
      }
    }, 100)
    return () => clearInterval(id)
  }, [phase, index, questions])

  /* ----- After the reveal pause: next question or finish ----- */
  useEffect(() => {
    if (phase !== 'reveal') return
    const id = setTimeout(() => {
      if (index + 1 < total) {
        setIndex(index + 1)
        setTimeLeft(QUESTION_SECONDS)
        setPhase('question')
      } else {
        finish()
      }
    }, REVEAL_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line
  }, [phase, index, total])

  /* ----- Opponent left: the remaining player wins ----- */
  useEffect(() => {
    if (oppLeft && !finished.current) finish({ oppForfeit: true })
    // eslint-disable-next-line
  }, [oppLeft])

  /* ----- Save progress after every answer so nothing is lost (NFR-04) ----- */
  useEffect(() => {
    if (finished.current || Object.keys(mine).length === 0) return
    saveDraft(me.id, {
      categoryId: category.id,
      mode: config.mode,
      oppName: opponent.name,
      myScore: sum(mine),
      oppScore: sum(theirs),
      correct: Object.values(mine).filter((r) => r.correct).length,
      total,
      quick: Object.values(mine).filter((r) => r.correct && r.time < 3).length,
    })
  }, [mine, theirs, me.id, category.id, config.mode, opponent.name, total])

  function finish(extra = {}) {
    if (finished.current) return
    finished.current = true
    clearDraft(me.id)
    const { mine: m, theirs: t } = latest.current
    const rows = questions.map((qu, i) => ({
      id: qu.id,
      text: qu.text,
      options: qu.options,
      answer: qu.answer,
      mine: m[i] || null,
      theirs: t[i] || null,
    }))
    const answered = Object.values(m).filter((r) => r.choice !== null)
    onFinish({
      categoryId: category.id,
      categoryName: category.name,
      mode: config.mode,
      opponent,
      myScore: sum(m),
      oppScore: sum(t),
      correct: Object.values(m).filter((r) => r.correct).length,
      total,
      avgTime: answered.length ? answered.reduce((n, r) => n + r.time, 0) / answered.length : null,
      quick: Object.values(m).filter((r) => r.correct && r.time < 3).length,
      rows,
      ...extra,
    })
  }

  function answer(choice) {
    if (phase !== 'question' || mine[index] || confirmLeave) return
    const remaining = Math.max(0, (deadline.current - Date.now()) / 1000)
    const correct = choice === question.answer
    const rec = {
      q: index,
      choice,
      correct,
      points: correct ? scorePoints(remaining, QUESTION_SECONDS) : 0,
      time: +(QUESTION_SECONDS - remaining).toFixed(1),
    }
    setMine((m) => ({ ...m, [index]: rec }))
    channel.current?.sendAnswer(rec)
    if (latest.current.theirs[index]) setPhase('reveal')
  }

  // Keyboard: 1-4 or A-D picks an answer.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      const i = ['1', '2', '3', '4'].indexOf(k) !== -1 ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k)
      if (i >= 0) answer(i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function forfeit() {
    channel.current?.leave()
    finish({ forfeited: true })
  }

  /* ----- Derived display values ----- */
  const m = mine[index]
  const t = theirs[index]
  const revealed = phase === 'reveal'
  const showOpp = revealed || (m && t)
  const pct = (timeLeft / QUESTION_SECONDS) * 100
  const urgent = timeLeft <= 5
  const share = (myScore + 30) / (myScore + oppScore + 60)

  let status = ''
  if (phase === 'question') {
    if (m && !t) status = `Answer locked in. Waiting for ${opponent.name}.`
    else if (!m && t) status = `${opponent.name} has answered. Your move.`
    else if (!m) status = 'Pick an answer before the timer runs out.'
  } else if (revealed) {
    if (m?.choice === null) status = "Time's up. No points this round."
    else status = m?.correct ? `Correct. You scored ${m.points} points.` : 'Not quite. No points this round.'
  }

  if (phase === 'intro') {
    return (
      <div className="match match-intro" role="status" aria-live="assertive">
        <p className="intro-cat">{category.name}</p>
        <div className="intro-vs">
          <Avatar name={me.name} color={me.avatarColor} size={72} />
          <span className="versus-vs">VS</span>
          <Avatar name={opponent.name} color={opponent.avatarColor} size={72} />
        </div>
        <p className="intro-names">{me.name} against {opponent.name}</p>
        <div className="intro-count" key={count}>{count || 'Go'}</div>
      </div>
    )
  }

  return (
    <div className="match">
      <header className="duel-head">
        <PlayerCard side="you" player={me} score={myScore} label="You" answered={!!m} />
        <div className="duel-vs" aria-hidden="true">VS</div>
        <PlayerCard side="foe" player={opponent} score={oppScore} label={opponent.isBot ? 'Practice bot' : 'Opponent'} answered={!!t} />
      </header>

      <div
        className="tug"
        role="img"
        aria-label={`Live score: you ${myScore}, ${opponent.name} ${oppScore}`}
      >
        <span className="tug-you" style={{ flexGrow: share * 100 }} />
        <span className="tug-foe" style={{ flexGrow: (1 - share) * 100 }} />
      </div>

      <section className="q-card" aria-labelledby="q-text">
        <div className="q-meta">
          <span className="q-count">Question {index + 1} of {total}</span>
          <ol className="pips" aria-hidden="true">
            {questions.map((_, i) => {
              const r = mine[i]
              const cls = i === index ? 'is-now' : r ? (r.correct ? 'is-right' : 'is-wrong') : ''
              return <li key={i} className={cls} />
            })}
          </ol>
          <span className={`q-timer ${urgent ? 'is-urgent' : ''}`} aria-hidden="true">
            <Icon name="clock" size={18} />
            {Math.ceil(timeLeft)}s
          </span>
        </div>

        <div className={`timer-bar ${urgent ? 'is-urgent' : ''}`} role="timer" aria-label={`${Math.ceil(timeLeft)} seconds left`}>
          <span style={{ width: `${pct}%` }} />
        </div>

        <h2 id="q-text" className="q-text">{question.text}</h2>

        <div className="options" role="group" aria-labelledby="q-text">
          {question.options.map((opt, i) => {
            const cls = ['option']
            if (m?.choice === i) cls.push('is-mine', m.correct ? 'is-right' : 'is-wrong')
            if ((m || revealed) && i === question.answer) cls.push('is-answer')
            if ((m || revealed) && m?.choice !== i && i !== question.answer) cls.push('is-dim')
            return (
              <button key={i} type="button" className={cls.join(' ')} disabled={!!m || revealed} onClick={() => answer(i)}>
                <span className="option-key">{LETTERS[i]}</span>
                <span className="option-text">{opt}</span>
                {showOpp && t?.choice === i && (
                  <span className="opp-mark" title={`${opponent.name} chose this`}>
                    <span className="sr-only">{opponent.name} chose this answer</span>
                    {opponent.name[0]}
                  </span>
                )}
                {m?.choice === i && m.correct && <span className="gain">+{m.points}</span>}
              </button>
            )
          })}
        </div>

        <p className="q-status" aria-live="polite">{status}</p>
      </section>

      <footer className="match-foot">
        <span className="key-hint">Tip: press 1 to 4, or A to D, to answer</span>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setConfirmLeave(true)}>
          <Icon name="flag" size={16} /> Leave match
        </button>
      </footer>

      {confirmLeave && (
        <ConfirmDialog
          title="Leave this match?"
          message={`If you leave now, ${opponent.name} wins and you keep only the points you have already earned.`}
          confirmLabel="Leave match"
          cancelLabel="Keep playing"
          danger
          onConfirm={forfeit}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </div>
  )
}

