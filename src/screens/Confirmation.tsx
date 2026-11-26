import { useParams } from 'react-router-dom'
import { Check, MapPin } from 'lucide-react'
import { getHost, getSession } from '../data/catalog'
import { money, whenRange } from '../lib/format'
import { assessWeather } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'
import { WeatherAlternativeRecommendations, WeatherDetailsCard } from '../components/weather'
import { Avatar, ButtonLink, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Confirmation() {
  const { bookingId = '' } = useParams()
  const { user } = useApp()
  const { forecast, error, loading } = useWeather(user?.area)
  const booking = user?.bookings.find((item) => item.id === bookingId)
  useTitle('You’re back in play')
  if (!user || !booking) return <Shell><div className="empty"><b>We couldn’t find that booking.</b><ButtonLink to="/my-sessions">View my sessions</ButtonLink></div></Shell>
  const host = getHost(booking.snapshot.hostId)
  const session = getSession(booking.sessionId)
  const weather = !loading
    ? assessWeather({
        startsAt: booking.snapshot.startsAt,
        setting: booking.snapshot.setting,
        sport: booking.snapshot.sport,
        forecast,
        forecastError: error,
      })
    : null
  const invite = user.invitations.find((item) => item.sessionId === booking.sessionId && (item.status === 'pending' || item.status === 'accepted'))
  const buddy = invite ? user && invite.buddyId : undefined
  void buddy
  const buddyName = invite ? (invite.buddyId.charAt(0).toUpperCase() + invite.buddyId.slice(1)) : ''
  return (
    <Shell footer={<div className="stack"><ButtonLink to="/my-sessions" variant="navy" block>View My Sessions</ButtonLink><ButtonLink to="/explore" variant="ghost" block>Explore More Sessions</ButtonLink></div>}>
      <div className="stack-lg" style={{ paddingTop: 28 }}>
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className="brand-mark" style={{ width: 72, height: 72 }}><Check size={32} /></span>
          <span className="kicker">Local Play Pass activated</span>
          <h1 className="h1">You’re back in play!</h1>
          <p className="muted">Booking confirmed. {booking.snapshot.equipmentIncluded ? 'Your equipment and spot are locked in.' : 'Your spot is locked in.'}</p>
        </div>
        <article className="card pad stack">
          <div className="between"><div><div className="tiny">Session</div><h2 className="h2" style={{ fontSize: 20 }}>{booking.snapshot.name}</h2></div><span className="price-pill">{money(booking.snapshot.price)} paid</span></div>
          <p>{whenRange(booking.snapshot.startsAt, booking.snapshot.endsAt)}</p>
          <p className="tiny"><MapPin size={14} /> {booking.snapshot.place} · {booking.snapshot.distanceKm} km away</p>
          <p className="tiny">{booking.snapshot.equipmentNote}</p>
          {booking.flexNote && <p className="notice">{booking.flexNote}</p>}
        </article>
        {weather ? <WeatherDetailsCard assessment={weather} startsAt={booking.snapshot.startsAt} /> : null}
        {weather && session ? <WeatherAlternativeRecommendations session={session} forecast={forecast} assessment={weather} /> : null}
        <article className="card pad cluster">
          <Avatar src={host.avatar} name={host.name} size={48} />
          <div><b>Host {host.name}</b><p className="tiny">{host.name} will be there to welcome you. Look for the Back in Play check-in clipboard.</p></div>
        </article>
        {invite && (
          <article className="navy-card">
            <b>Sport buddy invitation {invite.status === 'accepted' ? 'accepted' : 'sent'}</b>
            <p>{buddyName} · {invite.status === 'accepted' ? 'They’ll meet you there.' : 'Pending reply. If plans change, Flex lets you reschedule for free.'}</p>
          </article>
        )}
      </div>
    </Shell>
  )
}
