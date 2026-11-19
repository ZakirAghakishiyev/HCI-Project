import type { FilterState, Person, Preferences, Session, SkillLevel, SportId, TimePref, User } from '../types'
import { getHost, getVenue, people, sessions } from '../data/catalog'
import { dayBucket } from './dates'

export function filtersFromPrefs(prefs: Preferences): FilterState {
  return {
    query: '',
    sports: prefs.sports.length ? [prefs.sports[0]] : [],
    maxPrice: prefs.maxPrice,
    equipmentOnly: false,
    distance: null,
    days: [],
    levels: [],
    sort: 'recommended',
  }
}

export function filterSessions(list: Session[], filters: FilterState): Session[] {
  const query = filters.query.trim().toLowerCase()
  const next = list.filter((session) => {
    if (filters.sports.length && !filters.sports.includes(session.sport)) return false
    if (session.price > filters.maxPrice + 0.001) return false
    if (filters.equipmentOnly && !session.equipmentIncluded) return false
    if (filters.distance != null && session.distanceKm > filters.distance + 0.05) return false
    if (filters.days.length && !filters.days.includes(dayBucket(new Date(session.startsAt)))) return false
    if (filters.levels.length && !filters.levels.includes(session.level)) return false
    if (query) {
      const blob = `${session.name} ${session.sport} ${session.levelLabel} ${session.tags.join(' ')} ${session.cardNote} ${getVenue(session.venueId).name} ${getHost(session.hostId).name}`.toLowerCase()
      if (!blob.includes(query)) return false
    }
    return true
  })
  next.sort((a, b) => {
    if (filters.sort === 'price') return a.price - b.price || a.rank - b.rank
    if (filters.sort === 'distance') return a.distanceKm - b.distanceKm || a.rank - b.rank
    if (filters.sort === 'soonest') return +new Date(a.startsAt) - +new Date(b.startsAt)
    return a.rank - b.rank
  })
  return next
}

export function matchedSessions(prefs: Preferences): Session[] {
  const cap = prefs.maxPrice || 5
  return sessions.filter(
    (session) =>
      (prefs.sports.length === 0 || prefs.sports.includes(session.sport)) &&
      session.price <= cap + 0.001 &&
      session.distanceKm <= 2.05,
  )
}

export function recommendSessions(user: User, limit = 2): Session[] {
  const booked = new Set(user.bookings.filter((booking) => booking.status === 'upcoming').map((booking) => booking.sessionId))
  const sports = new Set(user.preferences.sports)
  const affordable = sessions.filter((session) => {
    if (sports.size && !sports.has(session.sport)) return false
    if (session.price > user.preferences.maxPrice + 0.001) return false
    return true
  })
  const fresh = affordable.filter((session) => !booked.has(session.id))
  return [...(fresh.length ? fresh : affordable)].sort((a, b) => a.rank - b.rank).slice(0, limit)
}

export interface BuddyFilters {
  sport: SportId | 'all'
  level: SkillLevel | 'all'
  time: TimePref | 'all'
}

export function matchBuddies(user: User, filters: BuddyFilters): Person[] {
  return people
    .filter((person) => person.discoverable)
    .filter((person) => {
      if (filters.sport === 'all') {
        return user.preferences.sports.length === 0 || person.sports.some((sport) => user.preferences.sports.includes(sport))
      }
      return person.sports.includes(filters.sport)
    })
    .filter((person) => filters.level === 'all' || person.level === filters.level)
    .filter((person) => filters.time === 'all' || person.times.includes(filters.time) || person.times.includes('flexible'))
    .sort((a, b) => a.featureRank - b.featureRank || b.compatibility - a.compatibility)
}

export function proposedSession(user: User, person: Person): Session | undefined {
  const sports = new Set(person.sports.filter((sport) => user.preferences.sports.length === 0 || user.preferences.sports.includes(sport)))
  const pool = sessions.filter((session) => (sports.size ? sports.has(session.sport) : person.sports.includes(session.sport)))
  const affordable = pool.filter((session) => session.price <= user.preferences.maxPrice + 0.001)
  const list = affordable.length ? affordable : pool
  return [...list].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt) || a.rank - b.rank)[0]
}
