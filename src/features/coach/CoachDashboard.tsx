import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Moon, Zap, Activity,
  Brain, Users, Plus, ChevronRight, BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MOCK_ATHLETES, MOCK_SESSIONS, MOCK_WELLNESS_LOGS,
  MOCK_ALERTS, MOCK_TEAM,
} from '@/lib/mock-data'
import { useAuthStore } from '@/stores/auth'
import { formatDate, sessionTypeColor, intensityColor, cn } from '@/lib/utils'
import type { MorningLogData } from '@/types/database'
import CreateSessionDialog from './CreateSessionDialog'

export default function CoachDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todaySession = MOCK_SESSIONS.find(s => s.date === today)

  // Today's morning check-ins
  const todayLogs = MOCK_WELLNESS_LOGS.filter(
    l => l.log_type === 'morning' && l.created_at.startsWith(today)
  )
  const checkedInCount = todayLogs.length
  const totalAthletes = MOCK_ATHLETES.length

  // Compute wellness averages from today's logs
  const avgSleep = todayLogs.length > 0
    ? (todayLogs.reduce((s, l) => s + (l.data as MorningLogData).sleep_hours, 0) / todayLogs.length).toFixed(1)
    : '—'
  const avgEnergy = todayLogs.length > 0
    ? (todayLogs.reduce((s, l) => s + (l.data as MorningLogData).energy, 0) / todayLogs.length).toFixed(1)
    : '—'
  const avgStress = todayLogs.length > 0
    ? (todayLogs.reduce((s, l) => s + (l.data as MorningLogData).stress, 0) / todayLogs.length).toFixed(1)
    : '—'
  const avgMotivation = todayLogs.length > 0
    ? (todayLogs.reduce((s, l) => s + (l.data as MorningLogData).motivation, 0) / todayLogs.length).toFixed(1)
    : '—'

  const unreviewedAlerts = MOCK_ALERTS.filter(a => !a.reviewed_at)

  // Athlete check-in status
  const checkedInIds = todayLogs.map(l => l.athlete_id)

  return (
    <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500">{formatDate(today)} · {MOCK_TEAM.name}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Session
        </Button>
      </div>

      {/* Red Flag Alerts */}
      {unreviewedAlerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-slate-900">Red Flags ({unreviewedAlerts.length})</h2>
          </div>
          {unreviewedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-2xl p-4 border-l-4 flex items-start gap-3 cursor-pointer',
                alert.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
              )}
              onClick={() => navigate(`/coach/athlete/${alert.athlete_id}`)}
            >
              <div className={cn(
                'rounded-full p-1.5 mt-0.5',
                alert.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'
              )}>
                {alert.type === 'soreness_streak' && <Activity className={cn('h-4 w-4', alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600')} />}
                {alert.type === 'low_sleep' && <Moon className="h-4 w-4 text-red-600" />}
                {alert.type === 'exam_tomorrow' && <BookOpen className="h-4 w-4 text-yellow-600" />}
                {alert.type === 'injury' && <AlertTriangle className="h-4 w-4 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">{alert.athlete?.name}</p>
                <p className="text-sm text-slate-600">
                  {alert.type === 'soreness_streak' && `Soreness flagged ${(alert.data as {streak_days: number}).streak_days} days in a row (${(alert.data as {body_part: string}).body_part})`}
                  {alert.type === 'low_sleep' && `Slept ${(alert.data as {sleep_hours: number}).sleep_hours}h before today's ${(alert.data as {session_intensity: string}).session_intensity} session`}
                  {alert.type === 'exam_tomorrow' && `Exam tomorrow: ${(alert.data as {exam_subject: string}).exam_subject}`}
                  {alert.type === 'injury' && `Injury flagged`}
                </p>
              </div>
              <Badge variant={alert.severity === 'high' ? 'destructive' : 'warning'}>
                {alert.severity}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Today's Session */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today's Session</CardTitle>
            {todaySession && (
              <div className="flex gap-2">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold text-white', sessionTypeColor(todaySession.type))}>
                  {todaySession.type}
                </span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', intensityColor(todaySession.intensity))}>
                  {todaySession.intensity}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todaySession ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="font-bold text-slate-900">{todaySession.duration} min</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Target Split</p>
                  <p className="font-bold text-slate-900">{todaySession.target_split ?? '—'}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Main Set</p>
                <p className="text-sm text-slate-900 font-medium">{todaySession.main_set}</p>
              </div>
              <Button
                variant="outline" size="sm" className="w-full"
                onClick={() => navigate(`/coach/session/${todaySession.id}`)}
              >
                View Full Session
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm mb-3">No session scheduled for today</p>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Wellness Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Team Wellness</CardTitle>
            <span className="text-sm text-slate-500">{checkedInCount}/{totalAthletes} checked in</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-[#1e3a5f] h-2 rounded-full transition-all"
              style={{ width: `${(checkedInCount / totalAthletes) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Sleep', value: avgSleep, icon: Moon, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Energy', value: avgEnergy, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Stress', value: avgStress, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Motivation', value: avgMotivation, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={cn('rounded-xl p-3 text-center', bg)}>
                <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
                <p className={cn('text-lg font-black', color)}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Athlete Check-in Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Athlete Check-ins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_ATHLETES.map((athlete) => {
            const checkedIn = checkedInIds.includes(athlete.id)
            const log = todayLogs.find(l => l.athlete_id === athlete.id)
            const data = log?.data as MorningLogData | undefined
            const hasAlert = unreviewedAlerts.some(a => a.athlete_id === athlete.id)

            return (
              <div
                key={athlete.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center text-sm font-bold text-[#1e3a5f] flex-shrink-0">
                  {athlete.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{athlete.name}</p>
                  {data && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Moon className="h-3 w-3" /> {Number(data.sleep_hours).toFixed(1)}h
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> {data.energy}/5
                      </span>
                      {data.has_soreness && (
                        <span className="text-xs text-orange-600 font-medium">Soreness</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasAlert && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                  {checkedIn
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                  }
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <CreateSessionDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
