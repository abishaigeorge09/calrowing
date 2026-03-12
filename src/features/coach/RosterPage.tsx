import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronRight, Copy, UserPlus,
  AlertTriangle, CheckCircle2, Clock, Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  // Athletes who submitted morning check-in today
  const checkedInToday = new Set(
    teamLogs
      .filter(l => l.log_type === 'morning' && localDateStr(new Date(l.created_at)) === today)
      .map(l => l.athlete_id)
  )

  // Athletes with unreviewed alerts
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
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Team Roster</h1>
        <p className="text-sm text-slate-500">{athletes.length} athletes · {team?.name}</p>
      </div>

      {/* Invite Code */}
      <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Invite Code</p>
          <p className="text-lg font-black text-[#1e3a5f] tracking-wider">{team?.invite_code ?? '—'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5">
          <Copy className="h-4 w-4" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Today's check-in summary */}
      {athletes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Today's Morning Check-ins</p>
            <span className="text-sm font-bold text-[#1e3a5f]">{checkedInCount}/{athletes.length}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-[#1e3a5f] h-2 rounded-full transition-all"
              style={{ width: athletes.length ? `${(checkedInCount / athletes.length) * 100}%` : '0%' }}
            />
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Checked in</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-300" /> Not yet</span>
            <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-red-500" /> Active alert</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-orange-400" /> Injury</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search athletes…" value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10" />
      </div>

      {/* Empty state */}
      {athletes.length === 0 && (
        <div className="py-12 text-center space-y-3">
          <UserPlus className="h-12 w-12 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-700">No athletes on this team yet</p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Athletes can join by entering the invite code above in the RowIQ app.
          </p>
        </div>
      )}

      {/* Roster by boat */}
      {Object.entries(byBoat).map(([boat, boatAthletes]) => (
        <Card key={boat}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#1e3a5f]">{boat}</CardTitle>
              <Badge variant="secondary">{boatAthletes.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
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
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-left"
                  onClick={() => navigate(`/coach/athlete/${a.id}`)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-sm font-bold text-[#1e3a5f] flex-shrink-0 relative">
                    {getInitials(a.name)}
                    {/* Alert dot */}
                    {alertCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
                        {alertCount}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-slate-900 text-sm truncate">{a.name}</p>
                      {hasInjury && <span title="Known injury"><AlertTriangle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" /></span>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {[a.athleteProfile?.seat_position, a.athleteProfile?.year].filter(Boolean).join(' · ') || 'No details'}
                    </p>
                    {/* Today's wellness snapshot */}
                    {morningData && (
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          😴 {morningData.sleep_hours}h
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ⚡ {morningData.energy}/5
                        </span>
                        {morningData.has_soreness && (
                          <span className="text-[10px] text-orange-500 font-medium">⚠ Sore</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center gap-1.5">
                    {checkedIn
                      ? <span title="Checked in today"><CheckCircle2 className="h-4 w-4 text-green-500" /></span>
                      : <span title="Not checked in"><Clock className="h-4 w-4 text-slate-200" /></span>
                    }
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
