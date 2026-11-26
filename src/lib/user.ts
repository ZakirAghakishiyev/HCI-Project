import type { Achievement, Booking, Preferences, SportId, User, UserStats } from '../types'
import { ACHIEVEMENT_DEFS } from '../data/options'
import { getPerson, sessions, snapshotFrom } from '../data/catalog'
import { computeStreak, onWeekday, weekId } from './dates'
import { dayMonth, sportLabel, uid } from './format'

export function blankPrefs(): Preferences {
  return {
    sports: [],
    barriers: [],
    barrierNote: '',
    level: 'recreational',
    times: [],
    maxPrice: 5,
    maxDistance: 2,
    goal: '',
    notifications: 'buddies-flex',
  }
}

export function suggestedGoal(prefs: Preferences): string {
  const sport = prefs.sports[0] ? sportLabel(prefs.sports[0]).toLowerCase() : 'sport'
  const tone = prefs.level === 'starting' ? 'easy' : prefs.level === 'advanced' ? 'social' : 'recreational'
  return `Play 1 ${tone} ${sport} session each week, without guilt or competitive stress.`
}

export function emptyStats(): UserStats {
  return { sessions: 0, minutes: 0, streak: 0, sports: 0, reflections: 0 }
}

function completed(user: User): Booking[] {
  return user.bookings.filter((booking) => booking.status === 'completed')
}

function describe(id: string, user: User): string {
  if (id === 'first-game') {
    const first = completed(user).slice().sort((a, b) => +new Date(a.snapshot.startsAt) - +new Date(b.snapshot.startsAt))[0]
    return first ? `Unlocked ${dayMonth(new Date(first.snapshot.startsAt))}` : 'Unlocked'
  }
  if (id === 'first-buddy') {
    const played = completed(user).find((booking) => booking.buddyId)
    const accepted = user.invitations.find((invite) => invite.status === 'accepted')
    const name = played?.buddyId ? getPerson(played.buddyId)?.name : accepted ? getPerson(accepted.buddyId)?.name : undefined
    if (played && name) return `Played with ${name}`
    if (name) return `Matched with ${name}`
    return 'You found someone to play with'
  }
  if (id === 'three-sessions') return 'Milestone hit'
  if (id === 'two-weeks') return 'Habit established'
  return 'Unlocked'
}

function isUnlocked(id: string, user: User, stats: UserStats): boolean {
  if (id === 'first-game') return stats.sessions >= 1
  if (id === 'three-sessions') return stats.sessions >= 3
  if (id === 'two-weeks') return stats.streak >= 2
  if (id === 'first-buddy') {
    return completed(user).some((booking) => booking.buddyId) || user.invitations.some((invite) => invite.status === 'accepted')
  }
  return false
}

export function deriveUser(user: User): User {
  const done = completed(user)
  const sports = new Set(done.map((booking) => booking.snapshot.sport))
  const stats: UserStats = {
    sessions: done.length,
    minutes: done.reduce((sum, booking) => sum + booking.snapshot.minutes, 0),
    streak: computeStreak(done.map((booking) => new Date(booking.snapshot.startsAt))),
    sports: sports.size,
    reflections: user.feedback.length,
  }
  const achievements: Achievement[] = ACHIEVEMENT_DEFS.map((def) => {
    const prev = user.achievements.find((item) => item.id === def.id)
    const unlocked = isUnlocked(def.id, user, stats)
    if (!unlocked) return { id: def.id, title: def.title, detail: def.detail, unlocked: false }
    return {
      id: def.id,
      title: def.title,
      unlocked: true,
      unlockedAt: prev?.unlocked ? prev.unlockedAt : new Date().toISOString(),
      detail: prev?.unlocked ? prev.detail : describe(def.id, user),
    }
  })
  const bookings = user.bookings.map((booking) => {
    const live = sessions.find((session) => session.id === booking.sessionId)
    if (!live) {
      return {
        ...booking,
        snapshot: {
          ...booking.snapshot,
          setting: booking.snapshot.setting ?? 'indoor',
          level: booking.snapshot.level ?? 'recreational',
        },
      }
    }
    return {
      ...booking,
      snapshot: {
        ...booking.snapshot,
        setting: booking.snapshot.setting ?? live.setting,
        level: booking.snapshot.level ?? live.level,
      },
    }
  })
  return { ...user, bookings, stats, achievements }
}

export function journeyStage(user: User): 1 | 2 | 3 {
  const upcoming = user.bookings.some((booking) => booking.status === 'upcoming')
  const buddy = user.invitations.some((invite) => invite.status === 'pending' || invite.status === 'accepted')
  if (!upcoming) return 1
  if (!buddy) return 2
  return 3
}

export function upcomingOf(user: User): Booking[] {
  return user.bookings
    .filter((booking) => booking.status === 'upcoming')
    .sort((a, b) => +new Date(a.snapshot.startsAt) - +new Date(b.snapshot.startsAt))
}

export function completedOf(user: User): Booking[] {
  return user.bookings
    .filter((booking) => booking.status === 'completed')
    .sort((a, b) => +new Date(b.snapshot.startsAt) - +new Date(a.snapshot.startsAt))
}

export function completedThisWeek(user: User): number {
  const current = weekId(new Date())
  return completed(user).filter((booking) => weekId(new Date(booking.snapshot.startsAt)) === current).length
}

