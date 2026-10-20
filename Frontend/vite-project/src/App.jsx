import { useCallback, useEffect, useRef, useState } from 'react'
import './components/styles.css'
import { logout, recordMatch, recoverInterrupted, useCurrentUser } from './components/store'
import { ToastProvider } from './components/Toast'
import { useToast } from './components/toastContext'
import AuthPage from './components/AuthPage'
import Landing from './components/Landing'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Lobby from './components/Lobby'
import Match from './components/Match'
import Result from './components/Result'
import Leaderboard from './components/Leaderboard'
import Profile from './components/Profile'
import AdminPanel from './components/AdminPanel'
import { Icon } from './components/Icons'
import { formatNumber } from './components/utils'

const TITLES = {
  '/': 'Home',
  '/login': 'Log in',
  '/signup': 'Create account',
  '/play': 'Play',
  '/match': 'Duel',
  '/result': 'Result',
  '/leaderboard': 'Leaderboard',
  '/profile': 'Profile',
  '/admin': 'Admin panel',
}

// Tiny hash router: "#/play?cat=technical" -> { path: '/play', query: { cat: 'technical' } }
function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, qs = ''] = raw.split('?')
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) }
}

function useRoute() {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((to) => {
    window.location.hash = to
  }, [])
  return [route, navigate]
}

function Shell() {
  const toast = useToast()
  const user = useCurrentUser()
  const [route, navigate] = useRoute()
  const [match, setMatch] = useState(null) // config of the duel in progress
  const [outcome, setOutcome] = useState(null) // { summary, res } of the last duel
  const mainRef = useRef(null)

  // Save any duel that was interrupted (closed tab, lost connection) before this sign-in.
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    const summary = recoverInterrupted(userId)
    if (summary) toast(`Your interrupted duel was saved. You kept +${formatNumber(summary.xpGained)} XP.`, 'info')
  }, [userId, toast])

  // Page title and keyboard focus follow navigation.
  useEffect(() => {
    document.title = `${TITLES[route.path] || 'SkillDuels'} - SkillDuels`
    if (route.path !== '/match') mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [route.path])

  useEffect(() => {
    if (userId && (route.path === '/login' || route.path === '/signup')) navigate('/')
  }, [userId, route.path, navigate])

  const startMatch = useCallback(
    (config) => {
      setMatch(config)
      setOutcome(null)
      navigate('/match')
    },
    [navigate],
  )

  const finishMatch = useCallback(
    (res) => {
      const summary = recordMatch(userId, res)
      setMatch(null)
      setOutcome({ summary, res })
      navigate('/result')
    },
    [navigate, userId],
  )

  const handleLogout = () => {
    logout()
    setMatch(null)
    setOutcome(null)
    navigate('/')
    toast('You are logged out.', 'info')
  }

  if (!user) {
    if (route.path === '/login' || route.path === '/signup')
      return <AuthPage key={route.path} initialMode={route.path === '/signup' ? 'register' : 'login'} navigate={navigate} />
    return <Landing navigate={navigate} />
  }

  let path = route.path
  if (!TITLES[path] || path === '/login' || path === '/signup') path = '/'
  if (path === '/admin' && user.role !== 'admin') path = '/'
  if (path === '/match' && !match) path = '/play'
  if (path === '/result' && !outcome) path = '/'
  if (user.role === 'admin' && ['/play', '/match', '/result', '/profile'].includes(path)) path = '/admin'
  if (user.role === 'admin' && path === '/') path = '/admin'

  const inMatch = path === '/match'

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>
        Skip to content
      </a>
      {!inMatch && <Navbar user={user} path={path} onLogout={handleLogout} />}
      <main id="main" ref={mainRef} tabIndex={-1} className={inMatch ? 'main main-match' : 'main'}>
        {path === '/' && <Dashboard user={user} navigate={navigate} />}
        {path === '/play' && <Lobby user={user} query={route.query} onStart={startMatch} />}
        {path === '/match' && <Match key={match.matchId} config={match} onFinish={finishMatch} />}
        {path === '/result' && <Result outcome={outcome} user={user} navigate={navigate} />}
        {path === '/leaderboard' && <Leaderboard user={user} />}
        {path === '/profile' && <Profile user={user} navigate={navigate} />}
        {path === '/admin' && <AdminPanel />}
      </main>
      {!inMatch && (
        <footer className="footer">
          <Icon name="swords" size={16} /> SkillDuels. Learn by competing.
        </footer>
      )}
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
