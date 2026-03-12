import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Waves, Home, History, User, Bell,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { useUnreadAlertCount } from '@/hooks/useAlerts'
import { useUnreadMessageCount } from '@/hooks/useMessages'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import NotificationsPanel from '@/features/athlete/NotificationsPanel'

export default function AppShell() {
  const { user } = useAuthStore()
  const isCoach = user?.role === 'coach'
  const [showNotifications, setShowNotifications] = useState(false)

  const coachNav = [
    { to: '/coach',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/coach/roster',   label: 'Roster',    icon: Users },
    { to: '/coach/calendar', label: 'Calendar',  icon: Calendar },
    { to: '/coach/messages', label: 'Messages',  icon: MessageSquare },
    { to: '/coach/profile',  label: 'Profile',   icon: User },
  ]

  const athleteNav = [
    { to: '/athlete',          label: 'Today',    icon: Home, exact: true },
    { to: '/athlete/calendar', label: 'Calendar', icon: Calendar },
    { to: '/athlete/history',  label: 'History',  icon: History },
    { to: '/athlete/messages', label: 'Messages', icon: MessageSquare },
    { to: '/athlete/profile',  label: 'Profile',  icon: User },
  ]

  const nav = isCoach ? coachNav : athleteNav

  const unreadAlerts        = useUnreadAlertCount(isCoach ? user?.id : null)
  const unreadMessages      = useUnreadMessageCount(user?.id)
  const unreadNotifications = useUnreadNotificationCount()

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50">
      {/* Top bar */}
      <header className="bg-[#1e3a5f] text-white px-4 py-3 flex items-center justify-between safe-top sticky top-0 z-40">
        <Link to={isCoach ? '/coach' : '/athlete'} className="flex items-center gap-2">
          <Waves className="h-5 w-5" />
          <span className="font-black text-lg">RowIQ</span>
        </Link>
        <div className="flex items-center gap-3">
          {isCoach && unreadAlerts > 0 && (
            <Link to="/coach" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-xs text-red-300 font-semibold">{unreadAlerts} alerts</span>
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link
              to={isCoach ? '/coach/messages' : '/athlete/messages'}
              className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center hover:bg-orange-400 transition-colors"
            >
              {unreadMessages}
            </Link>
          )}

          {/* Notification bell — all users */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative hover:opacity-80 transition-opacity"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5 text-white/90" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          <Link
            to={isCoach ? '/coach/profile' : '/athlete/profile'}
            className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-white/30 transition-colors"
          >
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-40">
        <div className="flex">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-[#1e3a5f]' : 'text-slate-400'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                  <span className={isActive ? 'font-bold' : ''}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Notifications panel — all users */}
      <NotificationsPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  )
}