export function weekMarks(user: User): { key: string; label: string; done: boolean; planned: boolean; today: boolean }[] {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const start = new Date()
  const mondayOffset = (start.getDay() + 6) % 7
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - mondayOffset)
  const doneDays = new Set(
    completed(user)
      .filter((booking) => weekId(new Date(booking.snapshot.startsAt)) === weekId(new Date()))
      .map((booking) => new Date(booking.snapshot.startsAt).getDay()),
  )
  const plannedDays = new Set(
    upcomingOf(user).filter((booking) => weekId(new Date(booking.snapshot.startsAt)) === weekId(new Date())).map((booking) => new Date(booking.snapshot.startsAt).getDay()),
  )
  return labels.map((label, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const dow = date.getDay()
    const today = new Date().toDateString() === date.toDateString()
    return { key: `${label}-${index}`, label, done: doneDays.has(dow), planned: plannedDays.has(dow), today }
  })
}

function pastBooking(id: string, sessionId: string, when: Date, minutes: number, buddyId?: string): Booking {
  const session = sessions.find((item) => item.id === sessionId) ?? sessions[0]
  const end = new Date(when.getTime() + minutes * 60000)
  return {
    id,
    sessionId: session.id,
    snapshot: snapshotFrom(session, {
      startsAt: when.toISOString(),
      endsAt: end.toISOString(),
      minutes,
    }),
    status: 'completed',
    buddyId,
    createdAt: when.toISOString(),
    completedAt: end.toISOString(),
  }
}

export function createBlankUser(input: { name: string; email: string; password: string; age: number }): User {
  return {
    id: uid('user'),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    age: input.age,
    role: 'University Student',
    area: 'Central Campus',
    avatar: '',
    membership: 'Active Member',
    onboarded: false,
    onboardingStep: 1,
    preferences: blankPrefs(),
    bookings: [],
    invitations: [],
    feedback: [],
    notifications: [
      {
        id: uid('note'),
        title: 'Welcome in',
        body: 'Choose a sport you used to enjoy. We will keep the first step small.',
        createdAt: new Date().toISOString(),
        read: false,
        href: '/onboarding/sports',
      },
    ],
    achievements: ACHIEVEMENT_DEFS.map((item) => ({ ...item, unlocked: false })),
    stats: emptyStats(),
    weeklyGoal: 1,
    savedSessionIds: [],
    joinedAt: new Date().toISOString(),
  }
}

export function createAlex(): User {
  const outdoor = sessions.find((session) => session.id === 'badminton-outdoor') ?? sessions[0]
  const indoor = sessions.find((session) => session.id === 'badminton-beginner') ?? sessions[0]
  const tuesday = onWeekday(0, 2, 18)
  const lastMonday = onWeekday(1, 1, 18)
  const lastWednesday = onWeekday(1, 3, 11)
  const upcomingSnap = snapshotFrom(outdoor)
  const user: User = {
    id: 'user-alex',
    name: 'Alex Turner',
    email: 'alex@university.ac.uk',
    password: 'comeback',
    age: 23,
    role: 'University Student',
    area: 'Central Campus',
    avatar: '/images/alex.jpg',
    membership: 'Active Member',
    onboarded: true,
    onboardingStep: 3,
    preferences: {
      sports: ['badminton'],
      barriers: ['busy', 'partner', 'expensive'],
      barrierNote: '',
      level: 'recreational',
      times: ['weekday-evenings'],
      maxPrice: 5,
      maxDistance: 2,
      goal: 'Play 1 recreational badminton session each week, without guilt or competitive stress.',
      notifications: 'buddies-flex',
    },
    bookings: [
      {
        id: 'bk-next',
        sessionId: outdoor.id,
        snapshot: upcomingSnap,
        status: 'upcoming',
        buddyId: 'sam',
        createdAt: new Date().toISOString(),
      },
      pastBooking('bk-tue', indoor.id, tuesday, 45),
      pastBooking('bk-mon', indoor.id, lastMonday, 60, 'sam'),
      pastBooking('bk-wed', indoor.id, lastWednesday, 30),
    ],
    invitations: [
      {
        id: 'inv-sam',
        buddyId: 'sam',
        sessionId: outdoor.id,
        status: 'pending',
        message: '',
        createdAt: new Date().toISOString(),
      },
    ],
    feedback: [
      {
        id: 'fb-mon',
        bookingId: 'bk-mon',
        feeling: 'Really good',
        enjoyed: ['Meeting new people', 'Playing again'],
        note: 'Played doubles with Sam. Felt less rusty than I feared. Sarah was super welcoming.',
        createdAt: lastMonday.toISOString(),
      },
      {
        id: 'fb-wed',
        bookingId: 'bk-wed',
        feeling: 'It was okay',
        enjoyed: ['Being active'],
        note: 'Short on sleep, but glad I showed up.',
        createdAt: lastWednesday.toISOString(),
      },
    ],
    notifications: [
      {
        id: 'n1',
        title: 'Thursday is open',
        body: 'Outdoor badminton at 6 PM, rackets included, £4.50. Weather-smart tips will keep you dry.',
        createdAt: new Date().toISOString(),
        read: false,
        href: '/sessions/badminton-outdoor',
      },
      {
        id: 'n2',
        title: 'Sam can play Thursday',
        body: '96% match. Also coming back after a break, and free after 5:30.',
        createdAt: new Date().toISOString(),
        read: false,
        href: '/buddies/sam',
      },
      {
        id: 'n3',
        title: 'Flex is there if plans change',
        body: 'Move a booking, or take the 15-minute version. Consistency is not perfection.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        href: '/my-sessions',
      },
    ],
    achievements: ACHIEVEMENT_DEFS.map((item) => ({ ...item, unlocked: false })),
    stats: emptyStats(),
    weeklyGoal: 1,
    savedSessionIds: [],
    joinedAt: lastMonday.toISOString(),
  }
  return user
}

export function sportNoun(id: SportId): string {
  return sportLabel(id).toLowerCase()
}
