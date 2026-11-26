import type { AppNotification, Booking, User, WeatherAssessment, WeatherForecast } from '../../types'
import { getSession } from '../../data/catalog'
import { sportLabel, uid, whenShort } from '../format'
import { findWeatherAlternatives } from './alternatives'
import { assessWeather } from './assessment'

const STORAGE_PREFIX = 'bip-weather-notify:'

interface WeatherNotifyState {
  risk: string
  signature: string
  notifiedAt: string
}

function storageKey(userId: string, bookingId: string): string {
  return `${STORAGE_PREFIX}${userId}:${bookingId}`
}

function readState(userId: string, bookingId: string): WeatherNotifyState | null {
  try {
    const raw = localStorage.getItem(storageKey(userId, bookingId))
    return raw ? (JSON.parse(raw) as WeatherNotifyState) : null
  } catch {
    return null
  }
}

function writeState(userId: string, bookingId: string, state: WeatherNotifyState) {
  localStorage.setItem(storageKey(userId, bookingId), JSON.stringify(state))
}

function signatureOf(assessment: WeatherAssessment): string {
  return [
    assessment.risk,
    assessment.description ?? '',
    assessment.rainProbability ?? '',
    assessment.windSpeedKmh ?? '',
    assessment.temperatureC ?? '',
  ].join('|')
}

function meaningfulChange(prev: WeatherNotifyState | null, assessment: WeatherAssessment): boolean {
  if (!prev) return assessment.risk === 'yellow' || assessment.risk === 'orange' || assessment.risk === 'red'
  if (prev.risk === assessment.risk && prev.signature === signatureOf(assessment)) return false
  const order = ['green', 'unknown', 'yellow', 'orange', 'red']
  const prevIdx = order.indexOf(prev.risk)
  const nextIdx = order.indexOf(assessment.risk)
  // Notify on escalation, or when leaving green into caution+, or severe newly detected.
  if (nextIdx > prevIdx && nextIdx >= order.indexOf('yellow')) return true
  if (assessment.risk === 'red' && prev.risk !== 'red') return true
  if (assessment.risk === 'orange' && prev.risk === 'yellow') return true
  return false
}

function buildNotes(booking: Booking, assessment: WeatherAssessment, forecast: WeatherForecast | null): AppNotification[] {
  const session = getSession(booking.sessionId)
  const notes: AppNotification[] = []
  const when = whenShort(booking.snapshot.startsAt)
  const sport = sportLabel(booking.snapshot.sport)

  if (assessment.risk === 'red') {
    notes.push({
      id: uid('note'),
      title: 'Severe weather alert',
      body: `Severe weather is forecast during your outdoor ${sport.toLowerCase()} session (${when}). Please review the conditions before travelling.`,
      createdAt: new Date().toISOString(),
      read: false,
      href: session ? `/sessions/${session.id}` : '/my-sessions',
    })
  } else if (assessment.risk === 'orange' || assessment.risk === 'yellow') {
    notes.push({
      id: uid('note'),
      title: 'Weather update',
      body:
        assessment.risk === 'orange'
          ? `${assessment.description ?? 'Poor weather'} is now expected during your ${when} ${sport.toLowerCase()} session.`
          : `Weather may affect your ${sport.toLowerCase()} session on ${when}. ${assessment.description ?? 'Conditions are changing'}.`,
      createdAt: new Date().toISOString(),
      read: false,
      href: session ? `/sessions/${session.id}` : '/my-sessions',
    })
  }

  if ((assessment.risk === 'orange' || assessment.risk === 'red') && session) {
    const alt = findWeatherAlternatives(session, forecast, { limit: 1 })[0]
    if (alt) {
      notes.push({
        id: uid('note'),
        title: 'Alternative recommendation',
        body: `We found an indoor ${sportLabel(alt.session.sport).toLowerCase()} session nearby at a similar time.`,
        createdAt: new Date().toISOString(),
        read: false,
        href: `/sessions/${alt.session.id}`,
      })
    }
  }

  return notes
}

/** Create weather notifications only when forecast meaningfully changes for outdoor bookings. */
export function collectWeatherNotifications(
  user: User,
  forecast: WeatherForecast | null,
  forecastError: boolean,
): AppNotification[] {
  if (!forecast && !forecastError) return []
  const upcoming = user.bookings.filter((booking) => booking.status === 'upcoming' && booking.snapshot.setting !== 'indoor')
  const notes: AppNotification[] = []

  for (const booking of upcoming) {
    const assessment = assessWeather({
      startsAt: booking.snapshot.startsAt,
      setting: booking.snapshot.setting,
      sport: booking.snapshot.sport,
      forecast,
      forecastError,
    })
    if (assessment.risk === 'unknown' || assessment.risk === 'green') {
      writeState(user.id, booking.id, { risk: assessment.risk, signature: signatureOf(assessment), notifiedAt: new Date().toISOString() })
      continue
    }
    const prev = readState(user.id, booking.id)
    if (!meaningfulChange(prev, assessment)) continue
    notes.push(...buildNotes(booking, assessment, forecast))
    writeState(user.id, booking.id, { risk: assessment.risk, signature: signatureOf(assessment), notifiedAt: new Date().toISOString() })
  }

  return notes
}
