import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { DayBucket, FilterState, SkillLevel, SportId } from '../types'
import { DAYS, DISTANCES, LEVELS, SPORT_ORDER, levelFilterLabel } from '../data/options'
import { sessions } from '../data/catalog'
import { filterSessions, filtersFromPrefs } from '../lib/filter'
import { firstName, money, sportLabel } from '../lib/format'
import { Button, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Filters() {
  useTitle('Filters')
  const { user, filters, setFilters, persistBudget } = useApp()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<FilterState>(filters)
  if (!user) return null
  const count = filterSessions(sessions, draft).length
  const patch = (partial: Partial<FilterState>) => setDraft((current) => ({ ...current, ...partial }))
  function toggle<T extends string>(list: T[], id: T, key: 'sports' | 'days' | 'levels') {
    const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
    patch({ [key]: next } as Partial<FilterState>)
  }

  return (
    <Shell
      footer={
        <div className="between">
          <button className="btn btn-ghost" onClick={() => setDraft({ ...filtersFromPrefs(user.preferences), sports: user.preferences.sports.slice(0, 1) })}>Reset filters</button>
          <Button variant="lime" onClick={() => { setFilters(draft); persistBudget(draft.maxPrice, draft.distance ?? 5); navigate('/explore') }}>
            Show {count} {count === 1 ? 'Result' : 'Results'} ({draft.maxPrice === 0 ? 'Free' : money(draft.maxPrice)} max)
          </Button>
        </div>
      }
    >
      <div className="between">
        <div>
          <h1 className="h2">Filter Sessions</h1>
          <p className="tiny">Match your budget and the week you actually have.</p>
        </div>
        <button className="icon-btn" aria-label="Close filters" onClick={() => navigate(-1)}><X size={18} /></button>
      </div>
      <div className="stack-lg" style={{ marginTop: 16 }}>
        <section className="stack">
          <div className="between"><b>Maximum price</b><span className="price-pill">{money(draft.maxPrice)}</span></div>
          <input className="range" type="range" min={0} max={20} step={0.5} value={draft.maxPrice} aria-label="Maximum price" onChange={(event) => patch({ maxPrice: Number(event.target.value) })} />
          <div className="range-meta"><span>Free (£0)</span><span>{firstName(user.name)}’s limit {money(user.preferences.maxPrice)}</span><span>£20 max</span></div>
        </section>
        <button className="between card pad" aria-pressed={draft.equipmentOnly} onClick={() => patch({ equipmentOnly: !draft.equipmentOnly })}>
          <span><b>Show only sessions with equipment included</b><span className="tiny" style={{ display: 'block' }}>Rackets, bibs, shuttlecocks, or floats already in the price.</span></span>
          <span className={draft.equipmentOnly ? 'check on' : 'check'}>{draft.equipmentOnly ? '✓' : ''}</span>
        </button>
        <section className="stack">
          <b>Sport</b>
          <div className="cluster">
            {SPORT_ORDER.map((sport) => (
              <button key={sport} className={draft.sports.includes(sport) ? 'chip navy' : 'chip'} aria-pressed={draft.sports.includes(sport)} onClick={() => toggle(draft.sports, sport as SportId, 'sports')}>{sportLabel(sport)}</button>
            ))}
          </div>
        </section>
        <section className="stack">
          <b>Distance from campus</b>
          <div className="cluster">
            {DISTANCES.map((item) => {
              const on = draft.distance === item.value
              return <button key={item.id} className={on ? 'chip navy' : 'chip'} aria-pressed={on} onClick={() => patch({ distance: item.value })}>{item.label}</button>
            })}
          </div>
        </section>
        <section className="stack">
          <b>Available days</b>
          <div className="cluster">
            {DAYS.map((day) => (
              <button key={day.id} className={draft.days.includes(day.id) ? 'chip navy' : 'chip'} aria-pressed={draft.days.includes(day.id)} onClick={() => toggle(draft.days, day.id as DayBucket, 'days')}>{day.label}</button>
            ))}
          </div>
        </section>
        <section className="stack">
          <b>Skill level</b>
          <div className="cluster">
            {LEVELS.map((level) => (
              <button key={level.id} className={draft.levels.includes(level.id) ? 'chip navy' : 'chip'} aria-pressed={draft.levels.includes(level.id)} onClick={() => toggle(draft.levels, level.id as SkillLevel, 'levels')}>{levelFilterLabel(level.id)}</button>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  )
}
