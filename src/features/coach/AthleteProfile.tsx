import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Moon, Zap, Brain, Activity, MessageSquare } from 'lucide-react'
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
  const { data: athleteLogs = [] } = useWellnessLogs(id, { days: 14 })

  const athleteWithProfile = teamAthletes.find(a => a.id === id)
  const profile = athleteWithProfile
  const athlete = athleteWithProfile?.athleteProfile
  const alerts = allAlerts.filter(a => a.athlete_id === id)

  if (!profile) return (
    <div className="p-6 text-center text-slate-500">Athlete not found</div>
  )

  // Last 14 days of morning logs
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

  // Post logs
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
            {athlete?.boat_class} · {athlete?.seat_position} · {athlete?.year}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/coach/messages?to=${id}`)} className="gap-1.5">
          <MessageSquare className="h-4 w-4" /> Message
        </Button>
      </div>

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
                {alert.type === 'soreness_streak' && `Soreness flagged ${(alert.data as {streak_days: number}).streak_days} consecutive days`}
                {alert.type === 'low_sleep' && `Slept only ${(alert.data as {sleep_hours: number}).sleep_hours}h before high-intensity session`}
                {alert.type === 'exam_tomorrow' && `Exam: ${(alert.data as {exam_subject: string}).exam_subject}`}
              </p>
              <Badge variant={alert.severity === 'high' ? 'destructive' : 'warning'}>
                {alert.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-[#1e3a5f]">{completionRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Completion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-orange-500">{avgRPE}</p>
            <p className="text-xs text-slate-500 mt-1">Avg RPE (10 sessions)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-blue-500">
              {morningLogs.length > 0
                ? (morningLogs.reduce((s, l) => s + (l.data as MorningLogData).sleep_hours, 0) / morningLogs.length).toFixed(1)
                : '—'}h
            </p>
            <p className="text-xs text-slate-500 mt-1">Avg Sleep (14d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-green-500">{athlete?.sleep_goal ?? 8}h</p>
            <p className="text-xs text-slate-500 mt-1">Sleep Goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
                  <Line type="monotone" dataKey="" stroke="#e2e8f0" strokeWidth={1} dot={false} strokeDasharray="3 3" />
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

      {/* Physical Stats */}
      {athlete && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Athlete Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                ['Height', athlete.height_cm ? `${athlete.height_cm} cm` : '—'],
                ['Weight', athlete.weight_kg ? `${athlete.weight_kg} kg` : '—'],
                ['Boat Class', athlete.boat_class],
                ['Seat', athlete.seat_position],
                ['Year', athlete.year],
                ['Sleep Goal', `${athlete.sleep_goal}h`],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-500">{k}: </span>
                  <span className="font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
            {athlete.injuries_text && (
              <div className="mt-3 bg-orange-50 rounded-xl px-3 py-2">
                <p className="text-xs text-orange-700 font-medium">Known issues: {athlete.injuries_text}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
