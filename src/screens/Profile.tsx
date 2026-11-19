import { useState } from 'react'
import { ChevronRight, LogOut, Settings } from 'lucide-react'
import type { NotifyPref, TimePref } from '../types'
import { NOTIFY_OPTIONS, TIMES, barrierHelp, barrierProfileLabel } from '../data/options'
import { LEVELS } from '../data/options'
import { formatTimes, money, notifyLabel, sportLabel } from '../lib/format'
import { Avatar, Button, Sheet, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'
import { useNavigate } from 'react-router-dom'

export function Profile() {
  useTitle('Profile')
  const { user, logout, updateProfile, savePrefs, persistBudget } = useApp()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<'details' | 'times' | 'notes' | 'goal' | null>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [age, setAge] = useState(String(user?.age ?? ''))
  const [area, setArea] = useState(user?.area ?? '')
  const [goal, setGoal] = useState(user?.preferences.goal ?? '')
  if (!user) return null

  async function onAvatar(file: File) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const image = new Image()
        image.onload = () => {
          const canvas = document.createElement('canvas')
          const scale = 240 / Math.max(image.width, image.height)
          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)
          canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }
        image.src = String(reader.result)
      }
      reader.readAsDataURL(file)
    })
    updateProfile({ avatar: dataUrl })
  }

  return (
    <Shell nav overlay={sheet ? (
      <Sheet title={sheet === 'details' ? 'Your details' : sheet === 'times' ? 'Preferred times' : sheet === 'notes' ? 'Notifications' : 'Your goal'} onClose={() => setSheet(null)}>
        {sheet === 'details' && (
          <div className="stack">
            <label className="field"><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="field"><span>Age</span><input value={age} inputMode="numeric" onChange={(event) => setAge(event.target.value)} /></label>
            <label className="field"><span>Area</span><input value={area} onChange={(event) => setArea(event.target.value)} /></label>
            <Button onClick={() => { const nextAge = Number(age); if (name.trim().length < 2 || nextAge < 16) return; updateProfile({ name: name.trim(), age: nextAge, area: area.trim() || user.area }); setSheet(null) }}>Save details</Button>
          </div>
        )}
        {sheet === 'times' && (
          <div className="cluster">
            {TIMES.map((item) => {
              const on = user.preferences.times.includes(item.id)
              return <button key={item.id} className={on ? 'chip navy' : 'chip'} onClick={() => {
                const times = on ? user.preferences.times.filter((time) => time !== item.id) : [...user.preferences.times, item.id as TimePref]
                savePrefs({ times })
              }}>{item.title}</button>
            })}
          </div>
        )}
        {sheet === 'notes' && (
          <div className="stack">
            {NOTIFY_OPTIONS.map((item) => (
              <button key={item.id} className={user.preferences.notifications === item.id ? 'option on' : 'option'} onClick={() => { savePrefs({ notifications: item.id as NotifyPref }); setSheet(null) }}>{item.label}</button>
            ))}
          </div>
        )}
        {sheet === 'goal' && (
          <div className="stack">
            <label className="field"><span>In your words</span><textarea value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
            <Button onClick={() => { savePrefs({ goal: goal.trim() }); setSheet(null) }}>Save goal</Button>
          </div>
        )}
      </Sheet>
    ) : null}>
      <div className="stack-lg">
        <div className="between"><h1 className="h1" style={{ fontSize: 28 }}>Profile & Preferences</h1><button className="icon-btn" aria-label="Edit details" onClick={() => setSheet('details')}><Settings size={18} /></button></div>
        <header className="profile-head">
          <label style={{ cursor: 'pointer' }}>
            <Avatar src={user.avatar} name={user.name} size={72} />
            <input type="file" accept="image/*" hidden aria-label="Change profile photo" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onAvatar(file) }} />
          </label>
          <div>
            <h2 className="h2" style={{ fontSize: 22 }}>{user.name}</h2>
            <span className="pill">{user.membership}</span>
            <p className="tiny">{user.age} · {user.role}</p>
            <p className="tiny">{user.area} · Max {user.preferences.maxDistance >= 5 ? 'any' : `${user.preferences.maxDistance} km`} radius</p>
          </div>
        </header>
        <section className="card pad stack">
          <div className="between"><b>My Comeback Plan</b><button onClick={() => navigate('/onboarding/sports?edit=1')}><b>Edit plan</b></button></div>
          <div><div className="kicker">Barriers I’m overcoming</div><div className="cluster" style={{ marginTop: 6 }}>{user.preferences.barriers.map((id) => <span key={id} className="tag">{barrierProfileLabel(id, user.role, user.preferences.maxPrice)}</span>)}</div></div>
          <button className="row-link" onClick={() => setSheet('goal')}><span><small>My goals</small><strong>{user.preferences.goal}</strong></span><ChevronRight size={16} /></button>
          <div className="between"><span><small className="tiny">Preferred sports & level</small><div><b>{user.preferences.sports.map(sportLabel).join(', ') || 'Not set'}</b> · {LEVELS.find((item) => item.id === user.preferences.level)?.title}</div></span><span className="pill">Active match</span></div>
          {user.preferences.barriers[0] && <p className="tiny">{barrierHelp(user.preferences.barriers[0])}</p>}
        </section>
        <section className="stack">
          <h2 className="section-label">Budget & scheduling</h2>
          <div className="card pad stack">
            <div className="between"><span>Max session price</span><b>{money(user.preferences.maxPrice)} limit</b></div>
            <input className="range" type="range" min={0} max={20} step={0.5} value={user.preferences.maxPrice} aria-label="Maximum session price" onChange={(event) => persistBudget(Number(event.target.value), user.preferences.maxDistance)} />
            <button className="row-link" onClick={() => setSheet('times')}><span><small>Preferred play times</small><strong>{formatTimes(user.preferences.times)}</strong></span><ChevronRight /></button>
            <button className="row-link" onClick={() => setSheet('notes')}><span><small>Notification preferences</small><strong>{notifyLabel(user.preferences.notifications)}</strong></span><ChevronRight /></button>
          </div>
        </section>
        <Button variant="outline" block onClick={() => { logout(); navigate('/') }}><LogOut size={16} /> Log Out of Back in Play</Button>
      </div>
    </Shell>
  )
}
