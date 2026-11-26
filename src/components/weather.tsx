import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, CloudRain, Home, Info, TriangleAlert } from 'lucide-react'
import type { Session, WeatherAssessment, WeatherForecast } from '../types'
import { getVenue, sessionSettingLabel } from '../data/catalog'
import { money, sportLabel, whenShort } from '../lib/format'
import { findWeatherAlternatives } from '../lib/weather/alternatives'
import { assessSessionWeather, needsAlternative } from '../lib/weather/assessment'
import { ButtonLink, cn } from './ui'

export function WeatherBadge({
  assessment,
  compact = false,
  overlay = false,
}: {
  assessment: WeatherAssessment
  compact?: boolean
  overlay?: boolean
}) {
  return (
    <span className={cn('weather-badge', `risk-${assessment.risk}`, compact && 'compact', overlay && 'overlay')} title={assessment.message}>
      <span aria-hidden="true">{assessment.setting === 'indoor' ? '✓' : assessment.badgeIcon}</span>
      <span>{assessment.badgeLabel}</span>
    </span>
  )
}

/** Screen 07 — clickable caution/status banner on session details */
export function WeatherDetailBanner({
  sessionId,
  assessment,
}: {
  sessionId: string
  assessment: WeatherAssessment
}) {
  const href = `/sessions/${sessionId}/forecast`
  if (assessment.setting === 'indoor') {
    return (
      <Link to={href} className={cn('weather-banner', 'risk-green')}>
        <span className="weather-banner-icon" aria-hidden="true"><Check size={18} /></span>
        <span className="weather-banner-copy">
          <b>Indoor session — weather unaffected</b>
          <small>Outside may change · View forecast details</small>
        </span>
        <span className="weather-banner-meta">
          <span className="weather-chip risk-green">Weather unaffected</span>
          <span aria-hidden>›</span>
        </span>
      </Link>
    )
  }

  if (assessment.risk === 'unknown') {
    return (
      <Link to={href} className={cn('weather-banner', 'risk-unknown')}>
        <span className="weather-banner-icon" aria-hidden="true">☁️</span>
        <span className="weather-banner-copy">
          <b>{assessment.badgeLabel}</b>
          <small>{assessment.message}</small>
        </span>
        <span aria-hidden>›</span>
      </Link>
    )
  }

  if (assessment.risk === 'green') {
    return (
      <Link to={href} className={cn('weather-banner', 'risk-green')}>
        <span className="weather-banner-icon" aria-hidden="true">{assessment.badgeIcon}</span>
        <span className="weather-banner-copy">
          <b>{assessment.summaryLine ?? `${assessment.temperatureC}°C · Weather suitable`}</b>
          <small>Conditions look good · View forecast</small>
        </span>
        <span className="weather-banner-meta">
          <span className="weather-chip risk-green">Weather suitable</span>
          <span aria-hidden>›</span>
        </span>
      </Link>
    )
  }

  const tone = assessment.risk === 'red' ? 'risk-red' : assessment.risk === 'orange' ? 'risk-orange' : 'risk-yellow'
  return (
    <Link to={href} className={cn('weather-banner', tone)}>
      <span className="weather-banner-icon" aria-hidden="true">
        {assessment.risk === 'red' ? <TriangleAlert size={18} /> : <CloudRain size={18} />}
      </span>
      <span className="weather-banner-copy">
        <b>{assessment.summaryLine ?? `${assessment.temperatureC}°C · Rain expected`}</b>
        <small>
          {assessment.rainProbability != null ? `${assessment.rainProbability}% chance of rain · ` : ''}
          View forecast & indoor options
        </small>
      </span>
      <span className="weather-banner-meta">
        <span className={cn('weather-chip', tone)}>{assessment.title}</span>
        <span aria-hidden>›</span>
      </span>
    </Link>
  )
}

