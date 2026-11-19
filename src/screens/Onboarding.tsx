import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Clock, Sparkles, Users, Wallet } from 'lucide-react'
import type { BarrierId, SkillLevel, SportId, TimePref } from '../types'
import { BARRIERS, LEVELS, SPORT_META, SPORT_ORDER, TIMES, barrierHelp, barrierProfileLabel } from '../data/options'
import { sessions } from '../data/catalog'
import { matchedSessions } from '../lib/filter'
import { firstName, formatTimes, money, sportLabel } from '../lib/format'
import { Button, Shell, TopBar, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Onboarding() {
  const { step = 'sports' } = useParams()
  const [params] = useSearchParams()
  const edit = params.get('edit') === '1'
  const { user, savePrefs, completeOnboarding, notify } = useApp()
  const navigate = useNavigate()
  const index = step === 'plan' ? 3 : step === 'preferences' ? 2 : 1
  useTitle(index === 1 ? 'Choose your sport' : index === 2 ? 'Comeback preferences' : 'Your plan')
  const [sports, setSports] = useState<SportId[]>(user?.preferences.sports ?? [])
  const [barriers, setBarriers] = useState<BarrierId[]>(user?.preferences.barriers ?? [])
  const [note, setNote] = useState(user?.preferences.barrierNote ?? '')
  const [level, setLevel] = useState<SkillLevel>(user?.preferences.level ?? 'recreational')
  const [times, setTimes] = useState<TimePref[]>(user?.preferences.times ?? [])
  const [error, setError] = useState('')
  if (!user) return null
  const query = edit ? '?edit=1' : ''
  const prefs = { ...user.preferences, sports, barriers, barrierNote: note, level, times }
  const matches = matchedSessions(prefs)
  const near = sessions.filter((session) => sports.includes(session.sport))

  function toggle<T extends string>(list: T[], id: T, set: (next: T[]) => void) {
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id])
    setError('')
  }

  function back() {
    if (index === 1) navigate(edit ? '/profile' : '/')
    else navigate(index === 2 ? `/onboarding/sports${query}` : `/onboarding/preferences${query}`)
  }

  function next() {
    if (index === 1) {
      if (!sports.length) return setError('Choose at least one sport you would love to play again.')
      savePrefs({ sports }, 2)
      navigate(`/onboarding/preferences${query}`)
    } else if (index === 2) {
      if (!barriers.length) return setError('Tell us one reason you stopped. It shapes the plan.')
      if (!times.length) return setError('Pick at least one time that actually fits your week.')
      savePrefs({ sports, barriers, barrierNote: note, level, times }, 3)
      navigate(`/onboarding/plan${query}`)
    } else {
      const goal = user?.preferences.goal || `Play 1 ${level === 'starting' ? 'easy' : 'recreational'} ${sportLabel(sports[0] ?? 'badminton').toLowerCase()} session each week, without guilt or competitive stress.`
      completeOnboarding({ sports, barriers, barrierNote: note, level, times, goal })
      notify(edit ? 'Comeback plan updated.' : 'Your comeback plan is ready.')
      navigate(edit ? '/profile' : '/home')
    }
  }

  const label = index === 3 ? (edit ? 'Save my plan' : 'Create My Comeback Plan') : 'Continue'

  return (
    <Shell
      footer={
        <div className="stack">
          {index === 1 && <div className="between tiny"><span>Selected: <b style={{ color: 'var(--ink)' }}>{sports.length ? sports.map(sportLabel).join(', ') : 'None yet'}</b></span><span>{near.length} sessions near you</span></div>}
          {error ? <p className="err" role="alert">{error}</p> : null}
          <Button block variant={index === 3 ? 'navy' : 'navy'} onClick={next}>{label} {index === 3 ? <Sparkles size={16} /> : <ArrowRight size={16} />}</Button>
        </div>
      }
    >
      <TopBar back={back} step={index} />
      {index === 1 && (
        <div className="stack-lg">
          <div className="stack">
            <h1 className="h1">What would you love to play again?</h1>
            <p className="muted">Select one or more sports you used to enjoy. We’ll find friendly returning groups nearby.</p>
          </div>
          <div className="sport-grid">
            {SPORT_ORDER.map((sport) => {
              const on = sports.includes(sport)
              const primary = sports[0] === sport
              return (
                <button key={sport} className={on ? 'sport-card on' : 'sport-card'} aria-pressed={on} onClick={() => toggle(sports, sport, setSports)}>
                  {on && <span className="tick"><Check size={14} /></span>}
                  <img src={SPORT_META[sport].image} alt="" />
                  <b>{SPORT_META[sport].label}</b>
                  <span className="tiny">{primary ? `${firstName(user.name)}’s sport` : SPORT_META[sport].blurb}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {index === 2 && (
        <div className="stack-lg">
          <div className="stack">
            <h1 className="h1">Let’s make returning easier.</h1>
            <p className="muted">We tailor your matches, buddy invites, and budget recommendations around your real barriers.</p>
          </div>
          <section className="stack">
            <h2 className="section-label">1. Why did you stop playing?</h2>
            <div className="cluster">
              {BARRIERS.map((item) => (
                <button key={item.id} className={barriers.includes(item.id) ? 'chip on' : 'chip'} aria-pressed={barriers.includes(item.id)} onClick={() => toggle(barriers, item.id, setBarriers)}>
                  {item.id === 'busy' ? <Clock size={14} /> : item.id === 'partner' ? <Users size={14} /> : item.id === 'expensive' ? <Wallet size={14} /> : null}
                  {item.label}
                </button>
              ))}
            </div>
            {barriers.includes('other') && (
              <label className="field">
                <span>Only if you want to</span>
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="A sentence is enough" />
              </label>
            )}
          </section>
          <section className="stack">
            <h2 className="section-label">2. How would you describe your current level?</h2>
            <div className="choice-grid">
              {LEVELS.map((item) => (
                <button key={item.id} className={level === item.id ? 'choice on' : 'choice'} aria-pressed={level === item.id} onClick={() => setLevel(item.id)}>
                  <b>{item.title}</b>
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="stack">
            <h2 className="section-label">3. When would you prefer to play?</h2>
            <div className="choice-grid">
              {TIMES.map((item) => (
                <button key={item.id} className={times.includes(item.id) ? 'choice on' : 'choice'} aria-pressed={times.includes(item.id)} onClick={() => toggle(times, item.id, setTimes)}>
                  <b>{item.title}</b>
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
          </section>
          <div className="match-banner"><Sparkles size={18} /> Matched with {matches.length} low-cost {matches.length === 1 ? 'session' : 'sessions'} under {money(prefs.maxPrice)} near campus.</div>
        </div>
      )}
      {index === 3 && (
        <div className="stack-lg">
          <div className="stack">
            <p className="kicker">Step 3 · Your plan</p>
            <h1 className="h1">{firstName(user.name)}, your comeback is ready.</h1>
            <p className="muted">This is a gentle plan, not a contract. You can change every part of it later.</p>
          </div>
          <div className="card pad stack">
            <div className="between"><span className="tiny">Sports</span><b>{sports.map(sportLabel).join(', ') || 'Choose a sport'}</b></div>
            <div className="between"><span className="tiny">Level</span><b>{LEVELS.find((item) => item.id === level)?.title}</b></div>
            <div className="between"><span className="tiny">Times</span><b>{formatTimes(times)}</b></div>
            <div className="between"><span className="tiny">Budget</span><b>Up to {money(user.preferences.maxPrice)}</b></div>
          </div>
          <div className="stack">
            {barriers.map((id) => (
              <article key={id} className="card pad stack">
                <b>{barrierProfileLabel(id, user.role, user.preferences.maxPrice)}</b>
                <p className="help">{barrierHelp(id)}</p>
              </article>
            ))}
          </div>
          <div className="match-banner"><Sparkles size={18} /> Matched with {matches.length} low-cost {matches.length === 1 ? 'session' : 'sessions'} under {money(prefs.maxPrice)} near campus.</div>
        </div>
      )}
    </Shell>
  )
}
