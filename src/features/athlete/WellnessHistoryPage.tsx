import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Moon, Zap, Brain, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useWellnessLogs } from '@/hooks/useWellnessLogs'
import { useSessions } from '@/hooks/useSessions'
import type { MorningLogData, PostSessionLogData } from '@/types/database'
import { formatDate } from '@/lib/utils'

export default function WellnessHistoryPage() {
  const { user } = useAuthStore()
  const [range, setRange] = useState<7 | 14 | 30>(14)

  const { data: allLogs = [] } = useWellnessLogs(user?.id, { days: 30 })
  const { data: sessions = [] } = useSessions(user?.team_id, {})

  const morningLogs = allLogs
    .filter(l => l.log_type === 'morning')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-range)

  const postLogs = allLogs
    .filter(l => l.log_type === 'post')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const chartData = morningLogs.map(l => {
    const d = l.data as MorningLogData
    const dateStr = l.created_at.split('T')[0]
    const session = sessions.find(s => s.date === dateStr)
    const postLog = allLogs.find(pl =>
      pl.log_type === 'post' && pl.created_at.startsWith(dateStr)
    )
    const pd = postLog?.data as PostSessionLogData | undefined

    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Sleep: d.sleep_hours,
      Energy: d.energy,
      Stress: d.stress,
      RPE: pd?.rpe,
      'Session Load': session ? ({ Low: 2, Moderate: 5, High: 8, 'Race Pace': 10 }[session.intensity] ?? 5) : undefined,
    }
  })

  const avgSleep = morningLogs.length > 0
    ? (morningLogs.reduce((s, l) => s + (l.data as MorningLogData).sleep_hours, 0) / morningLogs.length).toFixed(1)
    : '—'
  const completionRate = postLogs.slice(0, range).length > 0
    ? Math.round(postLogs.slice(0, range).filter(l => (l.data as PostSessionLogData).completion === 'full').length / Math.max(postLogs.slice(0, range).length, 1) * 100)
    : 0
  const avgRPE = postLogs.slice(0, range).length > 0
    ? (postLogs.slice(0, range).reduce((s, l) => s + (l.data as PostSessionLogData).rpe, 0) / postLogs.slice(0, range).length).toFixed(1)
    : '—'
  const sorenessDays = morningLogs.filter(l => (l.data as MorningLogData).has_soreness).length

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Wellness History</h1>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {([7, 14, 30] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-slate-500'}`}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Avg Sleep', value: `${avgSleep}h`, icon: Moon, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completion', value: `${completionRate}%`, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg RPE', value: avgRPE, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Sore Days', value: `${sorenessDays}`, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl p-3 text-center ${bg}`}>
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sleep">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="sleep" className="flex-1">Sleep</TabsTrigger>
              <TabsTrigger value="energy" className="flex-1">Energy</TabsTrigger>
              <TabsTrigger value="rpe" className="flex-1">RPE</TabsTrigger>
            </TabsList>
            <TabsContent value="sleep">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
                  <YAxis domain={[4, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}h`, 'Sleep']} />
                  <ReferenceLine y={8} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Goal', fontSize: 10, fill: '#94a3b8' }} />
                  <Line type="monotone" dataKey="Sleep" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="energy">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Energy" stroke="#eab308" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Stress" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-4 h-0.5 bg-yellow-500" />Energy
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-4 h-0.5 bg-purple-500 border-dashed" />Stress
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rpe">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.filter(d => d.RPE !== undefined)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="RPE" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent logs */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {postLogs.slice(0, 7).map(log => {
            const d = log.data as PostSessionLogData
            const dateStr = log.created_at.split('T')[0]
            const session = sessions.find(s => s.date === dateStr)
            return (
              <div key={log.id} className="flex items-center gap-3 py-2">
                <div className={`w-2 h-10 rounded-full flex-shrink-0 ${
                  d.completion === 'full' ? 'bg-green-500' : d.completion === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500">{session?.type ?? 'Session'} · RPE {d.rpe}/10</p>
                </div>
                <div className="text-right">
                  <Badge variant={d.completion === 'full' ? 'success' : d.completion === 'partial' ? 'warning' : 'destructive'} className="text-xs">
                    {d.completion === 'full' ? 'Done' : d.completion === 'partial' ? 'Partial' : 'DNF'}
                  </Badge>
                  {d.has_pain && <p className="text-xs text-red-500 mt-0.5">Pain flagged</p>}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
