import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useApp } from './store/store'
import { Welcome } from './screens/Welcome'
import { Auth } from './screens/Auth'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Explore } from './screens/Explore'
import { Filters } from './screens/Filters'
import { SessionDetail } from './screens/SessionDetail'
import { KnowBefore } from './screens/KnowBefore'
import { Buddies } from './screens/Buddies'
import { BuddyProfile } from './screens/BuddyProfile'
import { Confirmation } from './screens/Confirmation'
import { MySessions } from './screens/MySessions'
import { Reschedule } from './screens/Reschedule'
import { CheckIn } from './screens/CheckIn'
import { Progress } from './screens/Progress'
import { Profile } from './screens/Profile'
import { Notifications } from './screens/Notifications'

function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (!user) return children
  if (!user.onboarded) return <Navigate to="/onboarding/sports" replace />
  return <Navigate to="/home" replace />
}

function RequireUser({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireReady({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboarded) return <Navigate to="/onboarding/sports" replace />
  return children
}

export default function App() {
  const { toast } = useApp()
  return (
    <div className="phone">
      <Routes>
        <Route path="/" element={<GuestOnly><Welcome /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><Auth mode="login" /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Auth mode="register" /></GuestOnly>} />
        <Route path="/onboarding/:step" element={<RequireUser><Onboarding /></RequireUser>} />
        <Route path="/home" element={<RequireReady><Home /></RequireReady>} />
        <Route path="/explore" element={<RequireReady><Explore /></RequireReady>} />
        <Route path="/filters" element={<RequireReady><Filters /></RequireReady>} />
        <Route path="/sessions/:id" element={<RequireReady><SessionDetail /></RequireReady>} />
        <Route path="/sessions/:id/prepare" element={<RequireReady><KnowBefore /></RequireReady>} />
        <Route path="/confirm/:bookingId" element={<RequireReady><Confirmation /></RequireReady>} />
        <Route path="/buddies" element={<RequireReady><Buddies /></RequireReady>} />
        <Route path="/buddies/:id" element={<RequireReady><BuddyProfile /></RequireReady>} />
        <Route path="/my-sessions" element={<RequireReady><MySessions /></RequireReady>} />
        <Route path="/reschedule/:bookingId" element={<RequireReady><Reschedule /></RequireReady>} />
        <Route path="/check-in/:bookingId" element={<RequireReady><CheckIn /></RequireReady>} />
        <Route path="/progress" element={<RequireReady><Progress /></RequireReady>} />
        <Route path="/profile" element={<RequireReady><Profile /></RequireReady>} />
        <Route path="/notifications" element={<RequireReady><Notifications /></RequireReady>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  )
}
