import { useMemo } from 'react'
import { BADGES, MATCH_QUESTIONS, QUESTION_SECONDS, TIERS } from './data'
import { computeBoard, playableCount, useStore } from './store'
import { Avatar, Logo, TierChip } from './ui'
import { Icon } from './Icons'
import DuelPreview from './DuelPreview'
import { formatNumber } from './utils'

const STEPS = [
  {
    title: 'Choose a category',
    text: 'Pick technical, aptitude, logical reasoning or databases. You are paired with another student, or with a practice bot if nobody is online.',
    icon: 'book',
  },
  {
    title: 'Duel head to head',
    text: `Both players get the same ${MATCH_QUESTIONS} questions and ${QUESTION_SECONDS} seconds on each. Scores update live on both screens.`,
    icon: 'swords',
  },
  {
    title: 'Earn XP and climb',
    text: 'Faster correct answers score more. Win to collect bonus XP, unlock badges and move up the rankings.',
    icon: 'trophy',
  },
]

const FEATURES = [
  { icon: 'bolt', title: 'Live scoring', text: 'The moment an answer is locked in, your opponent sees the score change. No refresh, no waiting.' },
  { icon: 'clock', title: 'A clock on every question', text: 'A visible countdown keeps rounds quick and fair. When it hits zero, the question closes and play moves on.' },
  { icon: 'chart', title: 'Global and weekly rankings', text: 'See where you stand all-time, then reset the race every Monday with a fresh weekly board.' },
  { icon: 'flame', title: 'Badges and streaks', text: `Play on consecutive days, win three in a row, or ace a match. ${BADGES.length} badges pay out bonus XP.` },
  { icon: 'crown', title: 'Five tiers to earn', text: 'Progress from Rookie to Grandmaster as your total XP grows, with a clear target always in view.' },
  { icon: 'settings', title: 'Tools for educators', text: 'Add categories, write questions, and hide anything that needs review, all from one admin panel.' },
]

const FAQ = [
  {
    q: 'How are points calculated?',
    a: 'A correct answer is worth 100 points, plus up to 50 more for answering quickly. At the end of a match you add a result bonus: 100 XP for a win, 50 for a draw and 25 for a loss.',
  },
  {
    q: 'What if no one else is online?',
    a: 'If no opponent is found within eight seconds, you can play against a practice bot. Practice duels count toward your XP and rank the same way.',
  },
  {
    q: 'Which topics can I play?',
    a: 'Technical, aptitude, logical reasoning and databases to start. Administrators can add new categories and questions at any time.',
  },
  {
    q: 'Does it work on a phone or tablet?',
    a: 'Yes. The layout adapts to tablet and phone screens, and every control can also be used from a keyboard.',
  },
]

