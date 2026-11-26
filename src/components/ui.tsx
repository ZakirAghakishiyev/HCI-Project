import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Compass, Home, TrendingUp, UserRound, X } from 'lucide-react'
import type { Session, SportId, WeatherAssessment } from '../types'
import { SPORT_META } from '../data/options'
import { getHost, getVenue, sessionSettingLabel } from '../data/catalog'
import { money, sportLabel, whenShort } from '../lib/format'
import { useApp } from '../store/store'
import { WeatherBadge } from './weather'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === 'Back in Play' ? title : `${title} · Back in Play`
  }, [title])
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={cn('brand', light && 'on-dark')}>
      <span className="brand-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3.5 3.2h2.3L11.2 8.4 5.8 14.6H3.5l4.8-6.2-4.8-5.2z" fill="#101C2C" />
        </svg>
      </span>
      <span>
        <strong>Back in Play</strong>
        <small>Recreational sports</small>
      </span>
    </div>
  )
}

export function SportIcon({ sport, size = 18 }: { sport: SportId; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (sport === 'badminton') return <svg {...props}><circle cx="8" cy="16" r="3" /><path d="M10.2 13.8 18 6M16 4l4 4" /></svg>
  if (sport === 'football') return <svg {...props}><circle cx="12" cy="12" r="8" /><path d="m12 8 2.2 1.6-.8 2.6h-2.8L9.8 9.6 12 8z" /></svg>
  if (sport === 'tennis') return <svg {...props}><circle cx="12" cy="12" r="8" /><path d="M5 12c2.2-2 4.4-2 7 0s4.8 2 7 0" /></svg>
  if (sport === 'basketball') return <svg {...props}><circle cx="12" cy="12" r="8" /><path d="M4.5 12h15M12 4c2.2 2.6 2.2 13.4 0 16M12 4c-2.2 2.6-2.2 13.4 0 16" /></svg>
  if (sport === 'running') return <svg {...props}><circle cx="15" cy="5.5" r="1.4" /><path d="M8 20.5 10.4 16l2.2 1.2 1.5-3.1-2.3-1.3 1.1-2.2 3.5 1.5M6.8 13.8 10 15" /></svg>
  return <svg {...props}><path d="M3 15c2 1.4 3.2 1.4 5.2 0S11.2 13.6 13.2 15s3.2 1.4 5.2 0M3 19c2 1.4 3.2 1.4 5.2 0s3-1.4 5 0 3.2 1.4 5.2 0M15 6l-4 5 3 1-2 4" /></svg>
}

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  if (!src) return <span className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>
  return <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
}

export function Photo({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  return <img className={className} src={src} alt={alt} />
}

type Variant = 'lime' | 'navy' | 'outline' | 'ghost' | 'soft'

export function Button({ variant = 'lime', block, size, className, children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean; size?: 'sm' }) {
  return <button type={type} className={cn('btn', `btn-${variant}`, block && 'block', size === 'sm' && 'btn-sm', className)} {...props}>{children}</button>
}

export function ButtonLink({ to, variant = 'lime', block, size, children, className }: { to: string; variant?: Variant; block?: boolean; size?: 'sm'; children: ReactNode; className?: string }) {
  return <Link to={to} className={cn('btn', `btn-${variant}`, block && 'block', size === 'sm' && 'btn-sm', className)}>{children}</Link>
}

export function IconButton({ label, children, className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type={type} className={cn('icon-btn', className)} aria-label={label} {...props}>{children}</button>
}

const TABS = [
  { to: '/home', label: 'Home', icon: Home, on: (path: string) => path.startsWith('/home') },
  { to: '/explore', label: 'Explore', icon: Compass, on: (path: string) => ['/explore', '/buddies', '/sessions', '/filters'].some((item) => path.startsWith(item)) },
  { to: '/my-sessions', label: 'My Sessions', icon: CalendarDays, on: (path: string) => path.startsWith('/my-sessions') || path.startsWith('/reschedule') },
  { to: '/progress', label: 'Progress', icon: TrendingUp, on: (path: string) => path.startsWith('/progress') || path.startsWith('/check-in') },
  { to: '/profile', label: 'Profile', icon: UserRound, on: (path: string) => path.startsWith('/profile') || path.startsWith('/notifications') },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = tab.on(pathname)
        return (
          <Link key={tab.to} to={tab.to} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined}>
            <span className="bubble"><Icon size={18} strokeWidth={2.1} /></span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function Shell({ children, nav, footer, bleed, overlay }: { children: ReactNode; nav?: boolean; footer?: ReactNode; bleed?: boolean; overlay?: ReactNode }) {
  const { toast } = useApp()
  return (
    <div className={cn('shell', Boolean(toast) && 'has-toast')}>
      <div className={cn('shell-scroll', !bleed && 'pad', Boolean(toast) && !bleed && 'toast-pad')}>{children}</div>
      {footer ? <div className="shell-foot">{footer}</div> : null}
      {nav ? <BottomNav /> : null}
      {overlay}
    </div>
  )
}

export function TopBar({ back, title, step, right }: { back?: () => void; title?: string; step?: number; right?: ReactNode }) {
  return (
    <div className="topbar">
      {back ? <IconButton label="Go back" onClick={back}><ArrowLeft size={18} /></IconButton> : <span className="icon-spacer" />}
      {step ? (
        <div className="dots" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((n) => <i key={n} className={n === step ? 'on' : n < step ? 'done' : ''} />)}
        </div>
      ) : <strong className="top-title">{title}</strong>}
      {step ? <span className="tiny">Step {step} of 3</span> : right ?? <span className="icon-spacer" />}
    </div>
  )
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay-in" onMouseDown={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="between">
          <h2 className="h2" style={{ fontSize: 18 }}>{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SessionCard({
  session,
  layout = 'explore',
  booked,
  weather,
}: {
  session: Session
  layout?: 'explore' | 'home'
  booked?: boolean
  weather?: WeatherAssessment | null
}) {
  const venue = getVenue(session.venueId)
  const host = getHost(session.hostId)
  return (
    <article className="session-card">
      <div className="between">
        <div className="cluster">
          <span className="sport-bubble"><SportIcon sport={session.sport} /></span>
          <b>{sportLabel(session.sport)}</b>
        </div>
        <span className="price-pill">{session.price === 0 ? 'Free' : `${money(session.price)} total`}</span>
      </div>
      {session.eyebrow ? <div className="eyebrow">{session.eyebrow}</div> : null}
      <div className="between">
        <span className="cluster">
          <span className="tag">{sessionSettingLabel(session.setting)}</span>
          {session.tags
            .filter((tag) => !/^(indoor|outdoor|weather-dependent)$/i.test(tag))
            .slice(0, 2)
            .map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </span>
        <span className="tiny">{session.distanceKm} km away</span>
      </div>
      <h3>{session.name}</h3>
      <p className="tiny">{whenShort(session.startsAt)} · {venue.name}</p>
      {weather ? <WeatherBadge assessment={weather} /> : null}
      <div className="between">
        <span className="tiny">{layout === 'home' ? `${session.equipmentIncluded ? 'Gear included' : 'Kit noted'} · ${host.name} hosting` : session.cardNote}</span>
        <ButtonLink to={`/sessions/${session.id}`} variant="navy" size="sm">{booked ? 'View booking' : layout === 'home' ? 'Book Pass' : 'View Details'}</ButtonLink>
      </div>
    </article>
  )
}

export function SportImage({ sport, className }: { sport: SportId; className?: string }) {
  return <img src={SPORT_META[sport].image} alt="" className={className} />
}
