import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { sessions } from '../data/catalog'
import { flexSlots } from '../lib/dates'
import { clock, money, shortWeekday } from '../lib/format'
import { Button, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Reschedule() {
  const { bookingId = '' } = useParams()
  const { user, moveBooking, transferBooking, makeShort } = useApp()
  const navigate = useNavigate()
  const booking = user?.bookings.find((item) => item.id === bookingId && item.status === 'upcoming')
  useTitle('Flex session')
  const slots = booking ? flexSlots(booking.snapshot.startsAt, booking.snapshot.endsAt) : []
  const alternatives = booking ? sessions.filter((session) => session.sport === booking.snapshot.sport && session.id !== booking.sessionId) : []
  const [option, setOption] = useState<'transfer' | 'move' | 'short'>('move')
  const [slotId, setSlotId] = useState(slots.find((slot) => slot.recommended)?.id ?? slots[0]?.id)
  const [altId, setAltId] = useState(alternatives[0]?.id ?? '')
  const [done, setDone] = useState('')
  if (!user || !booking) return <Shell><div className="empty"><b>That booking isn’t active.</b><Button onClick={() => navigate('/my-sessions')}>Back to my sessions</Button></div></Shell>
  const slot = slots.find((item) => item.id === slotId) ?? slots[0]
  const alt = alternatives.find((session) => session.id === altId)
  const confirmLabel = option === 'move' && slot ? `Confirm ${shortWeekday(new Date(slot.startsAt))} ${clock(new Date(slot.startsAt))}` : option === 'transfer' && alt ? `Move me to ${alt.name}` : 'Start the 15-minute version'

  function confirm() {
    if (option === 'move' && slot && !slot.current) {
      moveBooking(booking!.id, slot.startsAt, slot.endsAt)
      setDone(`You’re moved to ${shortWeekday(new Date(slot.startsAt))} ${clock(new Date(slot.startsAt))}. Same welcome, no penalty.`)
    } else if (option === 'move' && slot?.current) {
      setDone('You’re staying at the original time. Nothing else to change.')
    } else if (option === 'transfer' && alt) {
      transferBooking(booking!.id, alt.id)
      setDone(`Your booking now follows ${alt.name}. The credit came with you.`)
    } else {
      makeShort(booking!.id)
      setDone('Switched to a 15-minute reset. Showing up still counts, even from home.')
    }
  }

  return (
    <Shell footer={!done ? <Button block variant="navy" onClick={confirm}>{confirmLabel}</Button> : <Button block onClick={() => navigate('/my-sessions')}>Back to my sessions</Button>}>
      <div className="between">
        <span className="pill">Flex Session</span>
        <button className="icon-btn" aria-label="Close" onClick={() => navigate('/my-sessions')}><X /></button>
      </div>
      <div className="stack-lg" style={{ marginTop: 12 }}>
        <div className="stack">
          <h1 className="h1">Plans changed? No problem.</h1>
          <p className="muted">Life happens. Reschedule without penalty, move to another day, or take a quick 15-minute alternative.</p>
        </div>
        {done ? <div className="notice"><b>{done}</b></div> : (
          <>
            <div className="card pad between">
              <div><div className="tiny">Current booking</div><b>{booking.snapshot.name}</b><div className="tiny">{shortWeekday(new Date(booking.snapshot.startsAt))} {clock(new Date(booking.snapshot.startsAt))}</div></div>
              <span className="price-pill">{money(booking.snapshot.price)} credit</span>
            </div>
            <button className={option === 'transfer' ? 'option on' : 'option'} onClick={() => setOption('transfer')}>
              <b>1. Find another session</b>
              <span className="tiny">Free transfer. Browse other upcoming sessions. Your credit applies automatically.</span>
              {option === 'transfer' && (
                <div className="stack" style={{ marginTop: 8 }}>
                  {alternatives.map((session) => (
                    <span key={session.id} className={altId === session.id ? 'chip navy' : 'chip'} onClick={(event) => { event.stopPropagation(); setAltId(session.id) }}>{session.name} · {money(session.price)}</span>
                  ))}
                  {alternatives.length === 0 && <span className="tiny">No other sessions this week. Moving the day is the kinder option.</span>}
                </div>
              )}
            </button>
            <button className={option === 'move' ? 'option on' : 'option'} onClick={() => setOption('move')}>
              <div className="between"><b>2. Move to another day</b><span className="pill">Recommended</span></div>
              <span className="tiny">Pick a new time. The host and the easy welcome stay the same.</span>
              {option === 'move' && (
                <div className="slots" style={{ marginTop: 8 }}>
                  {slots.map((item) => {
                    const date = new Date(item.startsAt)
                    return (
                      <span key={item.id} className={slotId === item.id ? 'slot on' : 'slot'} onClick={(event) => { event.stopPropagation(); setSlotId(item.id) }}>
                        <b>{shortWeekday(date)} {date.getDate()}</b>
                        <small>{clock(date)}</small>
                      </span>
                    )
                  })}
                </div>
              )}
            </button>
            <button className={option === 'short' ? 'option on' : 'option'} onClick={() => setOption('short')}>
              <b>3. Try a quick 15-minute session</b>
              <span className="tiny">Can’t make the court? A short mobility reset protects the habit. It is not a test.</span>
            </button>
            <p className="tiny">A consistent comeback is about showing up when you can, not perfection.</p>
          </>
        )}
      </div>
    </Shell>
  )
}