/** Compact card-list weather cue + optional alternative link (Explore) */
export function ExploreWeatherCue({
  session,
  assessment,
  forecast,
}: {
  session: Session
  assessment: WeatherAssessment
  forecast: WeatherForecast | null
}) {
  const showAlt = needsAlternative(assessment)
  const alt = showAlt ? findWeatherAlternatives(session, forecast, { limit: 1 })[0] : null
  return (
    <div className="stack" style={{ gap: 6 }}>
      <WeatherBadge assessment={assessment} />
      {showAlt ? (
        <Link to={`/sessions/${session.id}/alternatives`} className="weather-alt-link">
          Indoor alternative nearby <ArrowRight size={14} />
        </Link>
      ) : null}
      {!showAlt && alt ? null : null}
    </div>
  )
}

/** Screen 12 — warning block inside My Sessions booking card */
export function BookingWeatherBlock({
  sessionId,
  assessment,
}: {
  sessionId: string
  assessment: WeatherAssessment
}) {
  if (assessment.setting === 'indoor') {
    return (
      <div className="weather-booking-block risk-green">
        <div className="between">
          <div className="cluster">
            <span className="weather-booking-icon" aria-hidden="true"><Check size={16} /></span>
            <span className="weather-chip risk-green">Weather unaffected</span>
          </div>
        </div>
        <p className="weather-copy">Indoor session — unaffected by outdoor rain.</p>
        <div className="weather-booking-actions">
          <ButtonLink to={`/sessions/${sessionId}/forecast`} size="sm" variant="outline">View Weather Details</ButtonLink>
        </div>
      </div>
    )
  }

  if (assessment.risk === 'green') {
    return (
      <div className="weather-booking-block risk-green">
        <div className="between">
          <div className="cluster">
            <span className="weather-booking-icon" aria-hidden="true">{assessment.badgeIcon}</span>
            <span className="weather-chip risk-green">Weather suitable</span>
          </div>
          {assessment.temperatureC != null ? <span className="tiny">{assessment.temperatureC}°C</span> : null}
        </div>
        <p className="weather-copy">Looking good! Conditions are suitable for your outdoor session.</p>
        <div className="weather-booking-actions">
          <ButtonLink to={`/sessions/${sessionId}/forecast`} size="sm" variant="outline">View Weather Details</ButtonLink>
        </div>
      </div>
    )
  }

  if (assessment.risk === 'unknown') {
    return (
      <div className="weather-booking-block risk-unknown">
        <div className="cluster">
          <span className="weather-chip risk-unknown">{assessment.badgeLabel}</span>
        </div>
        <p className="weather-copy">{assessment.message}</p>
        <div className="weather-booking-actions">
          <ButtonLink to={`/sessions/${sessionId}/forecast`} size="sm" variant="outline">View Weather Details</ButtonLink>
        </div>
      </div>
    )
  }

  const tone = assessment.risk === 'red' ? 'risk-red' : 'risk-orange'
  return (
    <div className={cn('weather-booking-block', tone)}>
      <div className="between">
        <div className="cluster">
          <span className="weather-booking-icon" aria-hidden="true">
            {assessment.risk === 'red' ? <TriangleAlert size={16} /> : <CloudRain size={16} />}
          </span>
          <span className={cn('weather-chip solid', tone)}>{assessment.title}</span>
        </div>
        <span className="tiny">
          {assessment.temperatureC != null ? `${assessment.temperatureC}°C` : ''}
          {assessment.rainProbability != null ? ` · ${assessment.rainProbability}% rain` : ''}
        </span>
      </div>
      <p className="weather-copy"><b>{assessment.message}</b></p>
      <div className="weather-booking-actions">
        <ButtonLink to={`/sessions/${sessionId}/forecast`} size="sm" variant="outline">View Weather Details</ButtonLink>
        <ButtonLink to={`/sessions/${sessionId}/alternatives`} size="sm" variant="lime">Find an Alternative</ButtonLink>
      </div>
    </div>
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
  const affected = needsAlternative(assessment)

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
          <div className="cluster">
            <ButtonLink to={`/sessions/${sessionId}/forecast`} size="sm" variant="outline">View Weather Details</ButtonLink>
            <ButtonLink to={`/sessions/${sessionId}/alternatives`} size="sm" variant="navy">Explore indoor alternatives</ButtonLink>
          </div>
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

export function ForecastMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="forecast-metric">
      <span className="forecast-metric-icon" aria-hidden="true">{icon}</span>
      <b>{value}</b>
      <span className="tiny">{label}</span>
    </div>
  )
}

