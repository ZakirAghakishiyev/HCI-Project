import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, Check, MapPin, Share2 } from 'lucide-react'
import { getHost, getPerson, getSession, getVenue, sessionSettingLabel } from '../data/catalog'
import { money, sportLabel, whenRange } from '../lib/format'
import { assessSessionWeather } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'
import { WeatherAlternativeRecommendations, WeatherDetailsCard } from '../components/weather'
import { Avatar, Button, IconButton, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function SessionDetail() {
  const { id = '' } = useParams()
  const session = getSession(id)
  useTitle(session?.name ?? 'Session')
  const { user, book, toggleSave, notify } = useApp()
  const navigate = useNavigate()
  const { forecast, error, loading } = useWeather(user?.area)
  if (!user) return null
  if (!session) {
    return <Shell><div className="empty"><b>That session has closed.</b><Button onClick={() => navigate('/explore')}>Back to explore</Button></div></Shell>
  }
  const venue = getVenue(session.venueId)
  const host = getHost(session.hostId)
  const saved = user.savedSessionIds.includes(session.id)
  const existing = user.bookings.find((booking) => booking.sessionId === session.id && booking.status === 'upcoming')
  const faces = session.attendeeIds.map((personId) => getPerson(personId)).filter(Boolean)
  const weather = loading ? null : assessSessionWeather(session, forecast, error)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: session?.name, url })
      else { await navigator.clipboard.writeText(url); notify('Link copied.') }
    } catch { /* dismissed */ }
  }

  return (
    <Shell
      bleed
      footer={
        <div className="between">
          <div><div className="tiny">Total fee</div><b>{money(session.price)}</b></div>
          {existing ? <Button variant="navy" onClick={() => navigate(`/confirm/${existing.id}`)}>View booking</Button> : <Button variant="lime" onClick={() => { const bookingId = book(session.id); if (bookingId) navigate(`/confirm/${bookingId}`) }}>Book for {money(session.price)}</Button>}
        </div>
      }
    >
      <div className="hero">
        <img src={session.image} alt="" />
        <div className="shade" />
        <div className="hero-bar">
          <IconButton className="on-photo" label="Back" onClick={() => navigate(-1)}><span style={{ fontSize: 18 }}>←</span></IconButton>
          <div className="cluster">
            <IconButton className="on-photo" label="Share" onClick={share}><Share2 size={16} /></IconButton>
            <IconButton className="on-photo" label={saved ? 'Unsave session' : 'Save session'} onClick={() => toggleSave(session.id)}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></IconButton>
          </div>
        </div>
        <div className="hero-copy">
          <div className="cluster">
            <span className="pill ghost">Local Play Pass</span>
            <span className="pill ghost">{sessionSettingLabel(session.setting)}</span>
            <span className="pill ghost">{session.level === 'starting' ? 'Beginners & returning' : session.levelLabel}</span>
          </div>
        </div>
      </div>
      <div className="stack-lg" style={{ padding: 20 }}>
        <div className="stack">
          <h1 className="h1" style={{ fontSize: 28 }}>{session.name}</h1>
          <p>{sportLabel(session.sport)} · {venue.name} ({venue.area})</p>
          <div className="between">
            <span className="tiny">{session.distanceKm} km away · {session.walkMins} min walk from campus</span>
            <a href="#where" className="tiny"><b>Map</b></a>
          </div>
          <p><b>{whenRange(session.startsAt, session.endsAt)}</b></p>
        </div>
        {weather ? (
          <>
            <WeatherDetailsCard assessment={weather} startsAt={session.startsAt} />
            <WeatherAlternativeRecommendations session={session} forecast={forecast} assessment={weather} />
          </>
        ) : (
          <p className="tiny">Checking the local forecast…</p>
        )}
        <section className="breakdown">
          <div className="between"><b>Transparent price breakdown</b><span className="pill">No hidden fees</span></div>
          <div className="row"><span>{session.courtLabel}</span><span>{money(session.courtFee)}</span></div>
          <div className="row"><span>{session.equipmentLabel}</span><span>{session.equipmentFee > 0 ? money(session.equipmentFee) : session.equipmentIncluded ? 'Included' : 'Optional hire'}</span></div>
          <div className="sum"><span>Total price</span><b style={{ fontSize: 28 }}>{money(session.price)}</b></div>
        </section>
        <section className="notice"><p>{session.welcomeNote}</p></section>
        <section className="stack">
          <h2 className="section-label">Who is this for?</h2>
          {session.whoFor.map((item) => <div key={item} className="checkline"><Check size={16} /> {item}</div>)}
        </section>
        <section className="stack">
          <h2 className="section-label">What should I bring?</h2>
          <div className="cluster">
            {session.bring.map((item) => <span key={item.item} className={item.provided ? 'pill' : 'tag line'}>{item.item}</span>)}
          </div>
        </section>
        <section className="stack">
          <h2 className="section-label">Session atmosphere</h2>
          <div className="cluster">{session.atmosphere.map((item) => <span key={item} className="tag">{item}</span>)}</div>
        </section>
        <section className="between card pad">
          <div>
            <b>People attending</b>
            <p className="tiny">{session.players} returning players booked</p>
          </div>
          <div className="avatar-stack">
            {faces.slice(0, 3).map((person) => person && <Avatar key={person.id} src={person.avatar} name={person.name} size={32} />)}
            {session.players > 3 && <span className="more-count">+{session.players - 3}</span>}
          </div>
        </section>
        <Link to={`/sessions/${session.id}/prepare`} className="card pad between">
          <div>
            <b>Know before you go</b>
            <p className="tiny">Meet host {host.name} and the entrance route</p>
          </div>
          <span aria-hidden>›</span>
        </Link>
        <section id="where" className="stack">
          <h2 className="section-label">Where should I go?</h2>
          <div className="map-card"><MapPin className="pin" /><span>{venue.entranceName}</span></div>
          <p className="help">{venue.entrance}</p>
        </section>
      </div>
    </Shell>
  )
}
