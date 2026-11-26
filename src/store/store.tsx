import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import type { FilterState, Preferences, User } from '../types'
import { getPerson, getSession, shortSnapshot, snapshotFrom } from '../data/catalog'
import { filtersFromPrefs } from '../lib/filter'
import { createAlex, createBlankUser, deriveUser, suggestedGoal } from '../lib/user'
import { uid } from '../lib/format'
import { getWeatherForecast } from '../lib/weather/service'
import { collectWeatherNotifications } from '../lib/weather/notifications'

const STORAGE_KEY = 'back-in-play-v2'

interface Persisted {
  version: 2
  users: User[]
  currentUserId: string | null
}

type Action =
  | { type: 'set-current'; userId: string | null }
  | { type: 'upsert-user'; user: User }
  | { type: 'patch-user'; userId: string; patch: (user: User) => User }

function reducer(state: Persisted, action: Action): Persisted {
  if (action.type === 'set-current') return { ...state, currentUserId: action.userId }
  if (action.type === 'upsert-user') {
    const next = deriveUser(action.user)
    const exists = state.users.some((user) => user.id === next.id)
    return { ...state, users: exists ? state.users.map((user) => (user.id === next.id ? next : user)) : [...state.users, next] }
  }
  if (action.type === 'patch-user') {
    return {
      ...state,
      users: state.users.map((user) => (user.id === action.userId ? deriveUser(action.patch(user)) : user)),
    }
  }
  return state
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted
      if (parsed.version === 2 && Array.isArray(parsed.users) && parsed.users.length) {
        return { ...parsed, users: parsed.users.map((user) => deriveUser(user)) }
      }
    }
  } catch {
    /* seed a fresh comeback */
  }
  return { version: 2, users: [deriveUser(createAlex())], currentUserId: null }
}

interface RegisterInput {
  name: string
  email: string
  password: string
  age?: number
}

interface AppContextValue {
  user: User | null
  filters: FilterState
  setFilters: (patch: Partial<FilterState>) => void
  resetFilters: () => void
  toast: string | null
  notify: (message: string) => void
  login: (email: string, password: string) => string | null
  register: (input: RegisterInput) => string | null
  logout: () => void
  savePrefs: (prefs: Partial<Preferences>, step?: number) => void
  completeOnboarding: (prefs?: Partial<Preferences>) => void
  book: (sessionId: string, buddyId?: string) => string | null
  cancelBooking: (bookingId: string) => void
  moveBooking: (bookingId: string, startsAt: string, endsAt: string) => void
  transferBooking: (bookingId: string, sessionId: string) => void
  makeShort: (bookingId: string) => void
  completeBooking: (bookingId: string) => void
  checkIn: (bookingId: string, feeling: string, enjoyed: string[], note: string) => void
  sendInvite: (buddyId: string, sessionId: string, message?: string) => void
  withdrawInvite: (inviteId: string) => void
  updateProfile: (patch: Partial<Pick<User, 'name' | 'age' | 'area' | 'role' | 'avatar'>>) => void
  setWeeklyGoal: (goal: number) => void
  markNotificationsRead: () => void
  toggleSave: (sessionId: string) => void
  persistBudget: (maxPrice: number, maxDistance: number) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [filters, setFiltersState] = useState<FilterState>({
    query: '',
    sports: [],
    maxPrice: 5,
    equipmentOnly: false,
    distance: null,
    days: [],
    levels: [],
    sort: 'recommended',
  })
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const inviteTimers = useRef<number[]>([])

