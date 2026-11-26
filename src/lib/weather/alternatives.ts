import type { Session, WeatherAssessment, WeatherForecast } from '../../types'
import { getSession, sessions } from '../../data/catalog'
import { assessSessionWeather } from './assessment'

export interface WeatherAlternative {
  session: Session
  score: number
  reasons: string[]
}

function hoursApart(a: string, b: string): number {
  return Math.abs(+new Date(a) - +new Date(b)) / 3600000
}

function sameCalendarDay(a: string, b: string): boolean {
  const left = new Date(a)
  const right = new Date(b)
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}

/** Rank safer alternatives for a session with orange/red weather risk. Never invents sessions. */
export function findWeatherAlternatives(
  session: Session,
  forecast: WeatherForecast | null,
  options?: { limit?: number; excludeIds?: string[] },
): WeatherAlternative[] {
  const limit = options?.limit ?? 3
  const excluded = new Set(options?.excludeIds ?? [])
  excluded.add(session.id)

  const candidates = sessions.filter((item) => {
    if (excluded.has(item.id)) return false
    if (item.setting === 'outdoor') return false
    return true
  })

  const scored: WeatherAlternative[] = []
  for (const candidate of candidates) {
    const assessment = assessSessionWeather(candidate, forecast)
    if (assessment.risk === 'orange' || assessment.risk === 'red') continue
    if (candidate.setting === 'mixed' && assessment.risk !== 'green') continue

    let score = 0
    const reasons: string[] = []

    if (candidate.sport === session.sport) {
      score += 100
      reasons.push('Same sport')
    } else {
      score -= 40
    }

    if (sameCalendarDay(candidate.startsAt, session.startsAt)) {
      score += 40
      reasons.push('Same day')
    } else {
      const dayGap = Math.abs(+new Date(candidate.startsAt) - +new Date(session.startsAt)) / 86400000
      if (dayGap <= 2) {
        score += 20
        reasons.push('Nearby date')
      } else {
        score -= Math.min(30, Math.round(dayGap * 4))
      }
    }

    const gap = hoursApart(candidate.startsAt, session.startsAt)
    if (gap <= 1) {
      score += 30
      reasons.push('Similar time')
    } else if (gap <= 3) {
      score += 18
      reasons.push('Similar time')
    } else if (gap <= 6) {
      score += 8
    } else {
      score -= 10
    }

    const priceDiff = Math.abs(candidate.price - session.price)
    if (priceDiff <= 0.01) {
      score += 20
      reasons.push('Same price')
    } else if (priceDiff <= 1.5) {
      score += 12
      reasons.push('Similar price')
    } else if (priceDiff <= 3) {
      score += 4
    } else {
      score -= 8
    }

    if (candidate.level === session.level) {
      score += 16
      reasons.push('Similar skill level')
    } else if (
      (candidate.level === 'starting' && session.level === 'recreational') ||
      (candidate.level === 'recreational' && session.level === 'starting')
    ) {
      score += 8
    }

    if (candidate.setting === 'indoor') {
      score += 24
      reasons.push('Indoor venue')
    }

    const distanceDiff = Math.abs(candidate.distanceKm - session.distanceKm)
    if (candidate.distanceKm <= session.distanceKm + 1.5) {
      score += 14
      reasons.push(`${candidate.distanceKm} km away`)
    } else if (distanceDiff <= 3) {
      score += 6
    } else {
      score -= 6
    }

    if (candidate.equipmentIncluded) {
      score += 6
      reasons.push('Equipment included')
    }

    if (assessment.risk === 'green') score += 10

    scored.push({ session: candidate, score, reasons: [...new Set(reasons)].slice(0, 4) })
  }

  return scored.sort((a, b) => b.score - a.score || a.session.distanceKm - b.session.distanceKm).slice(0, limit)
}

export function findAlternativesForSessionId(
  sessionId: string,
  forecast: WeatherForecast | null,
  assessment?: WeatherAssessment,
  options?: { limit?: number; excludeIds?: string[] },
): WeatherAlternative[] {
  const session = getSession(sessionId)
  if (!session) return []
  if (assessment && assessment.risk !== 'orange' && assessment.risk !== 'red') return []
  if (!assessment && session.setting === 'indoor') return []
  return findWeatherAlternatives(session, forecast, options)
}

export function alternativeHeadline(sportLabel: string): string {
  return `${sportLabel} without the rain?`
}
