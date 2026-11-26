import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerson, sessionSettingLabel } from '../data/catalog'
import { money, relativeLabel, sportLabel, whenRange } from '../lib/format'
import { completedOf, upcomingOf } from '../lib/user'
import { assessWeather } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'
import { BookingWeatherBlock } from '../components/weather'
import { Button, ButtonLink, Sheet, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function MySessions() {
  useTitle('My Sessions')
  const { user, cancelBooking, completeBooking } = useApp()
  const navigate = useNavigate()
  const { forecast, error, loading } = useWeather(user?.area)
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming')
  const [cancelId, setCancelId] = useState<string | null>(null)
  if (!user) return null
  const upcoming = upcomingOf(user)
  const completed = completedOf(user)
  const list = tab === 'upcoming' ? upcoming : completed
  const next = upcoming[0]
  return (
    <Shell nav overlay={cancelId ? (
      <Sheet title="Cancel this booking?" onClose={() => setCancelId(null)}>
        <p className="help">You can have a full refund or a free flex exchange. Nothing is lost, and nobody is keeping score.</p>
        <Button variant="outline" onClick={() => setCancelId(null)}>Keep my session</Button>
        <Button variant="navy" onClick={() => { cancelBooking(cancelId); setCancelId(null) }}>Cancel booking</Button>
      </Sheet>
    ) : null}>
      <div className="stack-lg">
        <h1 className="h1">My Sessions</h1>
        {next && (
          <div className="navy-card">
            <div className="between">
              <div>
                <div className="kicker" style={{ color: 'var(--lime)' }}>{completed.length ? 'Next session' : 'First session back'}</div>
                <b>{relativeLabel(next.snapshot.startsAt)} · {next.snapshot.venue}</b>
              </div>
              <b>{new Date(next.snapshot.startsAt).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}</b>
            </div>
          </div>
        )}
        <div className="seg">
          <button className={tab === 'upcoming' ? 'on' : ''} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
          <button className={tab === 'completed' ? 'on' : ''} onClick={() => setTab('completed')}>Completed ({completed.length})</button>
        </div>
        <div className="card-grid dense-2">
          {list.map((booking) => {
            const invites = user.invitations.filter((invite) => invite.sessionId === booking.sessionId && invite.status !== 'declined')
            const buddy = invites[0] ? getPerson(invites[0].buddyId) : undefined
            const feedback = user.feedback.find((item) => item.bookingId === booking.id)
            const weather =
              booking.status === 'upcoming' && !loading
                ? assessWeather({
                    startsAt: booking.snapshot.startsAt,
                    setting: booking.snapshot.setting,
                    sport: booking.snapshot.sport,
                    forecast,
                    forecastError: error,
                  })
                : null
            return (
              <article key={booking.id} className="card pad stack">
                <div className="between">
                  <div className="cluster">
                    <span className="pill">{sportLabel(booking.snapshot.sport)}</span>
                    <span className="tag">{booking.snapshot.levelLabel}</span>
                    <span className="tag">{sessionSettingLabel(booking.snapshot.setting)}</span>
                  </div>
                  <span className="price-pill">{booking.snapshot.shortSession ? 'Free reset' : `${money(booking.snapshot.price)} paid`}</span>
                </div>
                <h2 className="h2" style={{ fontSize: 18 }}>{booking.snapshot.name}</h2>
                <p className="tiny">{whenRange(booking.snapshot.startsAt, booking.snapshot.endsAt)}</p>
                <p className="tiny">{booking.snapshot.place}</p>
                {buddy && <p className="tiny">Sport buddy: {buddy.name} · {invites[0].status === 'accepted' ? 'Accepted' : 'Pending accept'}</p>}
                {booking.flexNote && <p className="tiny">{booking.flexNote}</p>}
                {weather ? <BookingWeatherBlock sessionId={booking.sessionId} assessment={weather} /> : null}
                <div className="cluster">
                  {booking.sessionId !== 'short-reset' && <ButtonLink to={booking.status === 'upcoming' ? `/confirm/${booking.id}` : `/sessions/${booking.sessionId}`} size="sm" variant="outline">View Details</ButtonLink>}
                  {booking.status === 'upcoming' && <ButtonLink to={`/reschedule/${booking.id}`} size="sm" variant="navy">Reschedule</ButtonLink>}
                  {booking.status === 'upcoming' && <Button size="sm" variant="ghost" onClick={() => { completeBooking(booking.id); navigate(`/check-in/${booking.id}`) }}>I played this</Button>}
                  {booking.status === 'completed' && !feedback && <ButtonLink to={`/check-in/${booking.id}`} size="sm" variant="lime">Check in</ButtonLink>}
                  {feedback && <span className="tiny">Checked in · {feedback.feeling}</span>}
                </div>
                {booking.status === 'upcoming' && <button className="tiny" onClick={() => setCancelId(booking.id)}><b>Cancel booking</b> · full refund or free flex exchange</button>}
              </article>
            )
          })}
          {list.length === 0 && (
            <div className="empty card pad" style={{ gridColumn: '1 / -1' }}>
              <b>{tab === 'upcoming' ? 'Nothing booked yet.' : 'No finished sessions yet.'}</b>
              <p className="tiny">{tab === 'upcoming' ? 'Your next comeback is one easy booking away. Sessions under £5 are marked clearly.' : 'When you play, finished sessions land here. There is no streak to protect at all costs.'}</p>
              <ButtonLink to="/explore">Find a session</ButtonLink>
            </div>
          )}
        </div>
        <div className="notice"><b>Plans changed? No guilt.</b><p>University exams or a late shift? Use Flex to move your slot, or try a 15-minute version so the habit stays kind. Weather never cancels for you — you stay in control.</p></div>
      </div>
    </Shell>
  )
}
