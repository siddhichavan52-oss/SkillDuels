import { useMemo, useState } from 'react'
import { computeBoard, useStore } from './store'
import { Avatar, EmptyState, PageHeader, TierChip } from './ui'
import { Icon } from './Icons'
import { formatNumber, winRate } from './utils'

const PODIUM_ORDER = [1, 0, 2] // render 2nd, 1st, 3rd so the winner stands in the middle
const PODIUM_COLORS = ['#FFC93C', '#D5DAF0', '#FFB98A']

export default function Leaderboard({ user }) {
  const { data } = useStore()
  const [kind, setKind] = useState('global')
  const [query, setQuery] = useState('')
  const board = useMemo(() => computeBoard(data.users, kind), [data.users, kind])
  const top = board.slice(0, 3)
  const filtered = board.filter((r) => r.user.name.toLowerCase().includes(query.trim().toLowerCase()))
  const me = board.find((r) => r.user.id === user.id)

  return (
    <div className="stack">
      <PageHeader title="Leaderboard">
        {kind === 'global' ? 'All-time rankings by total XP earned.' : 'This week\'s rankings by XP earned since Monday. They reset every week.'}
      </PageHeader>

      <div className="board-controls">
        <div className="tabs tabs-inline" role="tablist" aria-label="Ranking period">
          <button type="button" role="tab" className="tab" aria-selected={kind === 'global'} onClick={() => setKind('global')}>
            <Icon name="globe" size={16} /> Global
          </button>
          <button type="button" role="tab" className="tab" aria-selected={kind === 'weekly'} onClick={() => setKind('weekly')}>
            <Icon name="clock" size={16} /> Weekly
          </button>
        </div>
        <div className="search">
          <Icon name="search" size={18} />
          <label htmlFor="board-search" className="sr-only">Search players</label>
          <input id="board-search" type="search" placeholder="Search players" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {me && (
        <p className="my-rank" role="status">
          You are ranked <strong>#{me.rank}</strong> {kind === 'global' ? 'overall' : 'this week'} with <strong>{formatNumber(me.xp)} XP</strong>.
        </p>
      )}

      {top.length === 3 && !query && (
        <ol className="podium" aria-label="Top three players">
          {PODIUM_ORDER.map((i) => {
            const r = top[i]
            return (
              <li key={r.user.id} className={`podium-spot podium-${r.rank}`}>
                <Avatar name={r.user.name} color={r.user.avatarColor} size={r.rank === 1 ? 72 : 58} />
                <strong>{r.user.name}{r.user.id === user.id && ' (you)'}</strong>
                <span>{formatNumber(r.xp)} XP</span>
                <div className="podium-block" style={{ background: PODIUM_COLORS[i] }}>
                  <span className="sr-only">Rank </span>{r.rank}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="No players found">Try a different name.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{kind === 'global' ? 'Global' : 'Weekly'} leaderboard</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Player</th>
                <th scope="col" className="col-hide">Tier</th>
                <th scope="col" className="col-hide num">Win rate</th>
                <th scope="col" className="num">XP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.user.id} className={r.user.id === user.id ? 'is-me' : ''} aria-current={r.user.id === user.id ? 'true' : undefined}>
                  <td><span className={`rank-badge rank-${r.rank <= 3 ? r.rank : 'n'}`}>{r.rank}</span></td>
                  <td>
                    <span className="player-cell">
                      <Avatar name={r.user.name} color={r.user.avatarColor} size={34} />
                      <span>{r.user.name}{r.user.id === user.id && <em className="you-tag">You</em>}</span>
                    </span>
                  </td>
                  <td className="col-hide"><TierChip xp={r.user.xp} /></td>
                  <td className="col-hide num">{winRate(r.user)}%</td>
                  <td className="num"><strong>{formatNumber(r.xp)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
