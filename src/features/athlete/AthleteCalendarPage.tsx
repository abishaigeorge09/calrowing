import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useSessions } from '@/hooks/useSessions'
import { sessionTypeColor, cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function AthleteCalendarPage() {
  const { user } = useAuthStore()
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<number | null>(today.getDate())

  const year = current.getFullYear()
  const month = current.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const { data: sessions = [] } = useSessions(user?.team_id, { from, to })

  const getSession = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return sessions.find(s => s.date === dateStr)
  }

  const selectedSession = selected ? getSession(selected) : null
  const selectedDate = selected
    ? new Date(year, month, selected).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Training Calendar</h1>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="font-bold text-slate-900">{MONTHS[month]} {year}</h2>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {['Erg', 'Water', 'Weights', 'Cross Training', 'Rest'].map(type => (
          <div key={type} className="flex items-center gap-1">
            <div className={cn('w-2.5 h-2.5 rounded-full', sessionTypeColor(type))} />
            <span className="text-slate-500">{type}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="h-14 border-b border-r border-slate-50" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const session = getSession(day)
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const isSelected = selected === day

            return (
              <div
                key={day}
                onClick={() => setSelected(day)}
                className={cn(
                  'h-14 border-b border-r border-slate-50 p-1 cursor-pointer transition-colors',
                  isSelected ? 'bg-[#1e3a5f]/10' : isToday ? 'bg-blue-50' : 'hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  isSelected ? 'bg-[#1e3a5f] text-white' : isToday ? 'bg-blue-200 text-[#1e3a5f]' : 'text-slate-700'
                )}>
                  {day}
                </div>
                {session && (
                  <div className={cn('w-full h-1.5 rounded-full', sessionTypeColor(session.type))} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selected && (
        <Card>
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 text-sm mb-3">{selectedDate}</p>
            {selectedSession ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold text-white', sessionTypeColor(selectedSession.type))}>
                    {selectedSession.type}
                  </span>
                  <Badge variant="secondary">{selectedSession.intensity}</Badge>
                  <Badge variant="outline">{selectedSession.duration}min</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Main Set</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedSession.main_set}</p>
                </div>
                {selectedSession.warmup && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Warmup</p>
                    <p className="text-sm text-slate-700">{selectedSession.warmup}</p>
                  </div>
                )}
                {selectedSession.target_split && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-500">Split: <strong>{selectedSession.target_split}</strong></span>
                    {selectedSession.stroke_rate && (
                      <span className="text-slate-500">Rate: <strong>r{selectedSession.stroke_rate}</strong></span>
                    )}
                  </div>
                )}
                {selectedSession.is_notes_public && selectedSession.coach_notes && (
                  <div className="bg-[#1e3a5f]/5 rounded-xl p-3">
                    <p className="text-xs font-semibold text-[#1e3a5f] mb-1">Coach's Note</p>
                    <p className="text-sm italic text-slate-700">"{selectedSession.coach_notes}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No session scheduled</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
