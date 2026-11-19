import { useState } from 'react'
import { sportLabel } from '../lib/format'
import { durationLabel, whenShort } from '../lib/format'
import { completedThisWeek, upcomingOf, weekMarks } from '../lib/user'
import { Button, ButtonLink, Sheet, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Progress() {
  useTitle('Progress')
  const { user, setWeeklyGoal } = useApp()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const sport = user.preferences.sports[0]
  const sportName = sport ? sportLabel(sport).toLowerCase() : 'sport'
  const thisWeek = completedThisWeek(user)
  const upcoming = upcomingOf(user)[0]
  const marks = weekMarks(user)
  const ahead = thisWeek >= user.weeklyGoal
  const title = ahead ? `Play one more ${sportName} session this week.` : `Play ${Math.max(1, user.weeklyGoal - thisWeek)} ${sportName} session${user.weeklyGoal - thisWeek === 1 ? '' : 's'} this week.`
  const body = upcoming
    ? `Completing ${whenShort(upcoming.snapshot.startsAt)} keeps the rhythm going. It secures the next easy week, not a perfect one.`
    : 'One easy session is enough. Consistency beats intensity, and rest is allowed.'

  return (
    <Shell nav overlay={open ? (
      <Sheet title="Set the next small goal" onClose={() => setOpen(false)}>
        <p className="help">Pick a number you can keep on a busy week. One is a complete success.</p>
        <div className="cluster">
          {[1, 2, 3].map((goal) => <button key={goal} className={user.weeklyGoal === goal ? 'chip navy' : 'chip'} onClick={() => { setWeeklyGoal(goal); setOpen(false) }}>{goal} a week</button>)}
        </div>
      </Sheet>
    ) : null}>
      <div className="stack-lg">
        <div className="between"><div><p className="kicker">Small wins</p><h1 className="h1">Look how far you’ve come.</h1></div><span className="tiny">Updated just now</span></div>
        <p className="muted">No calorie counters or leaderboards. Just real sessions and a routine you can keep.</p>
        <div className="stats">
          <article className="stat"><span className="tiny">Sessions completed</span><b>{user.stats.sessions}</b><span className="tiny">{thisWeek > 0 ? `+${thisWeek} this week` : 'None this week yet'}</span></article>
          <article className="stat"><span className="tiny">Total active time</span><b style={{ fontSize: 22 }}>{durationLabel(user.stats.minutes)}</b><span className="tiny">Recreational pace</span></article>
          <article className="stat dark"><span className="tiny">Current streak</span><b>{user.stats.streak} wk{user.stats.streak === 1 ? '' : 's'}</b><span className="tiny">Solid consistency</span></article>
          <article className="stat"><span className="tiny">Sports explored</span><b>{user.stats.sports}</b><span className="tiny">{sport ? sportLabel(sport) : 'Pick a sport'}</span></article>
        </div>
        <section className="card pad stack">
          <div className="between"><b>Weekly participation</b><span className="pill">{ahead ? 'On track' : 'Still open'}</span></div>
          <div className="week">
            {marks.map((day) => (
              <div key={day.key}>
                <small className={day.today ? 'today' : undefined}>{day.label}</small>
                <i className={day.done ? 'on' : day.planned ? 'plan' : ''}>{day.done ? '✓' : ''}</i>
              </div>
            ))}
          </div>
        </section>
        <section className="stack">
          <h2 className="section-label">Unlocked milestones</h2>
          <div className="miles">
            {user.achievements.map((item) => (
              <article key={item.id} className={item.unlocked ? 'mile' : 'mile off'}>
                <b>{item.title}</b>
                <span className="tiny">{item.unlocked ? item.detail : 'Ready when you are'}</span>
              </article>
            ))}
          </div>
        </section>
        {user.feedback.length > 0 && (
          <section className="stack">
            <h2 className="section-label">Private journal</h2>
            {user.feedback.slice(0, 3).map((item) => (
              <article key={item.id} className="journal">
                <b>{item.feeling}</b>
                <span className="tiny">{item.enjoyed.join(' · ')}</span>
                {item.note && <p>{item.note}</p>}
              </article>
            ))}
          </section>
        )}
        <section className="goal-banner">
          <span className="kicker" style={{ color: 'var(--lime)' }}>Your next small win</span>
          <h2 className="h2">{title}</h2>
          <p>{body}</p>
          <div className="cluster">
            <Button variant="lime" onClick={() => setOpen(true)}>Set My Next Goal</Button>
            <ButtonLink to="/explore" variant="outline" className="btn-sm">Find a session</ButtonLink>
          </div>
        </section>
      </div>
    </Shell>
  )
}
