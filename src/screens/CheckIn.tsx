import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

const FEELINGS = ['Amazing!', 'Really good', 'It was okay', 'A little difficult']
const ENJOYED = ['Meeting new people', 'Playing again', 'Improving skills', 'Being active']

export function CheckIn() {
  useTitle('Check-in')
  const { bookingId = '' } = useParams()
  const { user, checkIn, completeBooking } = useApp()
  const navigate = useNavigate()
  const booking = user?.bookings.find((item) => item.id === bookingId)
  const existing = user?.feedback.find((item) => item.bookingId === bookingId)
  const [feeling, setFeeling] = useState(existing?.feeling ?? '')
  const [enjoyed, setEnjoyed] = useState<string[]>(existing?.enjoyed ?? [])
  const [note, setNote] = useState(existing?.note ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(Boolean(existing))
  if (!user || !booking) return <Shell><div className="empty"><b>That session isn’t on your list.</b><Button onClick={() => navigate('/my-sessions')}>Back</Button></div></Shell>

  function toggle(item: string) {
    setEnjoyed((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])
  }

  function submit() {
    if (!feeling) return setError('Choose the feeling that fits. There is no correct answer.')
    if (booking!.status === 'upcoming') completeBooking(booking!.id)
    checkIn(booking!.id, feeling, enjoyed, note)
    setSaved(true)
  }

  return (
    <Shell footer={saved ? <Button block onClick={() => navigate('/progress')}>See my progress</Button> : <Button block variant="lime" onClick={submit}>Complete Check-in</Button>}>
      <div className="between"><span className="pill">Reflect & celebrate</span><button className="icon-btn" aria-label="Close" onClick={() => navigate('/my-sessions')}><X /></button></div>
      <div className="stack-lg" style={{ marginTop: 16 }}>
        <div className="stack">
          <h1 className="h1">How did it feel to be back?</h1>
          <p className="muted">Taking a moment to notice how you felt makes the habit kinder, and the next visit easier.</p>
        </div>
        {saved ? (
          <div className="notice"><b>Saved privately.</b><p>That feeling counts. It lives in your Small Wins journal, and only you can read it.</p></div>
        ) : (
          <>
            <section className="stack">
              <h2 className="section-label">How was your session?</h2>
              <div className="feelings">
                {FEELINGS.map((item) => <button key={item} className={feeling === item ? 'feeling on' : 'feeling'} aria-pressed={feeling === item} onClick={() => { setFeeling(item); setError('') }}>{item}</button>)}
              </div>
            </section>
            <section className="stack">
              <h2 className="section-label">What did you enjoy most?</h2>
              <div className="cluster">
                {ENJOYED.map((item) => <button key={item} className={enjoyed.includes(item) ? 'chip navy' : 'chip'} aria-pressed={enjoyed.includes(item)} onClick={() => toggle(item)}>{item}</button>)}
              </div>
            </section>
            <label className="field">
              <span>Anything you’d like to remember?</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="A sentence is enough. This stays private." />
            </label>
            <p className="tiny">Only you can read this. It stays in your Small Wins journal.</p>
            {error && <p className="err" role="alert">{error}</p>}
          </>
        )}
      </div>
    </Shell>
  )
}
