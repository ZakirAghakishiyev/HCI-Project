import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { SkillLevel, SportId, TimePref } from '../types'
import { LEVELS, SPORT_ORDER, TIMES } from '../data/options'
import { getSession } from '../data/catalog'
import { matchBuddies, proposedSession } from '../lib/filter'
import { sportLabel } from '../lib/format'
import { Avatar, Button, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Buddies() {
  useTitle('Sport buddies')
  const { user, sendInvite } = useApp()
  const navigate = useNavigate()
  const [sport, setSport] = useState<SportId | 'all'>(user?.preferences.sports[0] ?? 'all')
  const [level, setLevel] = useState<SkillLevel | 'all'>(user?.preferences.level ?? 'all')
  const [time, setTime] = useState<TimePref | 'all'>(user?.preferences.times[0] ?? 'all')
  const [menu, setMenu] = useState<'sport' | 'level' | 'time' | null>(null)
  if (!user) return null
  const list = matchBuddies(user, { sport, level, time })
  const timeLabel = time === 'all' ? 'Any time' : time === 'weekday-evenings' ? 'Thursday Eve' : TIMES.find((item) => item.id === time)?.title

  return (
    <Shell nav>
      <div className="stack-lg">
        <div className="seg">
          <button onClick={() => navigate('/explore')}>Sessions</button>
          <button className="on">Buddies</button>
        </div>
        <div className="stack">
          <h1 className="h1">You don’t have to come back alone.</h1>
          <p className="muted">Meet people who enjoy the same sports as you, and play at your pace.</p>
        </div>
        <div className="cluster">
          <button className="chip on" onClick={() => setMenu(menu === 'sport' ? null : 'sport')}>{sport === 'all' ? 'All sports' : sportLabel(sport)} ▾</button>
          <button className="chip on" onClick={() => setMenu(menu === 'level' ? null : 'level')}>{level === 'all' ? 'Any level' : LEVELS.find((item) => item.id === level)?.title} ▾</button>
          <button className="chip on" onClick={() => setMenu(menu === 'time' ? null : 'time')}>{timeLabel} ▾</button>
        </div>
        {menu === 'sport' && <div className="cluster">{SPORT_ORDER.map((item) => <button key={item} className={sport === item ? 'chip navy' : 'chip'} onClick={() => { setSport(item); setMenu(null) }}>{sportLabel(item)}</button>)}<button className="chip" onClick={() => { setSport('all'); setMenu(null) }}>All</button></div>}
        {menu === 'level' && <div className="cluster">{LEVELS.map((item) => <button key={item.id} className={level === item.id ? 'chip navy' : 'chip'} onClick={() => { setLevel(item.id); setMenu(null) }}>{item.title}</button>)}<button className="chip" onClick={() => { setLevel('all'); setMenu(null) }}>Any</button></div>}
        {menu === 'time' && <div className="cluster">{TIMES.map((item) => <button key={item.id} className={time === item.id ? 'chip navy' : 'chip'} onClick={() => { setTime(item.id); setMenu(null) }}>{item.title}</button>)}<button className="chip" onClick={() => { setTime('all'); setMenu(null) }}>Any</button></div>}
        <p className="tiny">Looking for returning buddies? <b style={{ color: 'var(--ink)' }}>{list.length} {list.length === 1 ? 'match' : 'matches'} near campus</b></p>
        <div className="stack">
          {list.map((person, index) => {
            const session = proposedSession(user, person)
            const invite = session ? user.invitations.find((item) => item.buddyId === person.id && item.sessionId === session.id && item.status !== 'declined') : undefined
            const featured = index === 0
            return (
              <article key={person.id} className="person-card">
                <div className="between">
                  <div className="cluster">
                    <Avatar src={person.avatar} name={person.name} size={featured ? 64 : 48} />
                    <div>
                      <b>{person.name}, {person.age}</b>
                      <div className="tiny">{person.sportLabel} · {person.levelLabel}</div>
                      <div className="tiny">{person.distanceKm} km away · Campus area</div>
                    </div>
                  </div>
                  <span className="compat">{person.compatibility}%</span>
                </div>
                {featured && person.breakNote && <div className="green-box"><b>{person.breakNote}</b><span className="tiny">{person.availability}</span></div>}
                <p className="quote">“{person.quote}”</p>
                {featured && <div className="cluster">{person.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>}
                <div className="between">
                  <Link className="btn btn-outline btn-sm" to={`/buddies/${person.id}`}>View Profile</Link>
                  <Button size="sm" variant="navy" disabled={!session || Boolean(invite)} onClick={() => session && sendInvite(person.id, session.id)}>
                    {invite ? (invite.status === 'accepted' ? 'Accepted' : 'Pending') : 'Invite to Session'}
                  </Button>
                </div>
                {session && <p className="tiny">Shared idea: {getSession(session.id)?.name}</p>}
              </article>
            )
          })}
          {list.length === 0 && <div className="empty card pad"><b>No one fits these filters right now.</b><p className="tiny">Widening the day or the level usually helps. People here are also coming back.</p></div>}
        </div>
      </div>
    </Shell>
  )
}
