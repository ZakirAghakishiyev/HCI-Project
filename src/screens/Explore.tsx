import { Link, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { SportId } from '../types'
import { SPORT_ORDER } from '../data/options'
import { sessions } from '../data/catalog'
import { filterSessions } from '../lib/filter'
import { money, sportLabel } from '../lib/format'
import { assessSessionWeather } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'
import { SessionCard, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Explore() {
  useTitle('Explore')
  const { user, filters, setFilters } = useApp()
  const navigate = useNavigate()
  const { forecast, error, loading } = useWeather(user?.area)
  if (!user) return null
  const results = filterSessions(sessions, filters)
  const allGear = results.length > 0 && results.every((session) => session.equipmentIncluded)
  const active = [filters.equipmentOnly, filters.days.length > 0, filters.levels.length > 0, filters.distance != null, filters.maxPrice < user.preferences.maxPrice].filter(Boolean).length
  const flagged = results.filter((session) => {
    const assessment = assessSessionWeather(session, forecast, error)
    return session.setting !== 'indoor' && (assessment.risk === 'yellow' || assessment.risk === 'orange' || assessment.risk === 'red')
  }).length

  return (
    <Shell nav>
      <div className="stack-lg">
        <div className="seg" role="tablist">
          <button className="on" role="tab" aria-selected>Sessions</button>
          <button role="tab" onClick={() => navigate('/buddies')}>Buddies</button>
        </div>
        <div className="between">
          <button className="tiny" onClick={() => navigate('/filters')}><b style={{ color: 'var(--ink)' }}>Campus & {user.area.split(' ')[0]} · {user.preferences.maxDistance} km</b></button>
          <button className="pill" onClick={() => navigate('/filters')}>Max {money(filters.maxPrice)}</button>
        </div>
        <div className="stack">
          <h1 className="h1">Find your next game.</h1>
          <div className="searchbox">
            <Search size={18} />
            <input value={filters.query} onChange={(event) => setFilters({ query: event.target.value })} placeholder="Search badminton, a hall, a host" aria-label="Search sessions" />
            <button className="icon-btn plain icon-wrap" aria-label="Filters" onClick={() => navigate('/filters')}>
              <SlidersHorizontal size={18} />
              {active > 0 && <i className="bell-dot" />}
            </button>
          </div>
        </div>
        <div className="scroller" role="toolbar" aria-label="Sports">
          {SPORT_ORDER.map((sport) => {
            const on = filters.sports.length === 1 && filters.sports[0] === sport
            return <button key={sport} className={on ? 'chip navy' : 'chip'} aria-pressed={on} onClick={() => setFilters({ sports: on ? [] : [sport as SportId] })}>{sportLabel(sport)}</button>
          })}
          <button className={filters.sports.length === 0 ? 'chip navy' : 'chip'} aria-pressed={filters.sports.length === 0} onClick={() => setFilters({ sports: [] })}>All</button>
        </div>
        <div className="between">
          <p className="tiny" aria-live="polite">
            Showing {results.length} affordable {results.length === 1 ? 'session' : 'sessions'}
            {!loading && flagged > 0 ? ` · ${flagged} weather-aware` : ''}
          </p>
          <span className="weather-smart-active"><Sparkles size={13} /> Weather-Smart active</span>
        </div>
        {error ? <p className="tiny notice">Weather information cannot currently be retrieved. Outdoor sessions are still listed so you can decide for yourself.</p> : null}
        <div className="between">
          <button className={filters.equipmentOnly ? 'chip on' : 'chip'} aria-pressed={filters.equipmentOnly} onClick={() => setFilters({ equipmentOnly: !filters.equipmentOnly })}>{allGear && !filters.equipmentOnly ? 'All equipment included' : 'Equipment included'}</button>
          <label className="tiny cluster">
            Sort
            <select className="select" value={filters.sort} aria-label="Sort sessions" onChange={(event) => setFilters({ sort: event.target.value as typeof filters.sort })}>
              <option value="recommended">Recommended</option>
              <option value="soonest">Soonest</option>
              <option value="price">Lowest price</option>
              <option value="distance">Nearest</option>
            </select>
          </label>
        </div>
        <div className="card-grid">
          {results.map((session) => {
            const weather = loading ? null : assessSessionWeather(session, forecast, error)
            return (
              <SessionCard
                key={session.id}
                session={session}
                weather={weather}
                forecast={forecast}
                booked={user.bookings.some((booking) => booking.sessionId === session.id && booking.status === 'upcoming')}
              />
            )
          })}
          {results.length === 0 && (
            <div className="empty card pad" style={{ gridColumn: '1 / -1' }}>
              <b>No sessions fit these filters yet.</b>
              <p className="tiny">Try a wider distance or a slightly higher budget. There are friendly games just outside it.</p>
              <button className="btn btn-navy" onClick={() => setFilters({ sports: [], query: '', equipmentOnly: false, days: [], levels: [], distance: null, maxPrice: Math.max(user.preferences.maxPrice, 8) })}>Widen the search</button>
            </div>
          )}
        </div>
        <Link to="/buddies" className="notice">You don’t have to book alone. Find a sports buddy who is also coming back.</Link>
      </div>
    </Shell>
  )
}
