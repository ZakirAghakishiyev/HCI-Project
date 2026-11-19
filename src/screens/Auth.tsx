import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Logo, Shell, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const loginMode = mode === 'login'
  useTitle(loginMode ? 'Log in' : 'Create account')
  const { login, register } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!loginMode && name.trim().length < 2) return setError('Add the name you would like hosts to use.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email so we can keep your plan.')
    if (password.length < 6) return setError('Use at least 6 characters. This stays on your device for the prototype.')
    const ageNumber = age ? Number(age) : undefined
    if (!loginMode && age && (!ageNumber || ageNumber < 16 || ageNumber > 80)) return setError('Back in Play is for university students and adults.')
    setBusy(true)
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    const message = loginMode ? login(email, password) : register({ name, email, password, age: ageNumber })
    setBusy(false)
    if (message) return setError(message)
    navigate(loginMode ? '/home' : '/onboarding/sports')
  }

  return (
    <Shell>
      <form className="stack-lg" onSubmit={submit} noValidate>
        <Link to="/" className="icon-btn" aria-label="Back to welcome"><ArrowLeft size={18} /></Link>
        <Logo />
        <div className="stack">
          <h1 className="h1">{loginMode ? 'Welcome back.' : 'Start your comeback.'}</h1>
          <p className="muted">No club trials and no long forms. Just enough to keep your plan, bookings, and small wins on this device.</p>
        </div>
        {!loginMode && (
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Alex Turner" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@university.ac.uk" />
        </label>
        <label className="field">
          <span>Password</span>
          <span className="pass-wrap">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={show ? 'text' : 'password'} autoComplete={loginMode ? 'current-password' : 'new-password'} placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShow((value) => !value)}>{show ? 'Hide' : 'Show'}</button>
          </span>
        </label>
        {!loginMode && (
          <label className="field">
            <span>Age <span className="tiny">optional</span></span>
            <input value={age} onChange={(event) => setAge(event.target.value)} inputMode="numeric" placeholder="21" />
          </label>
        )}
        {error ? <p className="err" role="alert">{error}</p> : null}
        <Button type="submit" block disabled={busy}>{busy ? 'One moment…' : loginMode ? 'Log in' : 'Create account'}</Button>
        <p className="tiny" style={{ textAlign: 'center' }}>
          {loginMode ? <>New here? <Link to="/register"><b>Get started</b></Link></> : <>Already have an account? <Link to="/login"><b>Log in</b></Link></>}
        </p>
        {loginMode && (
          <div className="demo-card">
            <b>Preview a comeback in progress</b>
            <p className="tiny">Alex Turner · alex@university.ac.uk · comeback</p>
            <Button variant="soft" onClick={() => { setEmail('alex@university.ac.uk'); setPassword('comeback'); setError('') }}>Use Alex’s details</Button>
          </div>
        )}
      </form>
    </Shell>
  )
}
