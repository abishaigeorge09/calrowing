import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X, Sunrise, Dumbbell, Moon, AlertTriangle, Info, Hexagon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

function notificationIcon(type: string) {
  switch (type) {
    case 'morning_reminder':      return <Sunrise className="h-4 w-4 text-amber-500 drop-shadow-[0_0_5px_currentColor]" />
    case 'post_session_reminder': return <Dumbbell className="h-4 w-4 text-blue-500 drop-shadow-[0_0_5px_currentColor]" />
    case 'evening_reminder':      return <Moon className="h-4 w-4 text-indigo-500 drop-shadow-[0_0_5px_currentColor]" />
    case 'alert_soreness':
    case 'alert_sleep':
    case 'alert_injury':          return <AlertTriangle className="h-4 w-4 text-red-500 drop-shadow-[0_0_5px_currentColor]" />
    default:                      return <Info className="h-4 w-4 text-gray-400 drop-shadow-[0_0_5px_currentColor]" />
  }
}

export default function NotificationsPanel({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter(n => !n.read_at).length

  const handleTap = (n: Notification) => {
    if (!n.read_at) markRead.mutate(n.id)
    if (n.action_url) {
      navigate(n.action_url)
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: 9999 }}
        onClick={onClose}
      />

      {/* Slide-up panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-300" style={{ zIndex: 10000 }}>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/5 blur-[40px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 relative z-10 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner">
              <Bell className="h-5 w-5 text-gray-300" />
            </div>
            <div>
              <p className="font-black text-white text-base tracking-widest uppercase mb-0.5">Communications</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {unreadCount > 0 ? (
                  <span className="text-red-400">{unreadCount} Pending Alerts</span>
                ) : 'System clear'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Acknowledge All</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white transition-colors shadow-inner">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto relative z-10">
          {isLoading && (
            <div className="py-12 text-center text-gray-500 text-[10px] font-bold uppercase tracking-widest">Fetching comms…</div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <Hexagon className="h-10 w-10 mx-auto text-white/20 mb-2" />
              <p className="font-black text-gray-300 uppercase tracking-widest text-sm">Channel Secure</p>
              <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">No active alerts broadcast on network.</p>
            </div>
          )}

          {notifications.map(n => {
            const isUnread = !n.read_at
            return (
              <button
                key={n.id}
                onClick={() => handleTap(n)}
                className={cn(
                  'w-full flex items-start gap-4 px-6 py-5 border-b border-white/5 text-left transition-all',
                  isUnread ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5 bg-transparent'
                )}
              >
                {/* Type icon */}
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-inner',
                  isUnread ? 'bg-white/10 border-white/20' : 'bg-black/50 border-white/5'
                )}>
                  {notificationIcon(n.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className={cn(
                      'text-xs tracking-wide uppercase', 
                      isUnread ? 'font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'font-bold text-gray-400'
                    )}>
                      {n.title}
                    </p>
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex-shrink-0 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true }).replace('about ', '')}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs leading-relaxed',
                    isUnread ? 'text-gray-300' : 'text-gray-500'
                  )}>{n.body}</p>
                </div>

                {/* Unread indicator */}
                {isUnread && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Safe bottom padding */}
        <div className="h-safe-bottom bg-black pb-4 border-t border-white/10" />
      </div>
    </>
  )
}
