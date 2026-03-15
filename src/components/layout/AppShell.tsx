import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  Hexagon, Home, History, User, Bell, ClipboardList,
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
    { to: '/coach',           label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/coach/roster',    label: 'Roster',    icon: Users },
    { to: '/coach/calendar',  label: 'Calendar',  icon: Calendar },
    { to: '/coach/surveys',   label: 'Surveys',   icon: ClipboardList },
    { to: '/coach/messages',  label: 'Messages',  icon: MessageSquare },
    { to: '/coach/profile',   label: 'Profile',   icon: User },
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
    <div className="flex flex-col min-h-dvh bg-black text-white selection:bg-white/20">
      {/* Background ambient light */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      {/* Top bar */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 text-white px-4 py-3 flex items-center justify-between safe-top sticky top-0 z-40 relative">
        <Link to={isCoach ? '/coach' : '/athlete'} className="flex items-center gap-2 group">
          <Hexagon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <span className="font-bold text-lg tracking-widest uppercase">RowIQ</span>
        </Link>
        <div className="flex items-center gap-3">
          {isCoach && unreadAlerts > 0 && (
            <Link to="/coach" className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 px-2.5 py-1 rounded-full hover:bg-red-900/50 transition-colors">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              <span className="text-xs text-red-200 font-semibold tracking-wide">{unreadAlerts} alerts</span>
            </Link>
          )}
          {unreadMessages > 0 && (
            <Link
              to={isCoach ? '/coach/messages' : '/athlete/messages'}
              className="bg-white text-black text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              {unreadMessages}
            </Link>
          )}

          {/* Notification bell — all users */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-white/10"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5 text-gray-300" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-0.5 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none ring-2 ring-black">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          <Link
            to={isCoach ? '/coach/profile' : '/athlete/profile'}
            className="bg-white/10 border border-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-all uppercase tracking-widest text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]"
          >
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 safe-bottom z-40">
        <div className="flex max-w-lg mx-auto w-full relative">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 relative',
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Glow */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] rounded-b-full"></div>
                  )}
                  <span className="relative">
                    <Icon className={cn('h-5 w-5 transition-transform duration-300', isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : '')} strokeWidth={isActive ? 2 : 1.5} />
                    {label === 'Messages' && unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </span>
                  <span className={isActive ? 'opacity-100' : 'opacity-70'}>{label}</span>
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
