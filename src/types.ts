export type SportId = 'badminton' | 'football' | 'tennis' | 'basketball' | 'running' | 'swimming'

export type SkillLevel = 'starting' | 'recreational' | 'intermediate' | 'advanced'

export type BarrierId = 'busy' | 'partner' | 'expensive' | 'rusty' | 'motivation' | 'other'

export type TimePref = 'weekday-mornings' | 'weekday-evenings' | 'weekends' | 'flexible'

export type DayBucket = 'mon-wed' | 'thursday' | 'friday' | 'weekends'

export type NotifyPref = 'buddies-flex' | 'sessions' | 'gentle' | 'paused'

export type InviteStatus = 'pending' | 'accepted' | 'declined'

export interface Preferences {
  sports: SportId[]
  barriers: BarrierId[]
  barrierNote: string
  level: SkillLevel
  times: TimePref[]
  maxPrice: number
  maxDistance: number
  goal: string
  notifications: NotifyPref
}

export interface SessionSnapshot {
  sessionId: string
  name: string
  sport: SportId
  venue: string
  place: string
  startsAt: string
  endsAt: string
  minutes: number
  price: number
  courtFee: number
  equipmentFee: number
  equipmentIncluded: boolean
  equipmentNote: string
  hostId: string
  hostName: string
  distanceKm: number
  image: string
  levelLabel: string
  shortSession?: boolean
}

export interface Booking {
  id: string
  sessionId: string
  snapshot: SessionSnapshot
  status: 'upcoming' | 'completed' | 'cancelled'
  buddyId?: string
  createdAt: string
  completedAt?: string
  flexNote?: string
}

export interface Invitation {
  id: string
  buddyId: string
  sessionId: string
  status: InviteStatus
  message: string
  createdAt: string
  reason?: 'reply' | 'withdrawn' | 'cancelled'
}

export interface Feedback {
  id: string
  bookingId: string
  feeling: string
  enjoyed: string[]
  note: string
  createdAt: string
}

export interface Achievement {
  id: string
  title: string
  detail: string
  unlocked: boolean
  unlockedAt?: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
}

export interface UserStats {
  sessions: number
  minutes: number
  streak: number
  sports: number
  reflections: number
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  age: number
  role: string
  area: string
  avatar: string
  membership: string
  onboarded: boolean
  onboardingStep: number
  preferences: Preferences
  bookings: Booking[]
  invitations: Invitation[]
  feedback: Feedback[]
  notifications: AppNotification[]
  achievements: Achievement[]
  stats: UserStats
  weeklyGoal: number
  savedSessionIds: string[]
  joinedAt: string
}

export interface FilterState {
  query: string
  sports: SportId[]
  maxPrice: number
  equipmentOnly: boolean
  distance: number | null
  days: DayBucket[]
  levels: SkillLevel[]
  sort: 'recommended' | 'price' | 'distance' | 'soonest'
}

export interface BringItem {
  item: string
  provided?: boolean
}

export interface GuideStep {
  title: string
  body: string
}

export interface Venue {
  id: string
  name: string
  area: string
  entranceName: string
  entrance: string
}

export interface Host {
  id: string
  name: string
  role: string
  bio: string
  avatar: string
}

export interface Person {
  id: string
  name: string
  age: number
  avatar: string
  sports: SportId[]
  sportLabel: string
  level: SkillLevel
  levelLabel: string
  distanceKm: number
  compatibility: number
  intro: string
  quote: string
  availability: string
  times: TimePref[]
  previousPlay: string
  vibe: string
  progress: string
  verified: boolean
  returning: boolean
  breakNote?: string
  statusLine: string
  tags: string[]
  discoverable: boolean
  featureRank: number
}

export interface Session {
  id: string
  sport: SportId
  name: string
  venueId: string
  startsAt: string
  endsAt: string
  minutes: number
  distanceKm: number
  walkMins: number
  courtFee: number
  equipmentFee: number
  price: number
  equipmentIncluded: boolean
  equipmentNote: string
  courtLabel: string
  equipmentLabel: string
  level: SkillLevel
  levelLabel: string
  hostId: string
  atmosphere: string[]
  mood: string[]
  bring: BringItem[]
  whoFor: string[]
  welcomeNote: string
  steps: GuideStep[]
  guarantee: string
  attendeeIds: string[]
  players: number
  tags: string[]
  eyebrow?: string
  cardNote: string
  image: string
  rank: number
}
