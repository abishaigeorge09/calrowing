import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronRight, Copy, UserPlus,
  AlertTriangle, CheckCircle2, Clock, Activity, Hexagon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes, type AthleteWithProfile } from '@/hooks/useTeamAthletes'
import { useTeamWellnessLogs } from '@/hooks/useWellnessLogs'
import { useAlerts } from '@/hooks/useAlerts'
import { getInitials, localDateStr } from '@/lib/utils'
import type { MorningLogData } from '@/types/database'

export default function RosterPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: team } = useTeam(user?.team_id)
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)
  const { data: teamLogs = [] } = useTeamWellnessLogs(user?.team_id, { days: 1 })
  const { data: allAlerts = [] } = useAlerts(user?.id)

  const today = localDateStr()

  const checkedInToday = new Set(
    teamLogs
      .filter(l => l.log_type === 'morning' && localDateStr(new Date(l.created_at)) === today)
      .map(l => l.athlete_id)
  )

  const alertsByAthlete = new Map<string, number>()
  allAlerts.forEach(a => {
    if (!a.reviewed_at) alertsByAthlete.set(a.athlete_id, (alertsByAthlete.get(a.athlete_id) ?? 0) + 1)
  })

  const filtered = athletes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const copyCode = () => {
    if (!team?.invite_code) return
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const byBoat: Record<string, AthleteWithProfile[]> = {}
  filtered.forEach(a => {
    const boat = a.athleteProfile?.boat_class ?? 'Unassigned'
    if (!byBoat[boat]) byBoat[boat] = []
    byBoat[boat].push(a)
  })

  const checkedInCount = athletes.filter(a => checkedInToday.has(a.id)).length

  return (
    <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> Array Roster
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            {athletes.length} Nodes · {team?.name}
          </p>
        </div>
      </div>

      {/* Invite Code */}
      <div className="bg-black/60 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner relative overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[30px] rounded-full" />
        <div className="relative z-10 w-full md:w-auto">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Network Access Key</p>
          <p className="text-3xl md:text-2xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{team?.invite_code ?? '—'}</p>
        </div>
        <button 
          onClick={copyCode} 
          className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-6 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] w-full md:w-auto justify-center"
        >
          <Copy className="h-4 w-4" />
          {copied ? 'Captured' : 'Capture Key'}
        </button>
      </div>

      {/* Grid for check-ins and search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in summary */}
        {athletes.length > 0 && (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sync Status</p>
              <span className="text-[10px] font-black uppercase tracking-widest md:bg-white/10 px-2 py-0.5 rounded md:border border-white/10 text-white">
                {checkedInCount}/{athletes.length}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{ width: athletes.length ? `${(checkedInCount / athletes.length) * 100}%` : '0%' }}
              />
            </div>
            {/* Legend */}
            <div className="flex gap-3 text-[9px] uppercase font-bold tracking-widest text-gray-500 mt-2">
              <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="h-3 w-3" /> Sync</span>
              <span className="flex items-center gap-1 text-white/40"><Clock className="h-3 w-3" /> Idle</span>
              <span className="flex items-center gap-1 text-red-500"><Activity className="h-3 w-3" /> Warn</span>
              <span className="flex items-center gap-1 text-orange-400"><AlertTriangle className="h-3 w-3" /> Dmg</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Search Array</p>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Query parameters..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-11 text-xs shadow-inner" 
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {athletes.length === 0 && (
        <div className="py-16 text-center bg-white/5 border border-white/10 rounded-3xl mt-4">
          <UserPlus className="h-12 w-12 mx-auto text-white/20 mb-4" />
          <p className="font-bold text-gray-300 uppercase tracking-widest mb-2">Network Empty</p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto font-light leading-relaxed">
            Operatives can initialize their nodes by entering the access key displayed above.
          </p>
        </div>
      )}

      {/* Roster by boat */}
      <div className="space-y-6">
        {Object.entries(byBoat).map(([boat, boatAthletes]) => (
          <div key={boat} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{boat}</h2>
              <span className="bg-white/10 border border-white/20 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                {boatAthletes.length} Unit{boatAthletes.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-3">
              {boatAthletes.map(a => {
                const checkedIn = checkedInToday.has(a.id)
                const alertCount = alertsByAthlete.get(a.id) ?? 0
                const hasInjury = !!a.athleteProfile?.injuries_text
                const morningLog = teamLogs.find(
                  l => l.athlete_id === a.id && l.log_type === 'morning' && localDateStr(new Date(l.created_at)) === today
                )
                const morningData = morningLog?.data as MorningLogData | undefined

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 py-3 px-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 cursor-pointer transition-all shadow-inner group text-left"
                    onClick={() => navigate(`/coach/athlete/${a.id}`)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white flex-shrink-0 relative border border-white/20 group-hover:bg-white group-hover:text-black transition-colors shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                      {getInitials(a.name)}
                      {alertCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-black rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                          {alertCount}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm tracking-wide truncate">{a.name}</p>
                        {hasInjury && <span title="Hardware Damage"><AlertTriangle className="h-3 w-3 text-orange-400 flex-shrink-0 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]" /></span>}
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">
                        {[a.athleteProfile?.seat_position, a.athleteProfile?.year].filter(Boolean).join(' · ') || 'Unclassified'}
                      </p>
                      
                      {/* Today's wellness snapshot */}
                      {morningData && (
                        <div className="flex gap-3 mt-1.5 border-t border-white/5 pt-1.5 w-max">
                          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1">
                            <span className="text-blue-400">Pwr</span> {morningData.sleep_hours}h
                          </span>
                          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1">
                            <span className="text-yellow-400">Lvl</span> {morningData.energy}
                          </span>
                          {morningData.has_soreness && (
                            <span className="text-[9px] text-red-400 uppercase font-black tracking-widest bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30">Warn</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center gap-3 pl-2">
                      {checkedIn
                        ? <span title="Sync Complete"><CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" /></span>
                        : <span title="Idle"><span className="flex h-5 w-5 rounded-full border-2 border-white/10" /></span>
                      }
                      <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
