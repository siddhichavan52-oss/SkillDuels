import { Avatar, Logo, TierChip } from './ui'
import { Icon } from './Icons'
import { formatNumber } from './utils'

const LINKS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/play', label: 'Play', icon: 'swords' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { path: '/profile', label: 'Profile', icon: 'user' },
]

export default function Navbar({ user, path, onLogout }) {
  // Administrators manage content; they do not play, so they get a focused menu.
  const links =
    user.role === 'admin'
      ? [{ path: '/admin', label: 'Admin', icon: 'settings' }, LINKS[2]]
      : LINKS

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a href="#/" className="topbar-logo" aria-label="SkillDuels home">
          <Logo />
        </a>

        <nav className="nav" aria-label="Main">
          {links.map((l) => (
            <a key={l.path} href={`#${l.path}`} className="nav-link" aria-current={path === l.path ? 'page' : undefined}>
              <Icon name={l.icon} size={20} />
              <span>{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="topbar-user">
          {user.role !== 'admin' && (
            <a href="#/profile" className="xp-pill" aria-label={`${formatNumber(user.xp)} XP. Open your profile`}>
              <Icon name="bolt" size={16} />
              <strong>{formatNumber(user.xp)}</strong> XP
            </a>
          )}
          <span className="topbar-me">
            <Avatar name={user.name} color={user.avatarColor} size={34} />
            <span className="topbar-name">
              <strong>{user.name}</strong>
              {user.role === 'admin' ? <small>Administrator</small> : <TierChip xp={user.xp} />}
            </span>
          </span>
          <button type="button" className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
            <Icon name="logout" size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
