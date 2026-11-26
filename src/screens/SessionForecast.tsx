import { useNavigate, useParams } from 'react-router-dom'
import { CloudRain, Droplets, Thermometer, TriangleAlert, Wind } from 'lucide-react'
import { getSession, getVenue, sessionSettingLabel } from '../data/catalog'
import { whenShort } from '../lib/format'
import { assessSessionWeather, needsAlternative } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'
import { ForecastMetric, IndoorAltPrompt, WeatherBadge, WhyCautionBox } from '../components/weather'
import { Button, ButtonLink, Shell, TopBar, useTitle } from '../components/ui'
import { useApp } from '../store/store'
import { cn } from '../components/ui'

export function SessionForecast() {
  const { id = '' } = useParams()
  const session = getSession(id)
  useTitle(session ? `${session.name} forecast` : 'Session Forecast')
  const { user } = useApp()
  const navigate = useNavigate()
  const { forecast, error, loading } = useWeather(user?.area)

  if (!user) return null
  if (!session) {
    return (
      <Shell>
        <TopBar back={() => navigate(-1)} title="Session Forecast" />
        <div className="empty"><b>That session has closed.</b><Button onClick={() => navigate('/explore')}>Back to explore</Button></div>
      </Shell>
    )
  }

  const venue = getVenue(session.venueId)
  const assessment = loading ? null : assessSessionWeather(session, forecast, error)
  const showAlt = assessment ? needsAlternative(assessment) : false
  const severe = assessment?.risk === 'red'

  return (
    <Shell
      footer={
        assessment && showAlt ? (
          <div className="between" style={{ gap: 10 }}>
            <button type="button" className="tiny" onClick={() => navigate(`/sessions/${session.id}`)}><b>Keep Outdoor</b></button>
            <ButtonLink to={`/sessions/${session.id}/alternatives`} variant="lime">Find Indoor Alternative →</ButtonLink>
          </div>
        ) : assessment?.risk === 'red' ? (
          <div className="stack" style={{ gap: 8 }}>
            <ButtonLink to={`/sessions/${session.id}/alternatives`} variant="lime" block>Find an Indoor Alternative</ButtonLink>
            <ButtonLink to="/my-sessions" variant="ghost" block>View My Sessions</ButtonLink>
          </div>
        ) : (
          <Button variant="navy" block onClick={() => navigate(`/sessions/${session.id}`)}>Back to session</Button>
        )
      }
    >
      <TopBar back={() => navigate(-1)} title="Session Forecast" />
      <div className="stack-lg">
        {severe ? (
          <span className="weather-chip solid risk-red"><TriangleAlert size={14} /> Severe Weather Warning</span>
        ) : (
          <div className="kicker" style={{ color: 'var(--navy)' }}>Weather-smart</div>
        )}

        {!severe && (
          <>
            <div>
              <h1 className="h1" style={{ fontSize: 28 }}>Session Forecast</h1>
              <div className="between" style={{ marginTop: 8 }}>
                <div>
                  <b>{session.name}</b>
                  <p className="tiny">{venue.name} · {session.distanceKm} km away</p>
                </div>
                <span className="tag">{sessionSettingLabel(session.setting)} Court</span>
              </div>
            </div>
          </>
        )}

        {loading || !assessment ? (
          <p className="tiny">Checking the local forecast…</p>
        ) : severe ? (
          <section className="severe-card">
            <div className="between">
              <span className="weather-chip solid risk-red">Safety Alert · {assessment.temperatureC ?? '—'}°C</span>
              <span className="severe-icon" aria-hidden="true">⛈️</span>
            </div>
            <h1 className="h1" style={{ fontSize: 28, color: 'var(--weather-red)' }}>Severe weather expected</h1>
            <p className="weather-copy">{assessment.message}</p>
            <div className="severe-session">
              <b>{session.name}</b>
              <p className="tiny">{whenShort(session.startsAt)} · {venue.name}</p>
              <div className="cluster">
                {(assessment.impactReasons ?? ['Lightning risk', 'Heavy rain']).map((item) => (
                  <span key={item} className="tag line">{item}</span>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className={cn('forecast-navy', `risk-${assessment.risk}`)}>
            <p className="tiny" style={{ color: 'rgba(255,255,255,.72)' }}>Forecast for session time</p>
            <div className="between">
              <b style={{ fontSize: 18 }}>{whenShort(session.startsAt)}</b>
              <WeatherBadge assessment={assessment} compact />
            </div>
            <div className="forecast-main">
              <span className="forecast-big-icon" aria-hidden="true">
                {assessment.setting === 'indoor' ? '🏠' : assessment.risk === 'green' ? assessment.badgeIcon : <CloudRain size={28} />}
              </span>
              <div>
                <b style={{ fontSize: 22 }}>
                  {assessment.temperatureC != null ? `${assessment.temperatureC}°C` : '—'}{' '}
                  {assessment.setting === 'indoor' ? 'Indoor' : assessment.badgeLabel}
                </b>
                <p className="tiny" style={{ color: 'rgba(255,255,255,.78)' }}>
                  {assessment.windowNote ?? assessment.description}
                </p>
              </div>
            </div>
            <div className="forecast-metrics">
              <ForecastMetric
                icon={<Droplets size={16} />}
                value={assessment.rainProbability != null ? `${assessment.rainProbability}%` : '—'}
                label="Rain probability"
              />
              <ForecastMetric
                icon={<Wind size={16} />}
                value={assessment.windSpeedKmh != null ? `${assessment.windSpeedKmh} km/h` : '—'}
                label="Wind speed"
              />
              <ForecastMetric
                icon={<Thermometer size={16} />}
                value={assessment.suitabilityLabel ?? '—'}
                label="Suitability"
              />
            </div>
          </section>
        )}

        {assessment && !severe ? <WhyCautionBox assessment={assessment} /> : null}

        {assessment && severe ? (
          <section className="navy-card">
            <div className="cluster"><span aria-hidden>🏠</span><b>Don't let the storm pause your comeback</b></div>
            <p>Indoor sessions nearby are completely unaffected and may still have open spots tonight.</p>
          </section>
        ) : null}

        {assessment && showAlt && !severe ? <IndoorAltPrompt session={session} forecast={forecast} /> : null}
      </div>
    </Shell>
  )
}
