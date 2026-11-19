import type { BarrierId, DayBucket, NotifyPref, SkillLevel, SportId, TimePref } from '../types'

export const SPORT_ORDER: SportId[] = ['badminton', 'football', 'tennis', 'basketball', 'running', 'swimming']

export const SPORT_META: Record<SportId, { label: string; blurb: string; image: string }> = {
  badminton: { label: 'Badminton', blurb: 'Rackets & rallies', image: '/images/badminton.jpg' },
  football: { label: 'Football', blurb: '5-a-side & casual', image: '/images/football.jpg' },
  tennis: { label: 'Tennis', blurb: 'Parks & clubs', image: '/images/tennis.jpg' },
  basketball: { label: 'Basketball', blurb: 'Half & full court', image: '/images/basketball.jpg' },
  running: { label: 'Running', blurb: 'Social group jogs', image: '/images/running.jpg' },
  swimming: { label: 'Swimming', blurb: 'Lane & open swim', image: '/images/swimming.jpg' },
}

export const LEVELS: { id: SkillLevel; title: string; hint: string }[] = [
  { id: 'starting', title: 'Starting again', hint: 'Beginner pace' },
  { id: 'recreational', title: 'Recreational', hint: 'Casual rallies' },
  { id: 'intermediate', title: 'Intermediate', hint: 'Confident play' },
  { id: 'advanced', title: 'Advanced', hint: 'Competitive' },
]

export const TIMES: { id: TimePref; title: string; hint: string }[] = [
  { id: 'weekday-mornings', title: 'Weekday mornings', hint: '7 AM – 9 AM' },
  { id: 'weekday-evenings', title: 'Weekday evenings', hint: 'After 5:30 PM' },
  { id: 'weekends', title: 'Weekends', hint: 'Saturdays & Sundays' },
  { id: 'flexible', title: 'Flexible', hint: 'Any available slot' },
]

export const BARRIERS: { id: BarrierId; label: string }[] = [
  { id: 'busy', label: 'Busy schedule' },
  { id: 'partner', label: 'No partner' },
  { id: 'expensive', label: 'Too expensive' },
  { id: 'rusty', label: 'Felt rusty' },
  { id: 'motivation', label: 'Lost motivation' },
  { id: 'other', label: 'Other' },
]

export const NOTIFY_OPTIONS: { id: NotifyPref; label: string }[] = [
  { id: 'buddies-flex', label: 'Buddy invites & Flex reminders only' },
  { id: 'sessions', label: 'Session reminders only' },
  { id: 'gentle', label: 'A gentle note now and then' },
  { id: 'paused', label: 'Paused for now' },
]

export const DAYS: { id: DayBucket; label: string }[] = [
  { id: 'mon-wed', label: 'Mon–Wed' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'weekends', label: 'Weekends' },
]

export const DISTANCES: { id: string; label: string; value: number | null }[] = [
  { id: '1', label: '< 1 km', value: 1 },
  { id: '2', label: '< 2 km', value: 2 },
  { id: '5', label: '< 5 km', value: 5 },
  { id: 'any', label: 'Any', value: null },
]

export const ACHIEVEMENT_DEFS: { id: string; title: string; detail: string }[] = [
  { id: 'first-game', title: 'First Game Back', detail: 'Ready to unlock' },
  { id: 'first-buddy', title: 'First Buddy Match', detail: 'Play with someone' },
  { id: 'three-sessions', title: '3 Sessions Done', detail: 'Three easy hours' },
  { id: 'two-weeks', title: '2 Wks Consistent', detail: 'Show up two weeks running' },
]

export function levelFilterLabel(id: SkillLevel): string {
  if (id === 'starting') return 'Beginner / Starting again'
  if (id === 'recreational') return 'Recreational'
  if (id === 'intermediate') return 'Intermediate'
  return 'Advanced'
}

export function barrierProfileLabel(id: BarrierId, role: string, maxPrice = 5): string {
  if (id === 'busy') return /student/i.test(role) ? 'University schedule' : 'Busy schedule'
  if (id === 'partner') return 'Lost regular partner'
  if (id === 'expensive') {
    const shown = Number.isInteger(maxPrice) ? String(maxPrice) : maxPrice.toFixed(2)
    return `Under £${shown} budget`
  }
  if (id === 'rusty') return 'Feeling rusty'
  if (id === 'motivation') return 'Lost motivation'
  return 'Something else'
}

export function barrierHelp(id: BarrierId): string {
  switch (id) {
    case 'busy':
      return 'Flex Session lets you move a booking, or keep a 15-minute version when the timetable shifts.'
    case 'partner':
      return 'Sport Buddy introduces people who want a relaxed game, not a trial.'
    case 'expensive':
      return 'Prices are shown up front, and local sessions are chosen around your budget.'
    case 'rusty':
      return 'Know Before You Go walks you through the door, the host, and the first ten minutes.'
    case 'motivation':
      return 'Small Wins notices consistency. There are no leaderboards and no calorie counters.'
    default:
      return 'Your plan stays editable, so it can keep fitting real life.'
  }
}
