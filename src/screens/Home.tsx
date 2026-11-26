import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Flag, Sparkles } from 'lucide-react'
import { Avatar, ButtonLink, SessionCard, Shell, SportIcon, useTitle } from '../components/ui'
import { HomeWeatherSection } from '../components/weather'
import { useApp } from '../store/store'
import { matchBuddies, recommendSessions } from '../lib/filter'
import { filterSessions } from '../lib/filter'
import { sessions } from '../data/catalog'
import { firstName, greeting, money, relativeLabel, sportLabel, whenShort } from '../lib/format'
import { journeyStage, upcomingOf } from '../lib/user'
import { assessSessionWeather } from '../lib/weather/assessment'
import { useWeather } from '../hooks/useWeather'

export function Home() {
  const { user, filters } = useApp()
  useTitle('Home')
  const { forecast, error, loading } = useWeather(user?.area)
  if (!user) return null
  const name = firstName(user.name)
  const sport = user.preferences.sports[0]
  const stage = journeyStage(user)
  const upcoming = upcomingOf(user)[0]
  const recommendation = recommendSessions(user, 1)[0]
  const recommendationWeather = recommendation && !loading ? assessSessionWeather(recommendation, forecast, error) : null
  const buddies = matchBuddies(user, { sport: sport ?? 'all', level: 'all', time: 'all' }).slice(0, 4)
  const affordable = filterSessions(sessions, { ...filters, sports: [], query: '', equipmentOnly: false, days: [], levels: [], distance: null, maxPrice: user.preferences.maxPrice })
  const nextLocked = user.achievements.find((item) => !item.unlocked)
  const latest = [...user.achievements].reverse().find((item) => item.unlocked)
  const unread = user.notifications.filter((item) => !item.read).length
  const hints: Record<number, string> = {
    1: `Pick any session under ${money(user.preferences.maxPrice)}. Rackets, hosts, and an easy welcome are included where it says so.`,
    2: 'Invite someone who is also coming back. You do not have to walk in alone.',
    3: upcoming ? `${relativeLabel(upcoming.snapshot.startsAt)} is yours. If the day moves, Flex can move it with you.` : 'Show up, enjoy it, and check in afterwards.',
  }
  return (
    <Shell nav>
      <div className="stack-lg">
        <header className="between">
          <div>
            <h1 className="h2">{greeting()}, {name}.</h1>
            <p className="tiny">Ready to get back in play?</p>
          </div>
          <div className="cluster">
            <Link to="/notifications" className="icon-btn icon-wrap" aria-label={unread ? `${unread} unread notifications` : 'Notifications'}>
              <Bell size={18} />
              {unread > 0 && <i className="bell-dot" />}
            </Link>
            <Link to="/profile" aria-label="Profile"><Avatar src={user.avatar} name={user.name} size={42} /></Link>
          </div>
        </header>

        <section className="navy-card">
          <div className="live-pill"><i /> Local Play Pass · Student Match</div>
          <h2 className="h2">Your comeback starts here.</h2>
          <p>
            {upcoming
              ? `Your next ${sportLabel(upcoming.snapshot.sport).toLowerCase()} session is ${whenShort(upcoming.snapshot.startsAt)} at ${upcoming.snapshot.venue}.`
              : `Your next ${sport ? sportLabel(sport).toLowerCase() : 'sport'} session is just around the corner. Beginner-friendly pace, with gear included where you need it.`}
          </p>
          <ButtonLink to="/explore" variant="lime">Find a Session <ArrowRight size={18} /></ButtonLink>
        </section>

        {upcoming && (
          <Link to={`/sessions/${upcoming.sessionId}`} className="banner-next">
            <div>
              <div className="tiny">Up next · {relativeLabel(upcoming.snapshot.startsAt)}</div>
              <b>{upcoming.snapshot.name}</b>
              <div className="tiny">{upcoming.snapshot.place}</div>
            </div>
            <span className="price-pill">{money(upcoming.snapshot.price)}</span>
          </Link>
        )}

        {upcoming && (
          <HomeWeatherSection
            sessionId={upcoming.sessionId}
            name={upcoming.snapshot.name}
            startsAt={upcoming.snapshot.startsAt}
            setting={upcoming.snapshot.setting}
            sport={upcoming.snapshot.sport}
            forecast={forecast}
            error={error}
            loading={loading}
          />
        )}

        <section className="stack">
          <div className="between">
            <h2 className="section-label">Your next step</h2>
            <span className="pill">Stage {stage} of 3</span>
          </div>
          <div className="steps">
            {['Find a session', 'Meet your buddy', 'Play again'].map((title, index) => {
              const n = index + 1
              const state = n < stage ? 'done' : n === stage ? 'now' : ''
              return <div key={title} className={`step ${state}`}><div className="num">{n}</div>{title}</div>
            })}
          </div>
          <p className="tiny">{hints[stage]}</p>
        </section>

        <section className="stack">
          <div className="between">
            <div>
              <h2 className="section-label">Recommended for you</h2>
              <p className="tiny">Under {money(user.preferences.maxPrice)} · within a short walk of campus</p>
            </div>
            <Link to="/explore"><b>See all ({affordable.length})</b></Link>
          </div>
          {recommendation ? <SessionCard session={recommendation} layout="home" weather={recommendationWeather} booked={user.bookings.some((booking) => booking.sessionId === recommendation.id && booking.status === 'upcoming')} /> : <div className="empty"><b>Nothing under your budget yet.</b><p className="tiny">Raise the max price in filters and friendly sessions will show up.</p></div>}
        </section>

        <section className="stack">
          <div className="between">
            <h2 className="section-label">People like you are playing</h2>
            <Link to="/buddies"><b>Find buddy</b></Link>
          </div>
          <div className="scroller">
            {buddies.map((person) => (
              <Link key={person.id} to={`/buddies/${person.id}`} className="person-card" style={{ minWidth: 250 }}>
                <div className="between">
                  <div className="cluster">
                    <Avatar src={person.avatar} name={person.name} size={44} />
                    <div>
                      <b>{person.name}, {person.age}</b>
                      <div className="tiny">{person.distanceKm} km away</div>
                    </div>
                  </div>
                  <SportIcon sport={person.sports[0]} />
                </div>
                <p className="tiny">{person.sportLabel} · {person.levelLabel}</p>
                {person.breakNote ? <div className="green-box"><b>{person.breakNote}</b><span className="tiny">{person.availability}</span></div> : <p className="tiny">{person.availability}</p>}
              </Link>
            ))}
            {buddies.length === 0 && <p className="tiny">Buddy matches appear once a sport is on your plan.</p>}
          </div>
        </section>

        <section className="tiles">
          <div className="tile">
            <Flag size={16} />
            <span className="tiny">Your weekly goal</span>
            <b>{user.weeklyGoal} session{user.weeklyGoal === 1 ? '' : 's'}</b>
            <span className="tiny">Achievable comeback step</span>
          </div>
          <Link to="/progress" className="tile">
            <Sparkles size={16} />
            <span className="tiny">Small wins</span>
            <b>{nextLocked?.title ?? latest?.title ?? 'First Game'}</b>
            <span className="tiny">{nextLocked ? 'Ready to unlock' : 'Unlocked'}</span>
          </Link>
        </section>
      </div>
    </Shell>
  )
}
