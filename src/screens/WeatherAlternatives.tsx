import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { getSession } from '../data/catalog'
import { whenShort } from '../lib/format'
import { alternativeHeadline, findWeatherAlternatives } from '../lib/weather/alternatives'
import { assessSessionWeather } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'
import { AlternativeHeroCard } from '../components/weather'
import { Button, ButtonLink, Shell, TopBar, useTitle } from '../components/ui'
import { useApp } from '../store/store'
import { sportLabel } from '../lib/format'

export function WeatherAlternatives() {
  const { id = '' } = useParams()
  const session = getSession(id)
  useTitle('Weather-Smart Match')
  const { user } = useApp()
  const navigate = useNavigate()
  const { forecast, error, loading } = useWeather(user?.area)

  if (!user) return null
  if (!session) {
    return (
      <Shell>
        <TopBar back={() => navigate(-1)} title="Alternatives" />
        <div className="empty"><b>That session has closed.</b><Button onClick={() => navigate('/explore')}>Back to explore</Button></div>
      </Shell>
    )
  }

  const assessment = loading ? null : assessSessionWeather(session, forecast, error)
  const alts = findWeatherAlternatives(session, forecast, { limit: 1 })
  const top = alts[0]

  return (
    <Shell
      footer={
        top ? (
          <div className="stack" style={{ gap: 8 }}>
            <ButtonLink to={`/sessions/${top.session.id}`} variant="lime" block>View Alternative Session</ButtonLink>
            <Button variant="ghost" block onClick={() => navigate(`/sessions/${session.id}`)}>Keep My Original Session</Button>
          </div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            <ButtonLink to="/explore" variant="lime" block>Browse other dates</ButtonLink>
            <Button variant="ghost" block onClick={() => navigate(`/sessions/${session.id}`)}>Keep My Original Session</Button>
          </div>
        )
      }
    >
      <TopBar back={() => navigate(-1)} title="Alternatives" />
      <div className="stack-lg">
        <span className="weather-smart-match"><Sparkles size={14} /> Weather-Smart Match</span>
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="h1" style={{ fontSize: 30 }}>{alternativeHeadline(sportLabel(session.sport))}</h1>
          <p className="muted">
            {assessment && (assessment.risk === 'orange' || assessment.risk === 'yellow' || assessment.risk === 'red')
              ? 'Rain or poor weather is expected during your selected session. We found an indoor alternative nearby.'
              : 'Here is a nearby indoor option that is unaffected by outdoor weather.'}
          </p>
        </div>

        <div className="original-weather-row">
          <div>
            <div className="tiny">Original</div>
            <b>{session.name}</b>
            <p className="tiny">{whenShort(session.startsAt)}</p>
          </div>
          {assessment ? (
            <span className={`weather-chip solid risk-${assessment.risk === 'green' ? 'orange' : assessment.risk}`}>
              {assessment.rainProbability != null ? `${assessment.rainProbability}% rain` : assessment.badgeLabel}
            </span>
          ) : null}
        </div>

        {loading ? (
          <p className="tiny">Finding indoor alternatives…</p>
        ) : top ? (
          <AlternativeHeroCard original={session} alternative={top.session} />
        ) : (
          <div className="empty card pad">
            <b>No close indoor alternative right now</b>
            <p className="tiny">We could not find a matching indoor session at a similar time and price. Try another date in Explore, or use Flex if you are already booked.</p>
          </div>
        )}

        <p className="help" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span aria-hidden>↻</span>
          <span>Switching is completely free and optional. If no indoor slot fits today, you can always check another date with Flex.</span>
        </p>
      </div>
    </Shell>
  )
}