  const user = state.users.find((item) => item.id === state.currentUserId) ?? null

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => () => {
    inviteTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const weatherSyncKey = user
    ? `${user.id}|${user.area}|${user.bookings.map((booking) => `${booking.id}:${booking.sessionId}:${booking.snapshot.startsAt}:${booking.snapshot.setting}`).join(',')}`
    : ''

  useEffect(() => {
    if (!user || !weatherSyncKey) return
    let cancelled = false
    const userId = user.id
    const area = user.area
    const bookings = user.bookings
    const syncWeatherNotes = async () => {
      const snapshotUser = { ...user, bookings }
      try {
        const forecast = await getWeatherForecast(area)
        if (cancelled) return
        const notes = collectWeatherNotifications(snapshotUser, forecast, false)
        if (!notes.length) return
        dispatch({
          type: 'patch-user',
          userId,
          patch: (current) => ({
            ...current,
            notifications: [...notes, ...current.notifications],
          }),
        })
      } catch {
        if (cancelled) return
        const notes = collectWeatherNotifications(snapshotUser, null, true)
        if (!notes.length) return
        dispatch({
          type: 'patch-user',
          userId,
          patch: (current) => ({
            ...current,
            notifications: [...notes, ...current.notifications],
          }),
        })
      }
    }
    void syncWeatherNotes()
    const timer = window.setInterval(() => void syncWeatherNotes(), 30 * 60 * 1000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [weatherSyncKey])

  const notify = (message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }

  const setFilters = (patch: Partial<FilterState>) => setFiltersState((current) => ({ ...current, ...patch }))

  const resetFilters = () => {
    if (user) setFiltersState(filtersFromPrefs(user.preferences))
  }

  const patch = (userId: string, fn: (person: User) => User) => dispatch({ type: 'patch-user', userId, patch: fn })

  const login = (email: string, password: string) => {
    const found = state.users.find((item) => item.email === email.trim().toLowerCase())
    if (!found || found.password !== password) return 'Those details do not match. Try again, or create an account.'
    dispatch({ type: 'set-current', userId: found.id })
    setFiltersState(filtersFromPrefs(found.preferences))
    return null
  }

  const register = (input: RegisterInput) => {
    const email = input.email.trim().toLowerCase()
    if (state.users.some((item) => item.email === email)) return 'That email already has a comeback. Log in instead.'
    const age = input.age && input.age > 0 ? input.age : 21
    const next = createBlankUser({ name: input.name, email, password: input.password, age })
    dispatch({ type: 'upsert-user', user: next })
    dispatch({ type: 'set-current', userId: next.id })
    setFiltersState(filtersFromPrefs(next.preferences))
    return null
  }

  const logout = () => {
    dispatch({ type: 'set-current', userId: null })
    notify('Signed out. See you when you are ready.')
  }

  const savePrefs = (prefs: Partial<Preferences>, step?: number) => {
    if (!user) return
    patch(user.id, (current) => ({
      ...current,
      onboardingStep: step ?? current.onboardingStep,
      preferences: { ...current.preferences, ...prefs },
    }))
  }

  const completeOnboarding = (prefs?: Partial<Preferences>) => {
    if (!user) return
    const merged = { ...user.preferences, ...prefs }
    const preferences = { ...merged, goal: merged.goal || suggestedGoal(merged), maxPrice: merged.maxPrice || 5 }
    patch(user.id, (current) => ({
      ...current,
      onboarded: true,
      onboardingStep: 3,
      preferences: { ...current.preferences, ...preferences },
      notifications: [
        {
          id: uid('note'),
          title: 'Your plan is saved',
          body: 'Recommendations, buddies, and Flex all follow what you just told us.',
          createdAt: new Date().toISOString(),
          read: false,
          href: '/home',
        },
        ...current.notifications,
      ],
    }))
    setFiltersState(filtersFromPrefs(preferences))
  }

  const book = (sessionId: string, buddyId?: string) => {
    if (!user) return null
    const existing = user.bookings.find((booking) => booking.sessionId === sessionId && booking.status === 'upcoming')
    if (existing) {
      if (buddyId && existing.buddyId !== buddyId) {
        patch(user.id, (current) => ({
          ...current,
          bookings: current.bookings.map((booking) => (booking.id === existing.id ? { ...booking, buddyId: booking.buddyId ?? buddyId } : booking)),
        }))
      }
      return existing.id
    }
    const session = getSession(sessionId)
    if (!session) return null
    const id = uid('bk')
    patch(user.id, (current) => ({
      ...current,
      bookings: [
        {
          id,
          sessionId,
          snapshot: snapshotFrom(session),
          status: 'upcoming' as const,
          buddyId,
          createdAt: new Date().toISOString(),
        },
        ...current.bookings,
      ],
    }))
    return id
  }

  const cancelBooking = (bookingId: string) => {
    if (!user) return
    const booking = user.bookings.find((item) => item.id === bookingId)
    if (!booking) return
    patch(user.id, (current) => ({
      ...current,
      bookings: current.bookings.map((item) => (item.id === bookingId ? { ...item, status: 'cancelled' as const } : item)),
      invitations: current.invitations.map((invite) =>
        invite.sessionId === booking.sessionId && invite.status === 'pending' ? { ...invite, status: 'declined' as const, reason: 'cancelled' as const } : invite,
      ),
    }))
    notify('Booking cancelled. Your refund or flex credit is ready whenever you are.')
  }

  const moveBooking = (bookingId: string, startsAt: string, endsAt: string) => {
    if (!user) return
    patch(user.id, (current) => ({
      ...current,
      bookings: current.bookings.map((booking) => {
        if (booking.id !== bookingId) return booking
        const minutes = Math.max(15, Math.round((+new Date(endsAt) - +new Date(startsAt)) / 60000))
        return { ...booking, snapshot: { ...booking.snapshot, startsAt, endsAt, minutes, shortSession: false }, flexNote: 'Moved to a new time. Same welcome, same price.' }
      }),
    }))
    notify('Session moved. Sarah still has you down.')
  }

  const transferBooking = (bookingId: string, sessionId: string) => {
    if (!user) return
    const session = getSession(sessionId)
    if (!session) return
    patch(user.id, (current) => ({
      ...current,
      bookings: current.bookings.map((booking) => {
        if (booking.id !== bookingId) return booking
        const credit = booking.snapshot.price
        const due = Math.max(0, Math.round((session.price - credit) * 100) / 100)
        return {
          ...booking,
          sessionId,
          snapshot: snapshotFrom(session, { price: due }),
          flexNote: due === 0 ? `Your £${credit.toFixed(2)} credit covers this.` : `£${credit.toFixed(2)} credit applied. £${due.toFixed(2)} left to pay.`,
        }
      }),
    }))
    notify('Booking transferred. Your credit came with you.')
  }

  const makeShort = (bookingId: string) => {
    if (!user) return
    patch(user.id, (current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, sessionId: 'short-reset', snapshot: shortSnapshot(booking.snapshot), flexNote: '15-minute reset. It still counts.' }
          : booking,
      ),
    }))
    notify('Switched to a 15-minute reset. Showing up still counts.')
  }

