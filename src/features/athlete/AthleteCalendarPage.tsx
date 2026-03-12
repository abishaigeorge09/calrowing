import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Check, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useSessions } from '@/hooks/useSessions'
import { usePersonalEvents, usePersonalEventsRange } from '@/hooks/usePersonalEvents'
import { useCreatePersonalEvent, useDeletePersonalEvent } from '@/hooks/mutations'
import { localDateStr, cn } from '@/lib/utils'
import type { PersonalEvent } from '@/types/database'

// ── Helpers ──────────────────────────────────────────────────────────────────
function typeToColor(type: string) {
  switch (type) {
    case 'Erg':           return { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', dot: 'bg-cyan-400' }
    case 'Water':         return { bg: 'bg-blue-500/20',  border: 'border-blue-500/50',  text: 'text-blue-300',  dot: 'bg-blue-400' }
    case 'Weights':       return { bg: 'bg-purple-500/20',border: 'border-purple-500/50',text: 'text-purple-300',dot: 'bg-purple-400' }
    case 'Cross Training':return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', dot: 'bg-green-400' }
    case 'Rest':          return { bg: 'bg-gray-500/10',  border: 'border-gray-500/30',  text: 'text-gray-400',  dot: 'bg-gray-400' }
    default:              return { bg: 'bg-white/5',      border: 'border-white/10',     text: 'text-gray-300',  dot: 'bg-gray-400' }
  }
}

function eventColorClass(color: string) {
  switch (color) {
    case 'cyan':   return { bg: 'bg-cyan-600/60',   border: 'border-cyan-400/40',   text: 'text-cyan-100' }
    case 'blue':   return { bg: 'bg-blue-600/60',   border: 'border-blue-400/40',   text: 'text-blue-100' }
    case 'green':  return { bg: 'bg-green-600/60',  border: 'border-green-400/40',  text: 'text-green-100' }
    case 'orange': return { bg: 'bg-orange-600/60', border: 'border-orange-400/40', text: 'text-orange-100' }
    default:       return { bg: 'bg-purple-600/60', border: 'border-purple-400/40', text: 'text-purple-100' }
  }
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h + m / 60
}

function formatTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

const GRID_START = 5    // 5 AM
const GRID_END   = 23   // 11 PM
const HOUR_HEIGHT = 56  // px per hour
const HOURS = Array.from({ length: GRID_END - GRID_START }, (_, i) => i + GRID_START)
const EVENT_COLORS = ['purple', 'cyan', 'blue', 'green', 'orange'] as const

interface AddEventState {
  form: { title: string; start_time: string; end_time: string; color: string }
}

export default function AthleteCalendarPage() {
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')

  const [current, setCurrent] = useState(new Date())
  const year  = current.getFullYear()
  const month = current.getMonth()

  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(localDateStr(today))

  // Sessions date range
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastOfMonth  = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate().toString().padStart(2, '0')}`
  const { data: sessions = [] } = useSessions(user?.team_id, { from: firstOfMonth, to: lastOfMonth })

  const { data: dayEvents = [] }   = usePersonalEvents(user?.id, viewMode === 'day' ? selectedDate : null)
  const { data: monthEvents = [] } = usePersonalEventsRange(user?.id, firstOfMonth, lastOfMonth)

  const createEvent = useCreatePersonalEvent()
  const deleteEvent = useDeletePersonalEvent()

  const [addEventState, setAddEventState] = useState<AddEventState | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const daySession = sessions.find(s => s.date === selectedDate)

  // ── Month helpers ─────────────────────────────────────────────────────────
  const daysInMonth     = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek  = new Date(year, month, 1).getDay()
  const calendarDays    = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  function selectDay(day: number) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(date)
    setViewMode('day')
  }

  // ── Day helpers ───────────────────────────────────────────────────────────
  const prevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(localDateStr(d))
  }
  const nextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); setSelectedDate(localDateStr(d))
  }

  const handleSlotClick = useCallback((hour: number) => {
    const startH = hour.toString().padStart(2, '0')
    const endH   = Math.min(hour + 1, 23).toString().padStart(2, '0')
    setAddEventState({ form: { title: '', start_time: `${startH}:00`, end_time: `${endH}:00`, color: 'purple' } })
    setSelectedEventId(null)
  }, [])

  const handleSaveEvent = async () => {
    if (!addEventState || !addEventState.form.title.trim() || !user) return
    await createEvent.mutateAsync({
      date: selectedDate,
      title: addEventState.form.title,
      start_time: addEventState.form.start_time,
      end_time: addEventState.form.end_time,
      color: addEventState.form.color,
    })
    setAddEventState(null)
  }

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId)
    setSelectedEventId(null)
  }

  const selectedDayLabel = (() => {
    const d = new Date(selectedDate + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  })()

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-4 text-white">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-black tracking-widest uppercase flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" /> Calendar
        </h1>
        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden text-[10px] font-black uppercase tracking-widest">
          {(['month', 'day'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={cn('px-3 py-2 transition-colors', viewMode === v ? 'bg-white text-black' : 'text-gray-400 hover:text-white')}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── MONTH VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'month' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-black text-sm tracking-widest uppercase">
              {current.toLocaleString('en-US', { month: 'long' })} {year}
            </h2>
            <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 pb-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday    = dateStr === localDateStr(today)
              const isSelected = dateStr === selectedDate
              const daySess    = sessions.filter(s => s.date === dateStr)
              const dayPE      = monthEvents.filter(e => e.date === dateStr)
              return (
                <button key={day} onClick={() => selectDay(day)}
                  className={cn('flex flex-col items-center py-2 rounded-xl transition-all text-sm font-bold min-h-[52px]',
                    isSelected ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                      : isToday ? 'text-white border border-white/30 bg-white/5'
                      : 'hover:bg-white/10 text-gray-200')}>
                  <span className="text-xs font-black">{day}</span>
                  {(daySess.length > 0 || dayPE.length > 0) && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[36px]">
                      {daySess.map(s => <div key={s.id} className={cn('w-1.5 h-1.5 rounded-full', typeToColor(s.type).dot)} />)}
                      {dayPE.slice(0, 2).map(e => <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-gray-500" />)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {sessions.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sessions this month</p>
              {sessions.slice(0, 5).map(s => {
                const c = typeToColor(s.type)
                const timeLabel = s.start_time ? `${formatTime(s.start_time)} – ${formatTime(s.end_time ?? '')}` : `${s.duration}min`
                return (
                  <button key={s.id} onClick={() => selectDay(parseInt(s.date.slice(8)))}
                    className={cn('w-full flex items-center gap-3 rounded-xl px-3 py-2 border text-left', c.bg, c.border)}>
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', c.dot)} />
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest w-16 flex-shrink-0', c.text)}>{s.date.slice(5)}</span>
                    <span className="text-xs font-bold text-white flex-1 truncate">{s.type}</span>
                    <span className="text-[10px] text-gray-500">{timeLabel}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DAY VIEW ───────────────────────────────────────────────────────── */}
      {viewMode === 'day' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          {/* Day header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <button onClick={prevDay} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="font-black text-sm tracking-widest">{selectedDayLabel}</p>
              {selectedDate === localDateStr(today) && (
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Today</p>
              )}
            </div>
            <button onClick={nextDay} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 border border-white/10">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Team session banner */}
          {daySession && (() => {
            const c = typeToColor(daySession.type)
            const timeLabel = daySession.start_time
              ? `${formatTime(daySession.start_time)} – ${formatTime(daySession.end_time ?? '')}`
              : `${daySession.duration}min`
            return (
              <div className={cn('mx-3 mt-3 rounded-2xl p-3 border flex items-center gap-3', c.bg, c.border)}>
                <div className={cn('w-3 h-3 rounded-full flex-shrink-0', c.dot)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[10px] font-black uppercase tracking-widest', c.text)}>{daySession.type} · {daySession.intensity}</p>
                  <p className="text-xs text-white/80 truncate">{daySession.main_set}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{timeLabel}</span>
              </div>
            )
          })()}

          {/* Hourly grid */}
          <div className="relative mx-1 my-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="relative" style={{ height: `${HOUR_HEIGHT * HOURS.length + 16}px` }}>
              {/* Hour lines */}
              {HOURS.map(hour => (
                <div key={hour} className="absolute right-0 border-t border-white/5"
                  style={{ top: `${(hour - GRID_START) * HOUR_HEIGHT + 8}px`, left: '44px' }}>
                  <span className="absolute text-[9px] text-gray-600 font-bold -mt-2 w-10 text-right pr-1"
                    style={{ left: '-44px', top: 0 }}>
                    {hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
                  </span>
                </div>
              ))}

              {/* Clickable slot areas */}
              {HOURS.map(hour => (
                <button key={`slot-${hour}`}
                  onClick={() => handleSlotClick(hour)}
                  className="absolute hover:bg-white/5 transition-colors rounded"
                  style={{ top: `${(hour - GRID_START) * HOUR_HEIGHT + 8}px`, height: `${HOUR_HEIGHT}px`, left: '44px', right: '0px', zIndex: 1 }}
                />
              ))}

              {/* Team session block */}
              {daySession?.start_time && daySession?.end_time && (() => {
                const start = parseTime(daySession.start_time)
                const end   = parseTime(daySession.end_time)
                if (start < GRID_START || end > GRID_END) return null
                const top    = (start - GRID_START) * HOUR_HEIGHT + 8
                const height = (end - start) * HOUR_HEIGHT
                const c = typeToColor(daySession.type)
                return (
                  <div className={cn('absolute rounded-xl border px-2 py-1 overflow-hidden', c.bg, c.border)}
                    style={{ top: `${top}px`, height: `${Math.max(height, 28)}px`, left: '48px', right: '4px', zIndex: 2 }}>
                    <p className={cn('text-[10px] font-black uppercase tracking-widest truncate', c.text)}>
                      {daySession.type} · {daySession.intensity}
                    </p>
                    {height > 40 && <p className="text-[10px] text-white/70 truncate">{daySession.main_set}</p>}
                  </div>
                )
              })()}

              {/* Personal event blocks */}
              {(dayEvents as PersonalEvent[]).map(event => {
                const start = parseTime(event.start_time)
                const end   = parseTime(event.end_time)
                if (start < GRID_START || end > GRID_END) return null
                const top    = (start - GRID_START) * HOUR_HEIGHT + 8
                const height = (end - start) * HOUR_HEIGHT
                const c = eventColorClass(event.color)
                return (
                  <button key={event.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedEventId(event.id); setAddEventState(null) }}
                    className={cn('absolute rounded-xl border px-2 py-1 text-left transition-all hover:brightness-110', c.bg, c.border)}
                    style={{ top: `${top}px`, height: `${Math.max(height, 28)}px`, left: '48px', right: '4px', zIndex: 3 }}>
                    <p className={cn('text-[10px] font-black truncate', c.text)}>{event.title}</p>
                    {height > 40 && <p className="text-[9px] text-white/50">{formatTime(event.start_time)} – {formatTime(event.end_time)}</p>}
                  </button>
                )
              })}

              {/* Current time indicator */}
              {selectedDate === localDateStr(today) && (() => {
                const now = today.getHours() + today.getMinutes() / 60
                if (now < GRID_START || now > GRID_END) return null
                const top = (now - GRID_START) * HOUR_HEIGHT + 8
                return (
                  <div className="absolute flex items-center gap-1 pointer-events-none"
                    style={{ top: `${top}px`, left: '40px', right: '0px', zIndex: 10 }}>
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] flex-shrink-0" />
                    <div className="flex-1 h-px bg-red-500/60" />
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Add event form */}
          {addEventState && (
            <div className="mx-3 mb-3 bg-black/60 border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Plus className="h-3 w-3" /> Add Event
                </p>
                <button onClick={() => setAddEventState(null)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <input autoFocus placeholder="Event title…" value={addEventState.form.title}
                onChange={e => setAddEventState(s => s ? { ...s, form: { ...s.form, title: e.target.value } } : s)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEvent()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-white/30 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={addEventState.form.start_time}
                  onChange={e => setAddEventState(s => s ? { ...s, form: { ...s.form, start_time: e.target.value } } : s)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  style={{ colorScheme: 'dark' }} />
                <input type="time" value={addEventState.form.end_time}
                  onChange={e => setAddEventState(s => s ? { ...s, form: { ...s.form, end_time: e.target.value } } : s)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  style={{ colorScheme: 'dark' }} />
              </div>
              <div className="flex gap-2">
                {EVENT_COLORS.map(c => (
                  <button key={c} onClick={() => setAddEventState(s => s ? { ...s, form: { ...s.form, color: c } } : s)}
                    className={cn('w-6 h-6 rounded-full border-2 transition-transform',
                      addEventState.form.color === c ? 'scale-125 border-white' : 'border-transparent',
                      c === 'purple' ? 'bg-purple-500' : c === 'cyan' ? 'bg-cyan-500' : c === 'blue' ? 'bg-blue-500' : c === 'green' ? 'bg-green-500' : 'bg-orange-500')} />
                ))}
              </div>
              <button onClick={handleSaveEvent} disabled={!addEventState.form.title.trim() || createEvent.isPending}
                className="w-full bg-white text-black rounded-xl py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> {createEvent.isPending ? 'Saving…' : 'Save Event'}
              </button>
            </div>
          )}

          {/* Selected event */}
          {selectedEventId && (() => {
            const event = (dayEvents as PersonalEvent[]).find(e => e.id === selectedEventId)
            if (!event) return null
            const c = eventColorClass(event.color)
            return (
              <div className={cn('mx-3 mb-3 border rounded-2xl p-4', c.bg, c.border)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn('font-black text-sm', c.text)}>{event.title}</p>
                    <p className="text-[10px] text-white/60 mt-0.5">{formatTime(event.start_time)} – {formatTime(event.end_time)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDeleteEvent(event.id)} disabled={deleteEvent.isPending}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/30 bg-red-950/30 px-2 py-1 rounded-lg hover:bg-red-900/40">
                      Delete
                    </button>
                    <button onClick={() => setSelectedEventId(null)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )
          })()}

          {!addEventState && !selectedEventId && (
            <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest pb-3">
              Tap any time slot to add a personal event
            </p>
          )}
        </div>
      )}
    </div>
  )
}
