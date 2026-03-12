import { useState } from 'react'
import { ChevronLeft, ChevronRight, Hexagon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useSessions } from '@/hooks/useSessions'
import { sessionTypeColor, cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function typeToColor(type: string): string {
  switch(type) {
    case 'Erg': return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
    case 'Water': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
    case 'Weights': return 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]'
    case 'Cross Training': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
    default: return 'bg-gray-400'
  }
}

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
    <div className="px-4 py-8 space-y-6 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> Temporal Synchronization
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            Array Schedule
          </p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-black tracking-widest uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
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
          { color: 'bg-gray-400', label: 'Rest' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', color)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/40">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] uppercase font-black tracking-widest text-gray-500 py-3">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-black/20">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="h-16 border-b border-r border-white/5" />
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
                  'h-16 border-b border-r border-white/5 p-1.5 cursor-pointer transition-colors relative group',
                  isSelected ? 'bg-white/10 shadow-inner' : isToday ? 'bg-blue-900/40 shadow-inner' : 'hover:bg-white/5'
                )}
              >
                <div className={cn(
                  'text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 border transition-colors',
                  isSelected ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 
                  isToday ? 'bg-blue-500/30 text-blue-200 border-blue-500/50' : 
                  'text-gray-400 border-transparent group-hover:text-white'
                )}>
                  {day}
                </div>
                {session && (
                  <div className={cn('w-full h-1 rounded-full mt-1', typeToColor(session.type))} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selected && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-white/5">{selectedDate}</p>
          
          {selectedSession ? (
            <div className="space-y-5">
              <div className="flex gap-2">
                <span className="bg-white/10 border border-white/20 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded shadow-[0_0_5px_rgba(255,255,255,0.1)]">
                  {selectedSession.type}
                </span>
                <span className={cn(
                  'border text-[9px] uppercase font-bold px-2 py-0.5 rounded',
                  selectedSession.intensity === 'High' || selectedSession.intensity === 'Race Pace' ? 'bg-red-950/40 border-red-500/50 text-red-400' :
                  selectedSession.intensity === 'Moderate' ? 'bg-yellow-950/40 border-yellow-500/50 text-yellow-400' : 
                  'bg-green-950/40 border-green-500/50 text-green-400'
                )}>
                  {selectedSession.intensity}
                </span>
                <span className="border border-white/20 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-black/40">
                  {selectedSession.duration}m
                </span>
              </div>

              {selectedSession.warmup && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">Startup Seq</p>
                  <p className="text-sm text-gray-300 leading-relaxed font-light">{selectedSession.warmup}</p>
                </div>
              )}

              <div className="bg-black/60 border border-white/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.8)_inset] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[30px] rounded-full pointer-events-none" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Main Execution Loop</p>
                <p className="text-base text-white font-medium leading-relaxed relative z-10">{selectedSession.main_set}</p>
              </div>

              {selectedSession.target_split && (
                <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Target Split</span>
                    <span className="font-black text-white">{selectedSession.target_split}</span>
                  </div>
                  {selectedSession.stroke_rate && (
                    <div className="flex flex-col border-l border-white/10 pl-4">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Target Rate</span>
                      <span className="font-black text-white">r{selectedSession.stroke_rate}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedSession.is_notes_public && selectedSession.coach_notes && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 shadow-inner">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">Director Note</p>
                  <p className="text-sm text-blue-200 italic font-light">"{selectedSession.coach_notes}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">No protocol scheduled</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
