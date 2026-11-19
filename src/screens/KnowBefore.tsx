import { useNavigate, useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { getHost, getSession, getVenue } from '../data/catalog'
import { Avatar, Button, Shell, TopBar, useTitle } from '../components/ui'

export function KnowBefore() {
  const { id = '' } = useParams()
  const session = getSession(id)
  useTitle('Know before you go')
  const navigate = useNavigate()
  if (!session) return <Shell><p className="pad">That session is no longer listed.</p></Shell>
  const host = getHost(session.hostId)
  const venue = getVenue(session.venueId)
  return (
    <Shell footer={<Button block variant="lime" onClick={() => navigate(`/sessions/${session.id}`)}>I’m Ready — Continue</Button>}>
      <TopBar back={() => navigate(-1)} title="Confidence barrier buster" />
      <div className="stack-lg">
        <div className="stack">
          <h1 className="h1">Know before you go.</h1>
          <p className="muted">Zero awkward surprises. Here is exactly what happens when you step through the door.</p>
        </div>
        <section className="navy-card">
          <span className="kicker" style={{ color: 'var(--lime)' }}>Comeback guarantee</span>
          <p>Everyone starts somewhere. {session.guarantee}</p>
        </section>
        <section className="stack">
          <h2 className="section-label">What will happen?</h2>
          {session.steps.map((step, index) => (
            <div key={step.title} className="guide-step">
              <span className="n">{index + 1}</span>
              <div><b>{step.title}</b><p className="tiny">{step.body}</p></div>
            </div>
          ))}
        </section>
        <section className="stack">
          <h2 className="section-label">Who will welcome you?</h2>
          <article className="card pad stack">
            <div className="between">
              <div className="cluster">
                <Avatar src={host.avatar} name={host.name} size={56} />
                <div><b>{host.name}</b><div className="tiny">{host.role}</div></div>
              </div>
              <span className="pill">Host</span>
            </div>
            <p className="help">“{host.bio}”</p>
          </article>
        </section>
        <section className="stack">
          <h2 className="section-label">What’s the atmosphere like?</h2>
          <div className="cluster">{session.mood.map((item) => <span key={item} className="tag">{item}</span>)}</div>
        </section>
        <section className="stack">
          <h2 className="section-label">Where should I go?</h2>
          <div className="map-card"><MapPin className="pin" /><span>{venue.entranceName}</span></div>
          <p className="help">{venue.entrance}</p>
        </section>
      </div>
    </Shell>
  )
}
