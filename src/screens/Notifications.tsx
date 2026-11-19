import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Shell, TopBar, useTitle } from '../components/ui'
import { useApp } from '../store/store'

export function Notifications() {
  useTitle('Notifications')
  const { user, markNotificationsRead } = useApp()
  const navigate = useNavigate()
  useEffect(() => { markNotificationsRead() }, [])
  if (!user) return null
  return (
    <Shell>
      <TopBar back={() => navigate(-1)} title="Notifications" />
      <div className="stack">
        {user.notifications.length === 0 && <p className="tiny">Nothing waiting. We’ll only nudge you about buddies, flex, and sessions you asked for.</p>}
        {user.notifications.map((item) => (
          <Link key={item.id} to={item.href || '/home'} className="card pad stack">
            <b>{item.title}</b>
            <p className="tiny">{item.body}</p>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