export function WhyCautionBox({ assessment }: { assessment: WeatherAssessment }) {
  if (!assessment.impactReasons?.length) return null
  const heading =
    assessment.risk === 'red'
      ? 'Why this is a severe weather warning'
      : assessment.risk === 'orange'
        ? 'Why this session has a weather warning'
        : 'Why this session has a weather caution'
  return (
    <section className={cn('why-caution', assessment.risk === 'red' ? 'risk-red' : 'risk-orange')}>
      <div className="cluster">
        <Info size={16} />
        <b>{heading}</b>
      </div>
      <p className="weather-copy">
        {assessment.risk === 'red'
          ? 'Severe weather is expected during this outdoor session. Conditions may create a safety concern.'
          : 'Rain or wind is expected during this outdoor session. Conditions may affect the playing experience.'}
      </p>
      <ul className="why-list">
        {assessment.impactReasons.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export function IndoorAltPrompt({ session, forecast }: { session: Session; forecast: WeatherForecast | null }) {
  const alt = findWeatherAlternatives(session, forecast, { limit: 1 })[0]
  if (!alt) {
    return (
      <section className="indoor-alt-prompt">
        <Home size={18} />
        <div>
          <b>Prefer dry conditions?</b>
          <p className="tiny">No close indoor match right now. Check another date in Explore or Flex.</p>
        </div>
      </section>
    )
  }
  return (
    <section className="indoor-alt-prompt">
      <Home size={18} />
      <div>
        <b>Prefer dry conditions?</b>
        <p className="tiny">
          Indoor session — unaffected by outdoor weather. We found an indoor {sportLabel(alt.session.sport).toLowerCase()} match {alt.session.distanceKm} km away
          {Math.abs(alt.session.price - session.price) < 0.01 ? ' at the same price' : ''}.
        </p>
      </div>
    </section>
  )
}

export function AlternativeHeroCard({
  original,
  alternative,
}: {
  original: Session
  alternative: Session
}) {
  const venue = getVenue(alternative.venueId)
  return (
    <article className="alt-hero card">
      <div className="alt-hero-media">
        <img src={alternative.image} alt="" />
        <span className="weather-badge risk-green overlay">✓ Weather unaffected</span>
        <span className="price-pill alt-price">{money(alternative.price)} total</span>
        <span className="tag alt-court">Indoor Court</span>
      </div>
      <div className="pad stack" style={{ gap: 8 }}>
        <div className="cluster">
          <span className="pill">{alternative.levelLabel}</span>
          <span className="tiny">{alternative.distanceKm} km away</span>
        </div>
        <h2 className="h2" style={{ fontSize: 20 }}>{alternative.name}</h2>
        <p className="tiny">{whenShort(alternative.startsAt)} · {venue.name}</p>
        <div className="cluster">
          {alternative.equipmentIncluded ? <span className="tag">Equipment included</span> : null}
          {Math.abs(alternative.price - original.price) < 0.01 ? <span className="tag">Same {money(original.price)} price</span> : <span className="tag">{money(alternative.price)}</span>}
        </div>
      </div>
    </article>
  )
}

/** Kept for Confirmation / legacy embeds */
export function WeatherDetailsCard({
  assessment,
  startsAt,
}: {
  assessment: WeatherAssessment
  startsAt: string
  showAction?: boolean
}) {
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
      <p className="weather-copy">{assessment.action}</p>
    </section>
  )
}

export function WeatherAlternativeRecommendations({
  session,
  assessment,
}: {
  session: Session
  forecast?: WeatherForecast | null
  assessment: WeatherAssessment
}) {
  if (!needsAlternative(assessment)) return null
  return (
    <Link to={`/sessions/${session.id}/alternatives`} className="indoor-alt-prompt" style={{ textDecoration: 'none' }}>
      <Home size={18} />
      <div>
        <b>Prefer dry conditions?</b>
        <p className="tiny">See indoor alternatives nearby →</p>
      </div>
    </Link>
  )
}