  const completeBooking = (bookingId: string) => {
    if (!user) return
    patch(user.id, (current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: 'completed' as const, completedAt: new Date().toISOString() } : booking,
      ),
    }))
  }

  const checkIn = (bookingId: string, feeling: string, enjoyed: string[], note: string) => {
    if (!user) return
    if (user.feedback.some((item) => item.bookingId === bookingId)) {
      notify('That check-in is already saved privately.')
      return
    }
    patch(user.id, (current) => ({
      ...current,
      feedback: [
        { id: uid('fb'), bookingId, feeling, enjoyed, note: note.trim(), createdAt: new Date().toISOString() },
        ...current.feedback,
      ],
    }))
    notify('Saved privately in your Small Wins journal.')
  }

  const sendInvite = (buddyId: string, sessionId: string, message?: string) => {
    if (!user) return
    const person = getPerson(buddyId)
    if (!person) return
    const existing = user.invitations.find((invite) => invite.buddyId === buddyId && invite.sessionId === sessionId && invite.status !== 'declined')
    if (existing) {
      if (message) {
        patch(user.id, (current) => ({
          ...current,
          invitations: current.invitations.map((invite) => (invite.id === existing.id ? { ...invite, message } : invite)),
        }))
        notify(`Message sent to ${person.name}.`)
      } else {
        notify(`Invite to ${person.name} is already ${existing.status}.`)
      }
      return
    }
    const inviteId = uid('inv')
    const bookingId = book(sessionId, buddyId)
    void bookingId
    patch(user.id, (current) => ({
      ...current,
      invitations: [
        { id: inviteId, buddyId, sessionId, status: 'pending' as const, message: message ?? '', createdAt: new Date().toISOString() },
        ...current.invitations,
      ],
      bookings: current.bookings.map((booking) =>
        booking.sessionId === sessionId && booking.status === 'upcoming' && !booking.buddyId ? { ...booking, buddyId } : booking,
      ),
      notifications: [
        {
          id: uid('note'),
          title: `Invite sent to ${person.name}`,
          body: 'We will let you know when they reply. Your spot is held either way.',
          createdAt: new Date().toISOString(),
          read: false,
          href: `/buddies/${buddyId}`,
        },
        ...current.notifications,
      ],
    }))
    notify(message ? `Message sent to ${person.name}.` : `Invitation sent to ${person.name}.`)
    const userId = user.id
    const timer = window.setTimeout(() => {
      const status = person.compatibility >= 90 ? 'accepted' : 'declined'
      patch(userId, (current) => {
        const invite = current.invitations.find((item) => item.id === inviteId)
        if (!invite || invite.status !== 'pending') return current
        const accepted = status === 'accepted'
        return {
          ...current,
          invitations: current.invitations.map((item) => (item.id === inviteId ? { ...item, status, reason: 'reply' as const } : item)),
          bookings: current.bookings.map((booking) =>
            booking.sessionId === sessionId && booking.status === 'upcoming' && accepted ? { ...booking, buddyId } : booking,
          ),
          notifications: [
            {
              id: uid('note'),
              title: accepted ? `${person.name} is in` : `${person.name} can't make this one`,
              body: accepted
                ? 'Come as you are. They are looking forward to an easy session too.'
                : "No stress — their week filled up. The session is still yours, and other people are coming back too.",
              createdAt: new Date().toISOString(),
              read: false,
              href: `/buddies/${buddyId}`,
            },
            ...current.notifications,
          ],
        }
      })
    }, 1700)
    inviteTimers.current.push(timer)
  }

  const withdrawInvite = (inviteId: string) => {
    if (!user) return
    patch(user.id, (current) => ({
      ...current,
      invitations: current.invitations.map((invite) =>
        invite.id === inviteId ? { ...invite, status: 'declined' as const, reason: 'withdrawn' as const } : invite,
      ),
    }))
    notify('Invitation withdrawn. No one is left waiting.')
  }

  const updateProfile = (profile: Partial<Pick<User, 'name' | 'age' | 'area' | 'role' | 'avatar'>>) => {
    if (!user) return
    patch(user.id, (current) => ({ ...current, ...profile }))
    notify('Profile updated.')
  }

  const setWeeklyGoal = (goal: number) => {
    if (!user) return
    patch(user.id, (current) => ({ ...current, weeklyGoal: goal }))
    notify(`Weekly goal set to ${goal} session${goal === 1 ? '' : 's'}.`)
  }

  const markNotificationsRead = () => {
    if (!user) return
    patch(user.id, (current) => ({ ...current, notifications: current.notifications.map((item) => ({ ...item, read: true })) }))
  }

  const toggleSave = (sessionId: string) => {
    if (!user) return
    const saved = user.savedSessionIds.includes(sessionId)
    patch(user.id, (current) => ({
      ...current,
      savedSessionIds: saved ? current.savedSessionIds.filter((id) => id !== sessionId) : [...current.savedSessionIds, sessionId],
    }))
    notify(saved ? 'Removed from saved sessions.' : 'Saved for later.')
  }

  const persistBudget = (maxPrice: number, maxDistance: number) => {
    if (!user) return
    patch(user.id, (current) => ({ ...current, preferences: { ...current.preferences, maxPrice, maxDistance } }))
    setFilters({ maxPrice, distance: maxDistance >= 5 ? null : maxDistance })
  }

  const value: AppContextValue = {
    user,
    filters,
    setFilters,
    resetFilters,
    toast,
    notify,
    login,
    register,
    logout,
    savePrefs,
    completeOnboarding,
    book,
    cancelBooking,
    moveBooking,
    transferBooking,
    makeShort,
    completeBooking,
    checkIn,
    sendInvite,
    withdrawInvite,
    updateProfile,
    setWeeklyGoal,
    markNotificationsRead,
    toggleSave,
    persistBudget,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
