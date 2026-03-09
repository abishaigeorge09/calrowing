import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, CheckCircle2, Clock, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MOCK_ATHLETES, MOCK_ATHLETE_PROFILES, MOCK_TEAM } from '@/lib/mock-data'
import { getInitials } from '@/lib/utils'

export default function RosterPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  const filtered = MOCK_ATHLETES.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const copyCode = () => {
    navigator.clipboard.writeText(MOCK_TEAM.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const byBoat: Record<string, typeof MOCK_ATHLETES> = {}
  filtered.forEach(a => {
    const boat = MOCK_ATHLETE_PROFILES[a.id]?.boat_class ?? 'Unassigned'
    if (!byBoat[boat]) byBoat[boat] = []
    byBoat[boat].push(a)
  })

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Team Roster</h1>
        <p className="text-sm text-slate-500">{MOCK_ATHLETES.length} athletes · {MOCK_TEAM.name}</p>
      </div>

      {/* Invite Code */}
      <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Invite Code</p>
          <p className="text-lg font-black text-[#1e3a5f] tracking-wider">{MOCK_TEAM.invite_code}</p>
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
      {Object.entries(byBoat).map(([boat, athletes]) => (
        <Card key={boat}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#1e3a5f]">{boat}</CardTitle>
              <Badge variant="secondary">{athletes.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {athletes.map(a => {
              const ap = MOCK_ATHLETE_PROFILES[a.id]
              return (
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
                      {ap?.seat_position} · {ap?.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
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
