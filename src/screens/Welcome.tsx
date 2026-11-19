import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo, Shell, useTitle } from '../components/ui'

export function Welcome() {
  useTitle('Back in Play')
  return (
    <Shell bleed>
      <section className="welcome">
        <img className="welcome-bg" src="/images/welcome.jpg" alt="" />
        <div className="welcome-shade" />
        <header className="welcome-top">
          <Logo light />
          <span className="version">v2.4</span>
        </header>
        <div className="welcome-copy">
          <div className="glass"><i className="dot" /> No pressure. Transparent fees. Real buddies.</div>
          <h1>Your comeback starts here.</h1>
          <p>Find your people. Rediscover your sport. Make it a habit you actually look forward to.</p>
          <div className="benefits">
            <div className="benefit"><strong>£5 or less</strong><span>Local Play Pass</span></div>
            <div className="benefit mid"><strong>Friendly hosts</strong><span>Welcome back</span></div>
            <div className="benefit"><strong>Sport buddy</strong><span>Never play alone</span></div>
          </div>
          <Link className="btn btn-lime block" to="/register">Get Started <ArrowRight size={18} /></Link>
          <p className="login-line">Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </section>
    </Shell>
  )
}
