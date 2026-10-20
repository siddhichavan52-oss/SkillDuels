import { useState } from 'react'
import { MATCH_QUESTIONS, MIN_QUESTIONS_TO_PLAY, QUESTION_SECONDS } from './data'
import { canPlay, playableCount, useStore } from './store'
import { PageHeader } from './ui'
import { Icon } from './Icons'
import Matchmaking from './Matchmaking'

export default function Lobby({ user, query, onStart }) {
  const { data } = useStore()
  const [selected, setSelected] = useState(() => {
    const wanted = data.categories.find((c) => c.id === query.cat)
    return wanted && canPlay(data, wanted.id) ? wanted : null
  })

  return (
    <div className="stack">
      <PageHeader title="Choose your battleground">
        Pick a skill area. You will be matched with another player, or with a practice bot if nobody is online.
      </PageHeader>

      <section className="rules" aria-label="How a duel works">
        <span><Icon name="list" size={18} /> {MATCH_QUESTIONS} questions</span>
        <span><Icon name="clock" size={18} /> {QUESTION_SECONDS} seconds each</span>
        <span><Icon name="bolt" size={18} /> Faster correct answers score more</span>
        <span><Icon name="trophy" size={18} /> Winner earns bonus XP</span>
      </section>

      <div className="cat-grid">
        {data.categories.map((c) => {
          const count = playableCount(data, c.id)
          const ready = canPlay(data, c.id)
          return (
            <article key={c.id} className="cat-card" style={{ '--cat': c.color }}>
              <span className="cat-card-icon"><Icon name={c.icon} size={30} /></span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <div className="cat-card-foot">
                <span className="cat-count">{count} {count === 1 ? 'question' : 'questions'}</span>
                <button type="button" className="btn btn-ink" disabled={!ready} onClick={() => setSelected(c)} aria-label={`Play ${c.name}`}>
                  Play
                </button>
              </div>
              {!ready && <p className="cat-warn">Needs at least {MIN_QUESTIONS_TO_PLAY} published questions before it can be played.</p>}
            </article>
          )
        })}
      </div>

      {data.categories.length === 0 && (
        <p className="panel-note">No categories exist yet. An administrator can add some from the Admin panel.</p>
      )}

      {selected && <Matchmaking user={user} category={selected} onCancel={() => setSelected(null)} onReady={onStart} />}
    </div>
  )
}
