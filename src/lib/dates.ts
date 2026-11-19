import type { DayBucket } from '../types'

export function atNext(dow: number, hours: number, minutes = 0): Date {
  const now = new Date()
  const d = new Date(now)
  d.setHours(hours, minutes, 0, 0)
  let add = (dow - d.getDay() + 7) % 7
  if (add === 0 && d.getTime() <= now.getTime()) add = 7
  d.setDate(d.getDate() + add)
  return d
}

export function onWeekday(weeksAgo: number, dow: number, hours: number, minutes = 0): Date {
  const now = new Date()
  const mondayOffset = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setHours(hours, minutes, 0, 0)
  monday.setDate(now.getDate() - mondayOffset - weeksAgo * 7)
  const date = new Date(monday)
  date.setDate(monday.getDate() + ((dow + 6) % 7))
  return date
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

export function weekId(d: Date): string {
  const x = startOfWeek(d)
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
}

export function computeStreak(dates: Date[], now = new Date()): number {
  const keys = new Set(dates.map(weekId))
  const cursor = startOfWeek(now)
  if (!keys.has(weekId(cursor))) cursor.setDate(cursor.getDate() - 7)
  let count = 0
  while (keys.has(weekId(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 7)
  }
  return count
}

export function dayDiff(target: Date, now = new Date()): number {
  const a = new Date(now)
  a.setHours(0, 0, 0, 0)
  const b = new Date(target)
  b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function dayBucket(d: Date): DayBucket {
  const day = d.getDay()
  if (day === 0 || day === 6) return 'weekends'
  if (day === 4) return 'thursday'
  if (day === 5) return 'friday'
  return 'mon-wed'
}

export interface FlexSlot {
  id: string
  startsAt: string
  endsAt: string
  current: boolean
  recommended: boolean
}

export function flexSlots(startIso: string, endIso: string): FlexSlot[] {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const mins = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000))
  const pack = (date: Date, id: string, current: boolean, recommended: boolean): FlexSlot => {
    const ends = new Date(date.getTime() + mins * 60000)
    return { id, startsAt: date.toISOString(), endsAt: ends.toISOString(), current, recommended }
  }
  const upcomingDow = (dow: number, hours: number, minutes: number) => {
    const d = new Date(start)
    d.setHours(hours, minutes, 0, 0)
    let add = (dow - d.getDay() + 7) % 7
    if (add === 0) add = 7
    d.setDate(d.getDate() + add)
    return d
  }
  const next = new Date(start)
  next.setDate(next.getDate() + 7)
  return [
    pack(start, 'current', true, false),
    pack(upcomingDow(6, 11, 0), 'sat', false, true),
    pack(upcomingDow(0, 14, 0), 'sun', false, false),
    pack(next, 'next', false, false),
  ]
}
