import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useSessions } from '@/hooks/useSessions'
import { useTeamWellnessLogs } from '@/hooks/useWellnessLogs'
import { sessionTypeColor, localDateStr, cn } from '@/lib/utils'
import type { MorningLogData } from '@/types/database'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = current.getFullYear()
  const month = current.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const { data: sessions = [] } = useSessions(user?.team_id, { from, to })
  const { data: teamLogs = [] } = useTeamWellnessLogs(user?.team_id, { days: 30 })

  // Academic load: days where athletes have exams
  const examDays = new Set<string>()
  teamLogs
    .filter(l => l.log_type === 'morning' && (l.data as MorningLogData).exam_this_week)
    .forEach(l => { examDays.add(l.created_at.split('T')[0]) })

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

  const getSessionForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return sessions.find(s => s.date === dateStr)
  }

  const hasExams = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return examDays.has(dateStr)
  }

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const todayStr = localDateStr(today)
  const upcomingSessions = sessions
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Training Calendar</h1>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="font-bold text-slate-900">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {[
          { color: 'bg-blue-500', label: 'Erg' },
          { color: 'bg-cyan-500', label: 'Water' },
          { color: 'bg-purple-500', label: 'Weights' },
          { color: 'bg-green-500', label: 'Cross Training' },
          { color: 'bg-gray-400', label: 'Rest' },
          { color: 'bg-yellow-400', label: 'Academic Load' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn('w-2.5 h-2.5 rounded-full', color)} />
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2.5">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 border-b border-r border-slate-50" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const session = getSessionForDay(day)
            const examDay = hasExams(day)
            const today_ = isToday(day)

            return (
              <div
                key={day}
                className={cn(
                  'h-14 border-b border-r border-slate-50 p-1 cursor-pointer hover:bg-slate-50 transition-colors relative',
                  today_ && 'bg-blue-50'
                )}
                onClick={() => session && navigate(`/coach/session/${session.id}`)}
              >
                <div className={cn(
                  'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  today_ ? 'bg-[#1e3a5f] text-white' : 'text-slate-700'
                )}>
                  {day}
                </div>
                {session && (
                  <div className={cn('w-full h-1.5 rounded-full', sessionTypeColor(session.type))} />
                )}
                {examDay && !session && (
                  <div className="w-full h-1.5 rounded-full bg-yellow-400 mt-0.5" />
                )}
                {examDay && (
                  <BookOpen className="absolute top-1 right-1 h-2.5 w-2.5 text-yellow-500" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-900">Upcoming Sessions</h2>
        {upcomingSessions.map(session => (
          <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/coach/session/${session.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-12 rounded-full flex-shrink-0', sessionTypeColor(session.type))} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <Badge variant="secondary" className="text-xs">{session.type}</Badge>
                    <Badge variant={
                      session.intensity === 'High' || session.intensity === 'Race Pace' ? 'destructive' :
                      session.intensity === 'Moderate' ? 'warning' : 'success'
                    } className="text-xs">{session.intensity}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{session.main_set}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">{session.duration}min</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
