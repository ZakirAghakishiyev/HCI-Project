import type { NotifyPref, SportId, TimePref } from '../types'
import { SPORT_META } from '../data/options'
import { dayDiff } from './dates'

export function sportLabel(id: SportId): string {
  return SPORT_META[id].label
}

export function money(n: number): string {
  if (n <= 0) return 'Free'
  return `£${n.toFixed(2)}`
}

export function clock(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
}

export function weekday(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'long' })
}

export function shortWeekday(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}

export function dayMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function whenRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return `${weekday(start)}, ${clock(start)} – ${clock(end)}`
}

export function whenShort(startIso: string): string {
  const start = new Date(startIso)
  return `${weekday(start)}, ${clock(start)}`
}

export function relativeLabel(startIso: string): string {
  const diff = dayDiff(new Date(startIso))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1 && diff < 14) return `In ${diff} days`
  return weekday(new Date(startIso))
}

export function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function formatTimes(times: TimePref[]): string {
  if (!times.length) return 'Not set yet'
  if (times.includes('flexible') && times.length === 1) return 'Any available slot'
  const map: Record<TimePref, string> = {
    'weekday-mornings': 'Weekday mornings',
    'weekday-evenings': 'Evenings',
    weekends: 'Weekends',
    flexible: 'Flexible',
  }
  return times.map((time) => map[time]).join(' · ')
}

export function notifyLabel(id: NotifyPref): string {
  const map: Record<NotifyPref, string> = {
    'buddies-flex': 'Buddy invites & Flex reminders only',
    sessions: 'Session reminders only',
    gentle: 'A gentle note now and then',
    paused: 'Paused for now',
  }
  return map[id]
}

export function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
