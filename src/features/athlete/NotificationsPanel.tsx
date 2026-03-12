import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X, Sunrise, Dumbbell, Moon, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    case 'morning_reminder':      return <Sunrise className="h-4 w-4 text-amber-500" />
    case 'post_session_reminder': return <Dumbbell className="h-4 w-4 text-blue-500" />
    case 'evening_reminder':      return <Moon className="h-4 w-4 text-indigo-500" />
    case 'alert_soreness':
    case 'alert_sleep':
    case 'alert_injury':          return <AlertTriangle className="h-4 w-4 text-red-500" />
    default:                      return <Info className="h-4 w-4 text-slate-400" />
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
        className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-up panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#1e3a5f]" />
            <h2 className="font-bold text-slate-900 text-base">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-slate-500 h-7 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <Bell className="h-10 w-10 mx-auto text-slate-200" />
              <p className="font-semibold text-slate-600">You're all caught up! 🎉</p>
              <p className="text-sm text-slate-400">No notifications right now.</p>
            </div>
          )}

          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleTap(n)}
              className={cn(
                'w-full flex items-start gap-3 px-5 py-4 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors',
                !n.read_at && 'bg-blue-50/50'
              )}
            >
              {/* Type icon */}
              <div className={cn(
                'mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                !n.read_at ? 'bg-blue-100' : 'bg-slate-100'
              )}>
                {notificationIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm leading-snug', !n.read_at ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.body}</p>
              </div>

              {/* Unread dot */}
              {!n.read_at && (
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
              )}
            </button>
          ))}
        </div>

        {/* Safe bottom padding */}
        <div className="h-safe-bottom bg-white pb-4" />
      </div>
    </>
  )
}
