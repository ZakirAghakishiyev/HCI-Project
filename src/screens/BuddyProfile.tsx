import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, MapPin } from 'lucide-react'
import { getPerson, getVenue } from '../data/catalog'
import { proposedSession } from '../lib/filter'
import { money, whenShort } from '../lib/format'
import { Avatar, Button, Sheet, Shell, TopBar, useTitle } from '../components/ui'
import { useApp } from '../store/store'

const NOTES = ['Want to warm up together?', 'I’m returning after a break too.', 'See you there — no pressure.']

export function BuddyProfile() {
  const { id = '' } = useParams()
  const person = getPerson(id)
  useTitle(person ? person.name : 'Buddy')
  const { user, sendInvite, withdrawInvite } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(NOTES[0])
  if (!user || !person) return <Shell><p className="pad">That profile is unavailable.</p></Shell>
  const session = proposedSession(user, person)
  const invite = session ? user.invitations.find((item) => item.buddyId === person.id && item.sessionId === session.id) : undefined
  const venue = session ? getVenue(session.venueId) : undefined
  const status = !invite ? null : invite.status === 'pending' ? 'Pending reply' : invite.status === 'accepted' ? 'Accepted' : invite.reason === 'withdrawn' ? 'Withdrawn' : 'Declined'

  return (
    <Shell
      footer={
        <div className="stack">
          <Button block variant="lime" disabled={!session || invite?.status === 'pending' || invite?.status === 'accepted'} onClick={() => session && sendInvite(person.id, session.id)}>
            {invite?.status === 'accepted' ? `${person.name} is in` : invite?.status === 'pending' ? 'Invite pending' : `Invite ${person.name} to Join`}
          </Button>
          <Button block variant="outline" onClick={() => setOpen(true)}>Send Quick Message</Button>
        </div>
      }
      overlay={open ? (
        <Sheet title={`Message ${person.name}`} onClose={() => setOpen(false)}>
          <div className="stack">
            {NOTES.map((item) => <button key={item} className={note === item ? 'option on' : 'option'} onClick={() => setNote(item)}>{item}</button>)}
            <label className="field"><span>Or write your own</span><textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <Button block disabled={!session || !note.trim()} onClick={() => { if (session) { sendInvite(person.id, session.id, note.trim()); setOpen(false) } }}>Send</Button>
          </div>
        </Sheet>
      ) : null}
    >
      <TopBar back={() => navigate(-1)} title="Sport buddy" />
      <div className="stack-lg">
        <header className="profile-head">
          <Avatar src={person.avatar} name={person.name} size={72} />
          <div>
            <h1 className="h2">{person.name}, {person.age} {person.verified && <BadgeCheck size={16} color="#3d6b22" />}</h1>
            <p className="tiny">{person.levelLabel} {person.sportLabel} · {person.distanceKm} km away</p>
            <p className="tiny">{person.statusLine}</p>
          </div>
        </header>
        <section className="stack">
          <p className="kicker">Player introduction</p>
          <p className="help">{person.intro}</p>
        </section>
        <div className="tiles">
          <div className="tile"><span className="tiny">Availability</span><b style={{ fontSize: 14 }}>{person.availability}</b></div>
          <div className="tile"><span className="tiny">Previous play</span><b style={{ fontSize: 14 }}>{person.previousPlay}</b></div>
          <div className="tile"><span className="tiny">Vibe</span><b style={{ fontSize: 14 }}>{person.vibe}</b></div>
          <div className="tile"><span className="tiny">Comeback progress</span><b style={{ fontSize: 14 }}>{person.progress}</b></div>
        </div>
        {session && venue && (
          <section className="card pad stack">
            <div className="between"><span className="kicker">Proposed shared session</span><span className="price-pill">{money(session.price)} total</span></div>
            <b>{session.name}</b>
            <p className="tiny">{whenShort(session.startsAt)} · {venue.name}</p>
            <p className="tiny">{session.equipmentNote} · Host is ready</p>
            <div className="pill"><MapPin size={14} /> Matching time & location · {person.name.split(' ')[0]} is free</div>
          </section>
        )}
        <section className="notice">
          <b>Ready to connect</b>
          <p>Inviting {person.name} reserves a spot together. The host is told you would like to be paired. You can still come if they can’t.</p>
          {status && <p><b>Status: {status}</b>{invite?.message ? ` · “${invite.message}”` : ''}</p>}
          {invite?.status === 'pending' && <Button size="sm" variant="outline" onClick={() => withdrawInvite(invite.id)}>Withdraw invite</Button>}
        </section>
      </div>
    </Shell>
  )
}
