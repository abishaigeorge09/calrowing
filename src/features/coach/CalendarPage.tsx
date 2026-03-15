import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BookOpen, Hexagon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useSessions } from '@/hooks/useSessions'
import { useTeamWellnessLogs } from '@/hooks/useWellnessLogs'
import { sessionTypeColor, localDateStr, cn } from '@/lib/utils'
import type { MorningLogData } from '@/types/database'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function typeToColor(type: string): string {
  switch(type) {
    case 'Erg': return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
    case 'Water': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
    case 'Weights': return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]'
    case 'Cross Training': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
    case 'Assessment':
    case 'Assessments': return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]'
    default: return 'bg-gray-400'
  }
}

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
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30) // next 30 days
  const futureTo = localDateStr(futureDate)

  const { data: allUpcoming = [] } = useSessions(user?.team_id, { from: todayStr, to: futureTo })

  const upcomingSessions = allUpcoming
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  return (
    <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> Team Schedule
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            Monthly Overview
          </p>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-black tracking-widest uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap bg-black/40 border border-white/5 rounded-2xl p-4 justify-center shadow-inner">
        {[
          { color: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]', label: 'Erg' },
          { color: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]', label: 'Water' },
          { color: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]', label: 'Weights' },
          { color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]', label: 'Cross' },
          { color: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]', label: 'Assessments' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', color)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/40">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] uppercase font-black tracking-widest text-gray-500 py-3">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 bg-black/20">
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 border-b border-r border-white/5" />
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
                  'h-16 border-b border-r border-white/5 p-1.5 cursor-pointer hover:bg-white/10 transition-colors relative group',
                  today_ ? 'bg-white/10 shadow-inner' : ''
                )}
                onClick={() => session && navigate(`/coach/session/${session.id}`)}
              >
                <div className={cn(
                  'text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 border',
                  today_ ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-gray-400 border-transparent group-hover:text-white'
                )}>
                  {day}
                </div>
                {session && (
                  <div className={cn('w-full h-1 rounded-full mt-1', typeToColor(session.type))} />
                )}
                {examDay && !session && (
                  <div className="w-full h-1 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] mt-1" />
                )}
                {examDay && (
                  <BookOpen className="absolute top-1.5 right-1.5 h-3 w-3 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                )}
              </div>
            )
          })}
          
          {/* Fill remaining cells */}
          {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-16 border-b border-r border-white/5" />
          ))}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4 pl-1">Upcoming Sessions</h2>

        {upcomingSessions.length === 0 ? (
          <p className="text-xs text-gray-500 italic px-4">No upcoming sessions scheduled.</p>
        ) : upcomingSessions.map(session => (
          <div 
            key={session.id} 
            className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] group text-left"
            onClick={() => navigate(`/coach/session/${session.id}`)}
          >
            <div className={cn('w-2 h-14 rounded-full flex-shrink-0', typeToColor(session.type))} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <p className="font-bold text-white text-sm tracking-wide">
                  {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex gap-1.5">
                  <span className="bg-white/10 border border-white/20 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">
                    {session.type}
                  </span>
                  <span className={cn(
                    'border text-[9px] uppercase font-bold px-1.5 py-0.5 rounded',
                    session.intensity === 'High' || session.intensity === 'Race Pace' ? 'bg-red-950/40 border-red-500/50 text-red-400' :
                    session.intensity === 'Moderate' ? 'bg-yellow-950/40 border-yellow-500/50 text-yellow-400' : 
                    'bg-green-950/40 border-green-500/50 text-green-400'
                  )}>
                    {session.intensity}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-light truncate">{session.main_set}</p>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-black text-white">{session.duration}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Min</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
