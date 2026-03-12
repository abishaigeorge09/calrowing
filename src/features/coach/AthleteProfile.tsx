import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Moon, Zap, Brain, Activity, MessageSquare,
  AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useWellnessLogs } from '@/hooks/useWellnessLogs'
import { useAlerts } from '@/hooks/useAlerts'
import type { MorningLogData, PostSessionLogData } from '@/types/database'
import { formatDate, cn } from '@/lib/utils'

export default function AthleteProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: teamAthletes = [] } = useTeamAthletes(user?.team_id)
  const { data: allAlerts = [] } = useAlerts(user?.id)
  const { data: athleteLogs = [] } = useWellnessLogs(id, { days: 30 })

  const athleteWithProfile = teamAthletes.find(a => a.id === id)
  const profile = athleteWithProfile
  const athlete = athleteWithProfile?.athleteProfile
  const alerts = allAlerts.filter(a => a.athlete_id === id && !a.reviewed_at)

  if (!profile) return (
    <div className="p-6 text-center text-slate-500">Athlete not found</div>
  )

  // Last 14 days of morning logs for charts
  const morningLogs = athleteLogs
    .filter(l => l.log_type === 'morning')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-14)

  const chartData = morningLogs.map(l => {
    const d = l.data as MorningLogData
    return {
      date: formatDate(l.created_at).replace(/\w+, /, ''),
      Sleep: d.sleep_hours,
      Energy: d.energy,
      Stress: d.stress,
    }
  })

  // Post-session logs — most recent 10
  const postLogs = athleteLogs
    .filter(l => l.log_type === 'post')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  const completionRate = postLogs.length > 0
    ? Math.round(postLogs.filter(l => (l.data as PostSessionLogData).completion === 'full').length / postLogs.length * 100)
    : 0

  const avgRPE = postLogs.length > 0
    ? (postLogs.reduce((s, l) => s + (l.data as PostSessionLogData).rpe, 0) / postLogs.length).toFixed(1)
    : '—'

  const avgSleep = morningLogs.length > 0
    ? (morningLogs.reduce((s, l) => s + (l.data as MorningLogData).sleep_hours, 0) / morningLogs.length).toFixed(1)
    : '—'

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
          <p className="text-sm text-slate-500">
            {[athlete?.boat_class, athlete?.seat_position, athlete?.year].filter(Boolean).join(' · ') || 'No profile details'}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/coach/messages?to=${id}`)} className="gap-1.5">
          <MessageSquare className="h-4 w-4" /> Message
        </Button>
      </div>

      {/* Known Injuries — prominent banner */}
      {athlete?.injuries_text && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-800 mb-0.5">Known Issues / Injuries</p>
            <p className="text-sm text-orange-700">{athlete.injuries_text}</p>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={cn(
              'rounded-xl p-3 border-l-4 flex items-center gap-3',
              alert.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
            )}>
              <Activity className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-slate-800 flex-1">
                {alert.type === 'soreness_streak' && `Soreness ${(alert.data as {streak_days: number}).streak_days} days in a row`}
                {alert.type === 'low_sleep' && `Slept ${(alert.data as {sleep_hours: number}).sleep_hours}h before high session`}
                {alert.type === 'exam_tomorrow' && `Exam: ${(alert.data as {exam_subject: string}).exam_subject}`}
                {alert.type === 'injury' && `Injury: ${(alert.data as {body_part: string}).body_part}`}
              </p>
              <Badge variant={alert.severity === 'high' ? 'destructive' : 'warning'}>
                {alert.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: `${completionRate}%`, label: 'Completion', color: 'text-[#1e3a5f]' },
          { value: String(avgRPE), label: 'Avg RPE', color: 'text-orange-500' },
          { value: `${avgSleep}h`, label: 'Avg Sleep', color: 'text-blue-500' },
          { value: `${athlete?.sleep_goal ?? 8}h`, label: 'Sleep Goal', color: 'text-green-500' },
        ].map(({ value, label, color }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wellness Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Wellness Trends (14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sleep">
            <TabsList className="mb-4">
              <TabsTrigger value="sleep"><Moon className="h-3.5 w-3.5 mr-1" />Sleep</TabsTrigger>
              <TabsTrigger value="energy"><Zap className="h-3.5 w-3.5 mr-1" />Energy</TabsTrigger>
              <TabsTrigger value="stress"><Brain className="h-3.5 w-3.5 mr-1" />Stress</TabsTrigger>
            </TabsList>
            <TabsContent value="sleep">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Sleep" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="energy">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Energy" stroke="#eab308" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="stress">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Stress" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Post-Session History */}
      {postLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Session Completions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {postLogs.map(log => {
              const p = log.data as PostSessionLogData
              return (
                <div key={log.id} className="flex items-center gap-2 py-2.5 border-b border-slate-50 last:border-0">
                  {p.completion === 'full'
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    : p.completion === 'partial'
                    ? <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}

                  <span className="text-xs text-slate-400 w-16 flex-shrink-0">
                    {formatDate(log.created_at).replace(/\w+, /, '')}
                  </span>

                  <span className="bg-slate-100 rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 flex-shrink-0">
                    RPE {p.rpe}
                  </span>

                  {p.has_pain && (
                    <span className="text-xs text-red-500 font-semibold flex-shrink-0">⚠ Pain</span>
                  )}

                  {p.note_to_coach ? (
                    <span className="text-xs text-slate-400 italic truncate flex-1">"{p.note_to_coach}"</span>
                  ) : <span className="flex-1" />}

                  <span className={cn(
                    'text-xs font-semibold flex-shrink-0',
                    p.ready_tomorrow === 'yes' ? 'text-green-600' :
                    p.ready_tomorrow === 'maybe' ? 'text-orange-500' : 'text-red-500'
                  )}>
                    {p.ready_tomorrow === 'yes' ? '✓ Ready' : p.ready_tomorrow === 'maybe' ? '~ Maybe' : '✗ No'}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Physical Stats */}
      {athlete && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Athlete Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-y-3 text-sm">
              {[
                ['Height', athlete.height_cm ? `${athlete.height_cm} cm` : '—'],
                ['Weight', athlete.weight_kg ? `${athlete.weight_kg} kg` : '—'],
                ['Sleep Goal', `${athlete.sleep_goal}h`],
                ['Boat Class', athlete.boat_class ?? '—'],
                ['Seat', athlete.seat_position ?? '—'],
                ['Year', athlete.year ?? '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400">{k}</p>
                  <p className="font-semibold text-slate-900">{v}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
