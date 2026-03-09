import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, CheckCircle2, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes, type AthleteWithProfile } from '@/hooks/useTeamAthletes'
import { getInitials } from '@/lib/utils'

export default function RosterPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: team } = useTeam(user?.team_id)
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search athletes…" value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10" />
      </div>

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
            {boatAthletes.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/coach/athlete/${a.id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-sm font-bold text-[#1e3a5f] flex-shrink-0">
                  {getInitials(a.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.athleteProfile?.seat_position} · {a.athleteProfile?.year}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
