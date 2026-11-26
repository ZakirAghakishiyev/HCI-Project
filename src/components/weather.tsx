import { Link } from 'react-router-dom'
import type { Session, WeatherAssessment, WeatherForecast } from '../types'
import { sessionSettingLabel } from '../data/catalog'
import { clock, money, sportLabel, whenShort } from '../lib/format'
import { alternativeHeadline, findWeatherAlternatives, type WeatherAlternative } from '../lib/weather/alternatives'
import { assessSessionWeather } from '../lib/weather/assessment'
import { ButtonLink, cn } from './ui'

export function WeatherBadge({
  assessment,
  compact = false,
}: {
  assessment: WeatherAssessment
  compact?: boolean
}) {
  return (
    <span className={cn('weather-badge', `risk-${assessment.risk}`, compact && 'compact')} title={assessment.message}>
      <span aria-hidden="true">{assessment.badgeIcon}</span>
      <span>{assessment.badgeLabel}</span>
    </span>
  )
}

export function WeatherDetailsCard({
  assessment,
  startsAt,
  showAction = true,
}: {
  assessment: WeatherAssessment
  startsAt: string
  showAction?: boolean
}) {
  const start = new Date(startsAt)
  return (
    <section className={cn('weather-card', `risk-${assessment.risk}`)}>
      <div className="between">
        <div className="cluster">
          <span className="weather-icon" aria-hidden="true">{assessment.badgeIcon}</span>
          <div>
            <div className="tiny">{whenShort(startsAt)}</div>
            <b>{assessment.setting === 'indoor' ? 'Indoor session' : assessment.description ?? assessment.title}</b>
          </div>
        </div>
        <WeatherBadge assessment={assessment} compact />
      </div>
      {assessment.forecastAvailable && assessment.setting !== 'indoor' ? (
        <p className="tiny">
          {assessment.temperatureC != null ? `${assessment.temperatureC}°C` : '—'}
          {assessment.rainProbability != null ? ` · ${assessment.rainProbability}% chance of rain` : ''}
          {assessment.windSpeedKmh != null ? ` · ${assessment.windSpeedKmh} km/h wind` : ''}
        </p>
      ) : null}
      {assessment.forecastAvailable && assessment.setting === 'indoor' && assessment.temperatureC != null ? (
        <p className="tiny">Outside around {clock(start)}: {assessment.temperatureC}°C · {assessment.description}</p>
      ) : null}
      {showAction ? <p className="weather-copy">{assessment.action}</p> : null}
      {!assessment.forecastAvailable ? <p className="weather-copy">{assessment.message}</p> : null}
    </section>
  )
}

export function WeatherAlternativeRecommendations({
  session,
  forecast,
  assessment,
}: {
  session: Session
  forecast: WeatherForecast | null
  assessment: WeatherAssessment
}) {
  if (assessment.risk !== 'orange' && assessment.risk !== 'red') return null
  const alts = findWeatherAlternatives(session, forecast, { limit: 2 })
  if (alts.length === 0) {
    return (
      <section className="weather-alts card pad stack">
        <b>No close indoor alternative right now</b>
        <p className="tiny">We could not find a matching indoor session at a similar time and price. Try another date in Explore, or use Flex if you are already booked.</p>
        <ButtonLink to="/explore" size="sm" variant="navy">Browse other dates</ButtonLink>
      </section>
    )
  }
  return (
    <section className="weather-alts card pad stack">
      <div>
        <div className="kicker">Smart alternative</div>
        <h2 className="h2" style={{ fontSize: 18 }}>{alternativeHeadline(sportLabel(session.sport))}</h2>
        <p className="tiny">Same sport, similar time, indoor venue.</p>
      </div>
      {alts.map((alt) => (
        <AlternativeRow key={alt.session.id} alt={alt} />
      ))}
    </section>
  )
}

function AlternativeRow({ alt }: { alt: WeatherAlternative }) {
  const session = alt.session
  return (
    <article className="alt-row">
      <div className="stack" style={{ gap: 4 }}>
        <b>{session.name}</b>
        <p className="tiny">{whenShort(session.startsAt)} · {session.distanceKm} km away · {money(session.price)}</p>
        <p className="tiny">{alt.reasons.slice(0, 3).join(' · ')}</p>
      </div>
      <ButtonLink to={`/sessions/${session.id}`} size="sm" variant="lime">View Alternative Session</ButtonLink>
    </article>
  )
}

export function HomeWeatherSection({
  sessionId,
  name,
  startsAt,
  setting,
  sport,
  forecast,
  error,
  loading,
}: {
  sessionId: string
  name: string
  startsAt: string
  setting: Session['setting']
  sport: Session['sport']
  forecast: WeatherForecast | null
  error: boolean
  loading: boolean
}) {
  const assessment = assessSessionWeather({ startsAt, endsAt: startsAt, setting, sport }, forecast, error)
  const affected = setting !== 'indoor' && (assessment.risk === 'yellow' || assessment.risk === 'orange' || assessment.risk === 'red')

  return (
    <section className="weather-home card pad stack">
      <div className="between">
        <div>
          <div className="kicker">Weather-smart</div>
          <h2 className="section-label">Weather for your next session</h2>
        </div>
        {!loading && <WeatherBadge assessment={assessment} compact />}
      </div>
      <div>
        <b>{name}</b>
        <p className="tiny">{whenShort(startsAt)} · {sessionSettingLabel(setting)}</p>
      </div>
      {loading ? (
        <p className="tiny">Checking the forecast…</p>
      ) : affected ? (
        <>
          <p className="weather-copy">{assessment.message}</p>
          <Link to={`/sessions/${sessionId}`} className="btn btn-navy btn-sm" style={{ width: 'fit-content' }}>
            Explore indoor alternatives
          </Link>
        </>
      ) : setting === 'indoor' ? (
        <p className="weather-copy">Indoor session — unaffected by outdoor rain.</p>
      ) : assessment.risk === 'unknown' ? (
        <p className="weather-copy">{assessment.message}</p>
      ) : (
        <p className="weather-copy">Looking good! Conditions are suitable for your outdoor session.</p>
      )}
    </section>
  )
}

export function BookingWeatherActions({
  sessionId,
  assessment,
}: {
  sessionId: string
  assessment: WeatherAssessment
}) {
  if (assessment.setting === 'indoor' && assessment.forecastAvailable) return null
  const showAlt = assessment.risk === 'orange' || assessment.risk === 'red'
  return (
    <div className="cluster">
      <ButtonLink to={`/sessions/${sessionId}`} size="sm" variant="outline">View Weather Details</ButtonLink>
      {showAlt ? <ButtonLink to={`/sessions/${sessionId}`} size="sm" variant="navy">Find an Alternative</ButtonLink> : null}
    </div>
  )
}