const scrollToSection = (id) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export default function Landing({ navigate }) {
  const { data } = useStore()
  const weekly = useMemo(() => computeBoard(data.users, 'weekly').slice(0, 5), [data.users])
  const topXp = weekly[0]?.xp || 1

  return (
    <div className="lp">
      <a className="skip-link" href="#lp-main" onClick={(e) => { e.preventDefault(); document.getElementById('lp-main')?.focus() }}>
        Skip to content
      </a>

      <header className="lp-header">
        <div className="lp-header-inner">
          <a href="#/" className="topbar-logo" aria-label="SkillDuels home"><Logo /></a>
          <nav className="lp-nav" aria-label="Page sections">
            <button type="button" onClick={() => scrollToSection('how')}>How it works</button>
            <button type="button" onClick={() => scrollToSection('categories')}>Categories</button>
            <button type="button" onClick={() => scrollToSection('features')}>Features</button>
            <button type="button" onClick={() => scrollToSection('rankings')}>Rankings</button>
            <button type="button" onClick={() => scrollToSection('faq')}>FAQ</button>
          </nav>
          <div className="lp-actions">
            <button type="button" className="btn btn-ghost-plain" onClick={() => navigate('/login')}>Log in</button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/signup')}>Get started</button>
          </div>
        </div>
      </header>

      <main id="lp-main" tabIndex={-1}>
        {/* Hero */}
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-pill"><Icon name="bolt" size={14} /> Live quiz battles for students</p>
              <h1 id="lp-hero-title">Turn revision into a <span className="nowrap">head-to-head</span> contest.</h1>
              <p className="lp-lead">
                SkillDuels pairs you with another student in a fast quiz battle. Answer quicker, earn XP and
                climb the leaderboard while you sharpen technical, aptitude and reasoning skills.
              </p>
              <div className="lp-cta">
                <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                  Create your account
                </button>
                <button type="button" className="btn btn-lg" onClick={() => scrollToSection('how')}>
                  See how it works
                </button>
              </div>
              <p className="lp-demo-note">
                Want a look first?{' '}
                <button type="button" className="text-link" onClick={() => navigate('/login')}>Use a demo account</button>
              </p>
            </div>

            <div className="lp-hero-visual">
              <DuelPreview />
              <div className="lp-float lp-float-xp" aria-hidden="true"><Icon name="bolt" size={16} /> +338 XP earned</div>
              <div className="lp-float lp-float-tier" aria-hidden="true"><Icon name="crown" size={16} /> Promoted to Strategist</div>
            </div>
          </div>

          <div className="lp-wrap">
            <ul className="lp-facts" aria-label="At a glance">
              <li><strong>{QUESTION_SECONDS}s</strong><span>per question</span></li>
              <li><strong>{MATCH_QUESTIONS}</strong><span>questions per duel</span></li>
              <li><strong>{data.categories.length}</strong><span>skill categories</span></li>
              <li><strong>{TIERS.length}</strong><span>tiers to reach</span></li>
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-section" id="how" aria-labelledby="how-title">
          <div className="lp-wrap">
            <div className="lp-head">
              <h2 id="how-title">How a duel works</h2>
              <p>From picking a topic to seeing your new rank takes about two minutes.</p>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="lp-step">
                  <span className="lp-step-n">{i + 1}</span>
                  <span className="lp-icon"><Icon name={s.icon} size={22} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Categories */}
        <section className="lp-section lp-alt" id="categories" aria-labelledby="cat-title">
          <div className="lp-wrap">
            <div className="lp-head">
              <h2 id="cat-title">Practise the skills that matter</h2>
              <p>Every category has its own question bank. New ones appear as administrators add them.</p>
            </div>
            <ul className="lp-cats">
              {data.categories.map((c) => (
                <li key={c.id} className="lp-cat" style={{ '--cat': c.color }}>
                  <span className="lp-cat-icon"><Icon name={c.icon} size={24} /></span>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <span className="lp-cat-count">{playableCount(data, c.id)} questions</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="lp-section" id="features" aria-labelledby="feat-title">
          <div className="lp-wrap">
            <div className="lp-head">
              <h2 id="feat-title">Built to keep you coming back</h2>
              <p>Competition gives you a reason to practise. Progress tracking shows you it is working.</p>
            </div>
            <ul className="lp-features">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <span className="lp-icon"><Icon name={f.icon} size={22} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Rankings + tiers */}
        <section className="lp-section lp-alt" id="rankings" aria-labelledby="rank-title">
          <div className="lp-wrap lp-rank-grid">
            <div>
              <div className="lp-head lp-head-left">
                <h2 id="rank-title">See who is leading this week</h2>
                <p>Weekly XP resets every Monday, so everyone gets a fresh shot at the top.</p>
              </div>
              <ol className="lp-board">
                {weekly.map((r) => (
                  <li key={r.user.id}>
                    <span className="lp-board-rank">{r.rank}</span>
                    <Avatar name={r.user.name} color={r.user.avatarColor} size={36} />
                    <div className="lp-board-main">
                      <strong>{r.user.name}</strong>
                      <span className="lp-bar"><i style={{ width: `${Math.max(6, (r.xp / topXp) * 100)}%` }} /></span>
                    </div>
                    <span className="lp-board-xp">{formatNumber(r.xp)} XP</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="lp-head lp-head-left">
                <h2>Climb the tiers</h2>
                <p>Total XP decides your tier. Each one is a clear milestone to aim for.</p>
              </div>
              <ol className="lp-tiers">
                {TIERS.map((t) => (
                  <li key={t.id}>
                    <TierChip tier={t} />
                    <span className="lp-tier-line" />
                    <span>{t.min === 0 ? 'Starting tier' : `${formatNumber(t.min)} XP`}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section" id="faq" aria-labelledby="faq-title">
          <div className="lp-wrap lp-faq-wrap">
            <div className="lp-head">
              <h2 id="faq-title">Questions, answered</h2>
            </div>
            <div className="lp-faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}<Icon name="plus" size={18} /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="lp-final" aria-labelledby="final-title">
          <div className="lp-wrap lp-final-inner">
            <h2 id="final-title">Ready for your first duel?</h2>
            <p>Create an account in under a minute, or explore with a demo player.</p>
            <div className="lp-cta lp-cta-center">
              <button type="button" className="btn btn-gold btn-lg" onClick={() => navigate('/signup')}>Create your account</button>
              <button type="button" className="btn btn-outline-light btn-lg" onClick={() => navigate('/login')}>Log in</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div className="lp-footer-brand">
            <Logo size={26} />
            <p>Competitive learning through live quiz battles.</p>
          </div>
          <nav aria-label="Footer">
            <button type="button" onClick={() => scrollToSection('how')}>How it works</button>
            <button type="button" onClick={() => scrollToSection('categories')}>Categories</button>
            <button type="button" onClick={() => scrollToSection('faq')}>FAQ</button>
            <button type="button" onClick={() => navigate('/login')}>Log in</button>
            <button type="button" onClick={() => navigate('/signup')}>Sign up</button>
          </nav>
        </div>
        <p className="lp-copy">&copy; 2026 SkillDuels. All rights reserved.</p>
      </footer>
    </div>
  )
}
