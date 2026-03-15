import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Moon, Zap, Activity,
  Brain, Plus, ChevronRight, BookOpen, Users, Copy, Hexagon
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useTeam } from '@/hooks/useTeam'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useSessions } from '@/hooks/useSessions'
import { useTeamWellnessLogs } from '@/hooks/useWellnessLogs'
import { useAlerts } from '@/hooks/useAlerts'
import { formatDate, localDateStr, sessionTypeColor, intensityColor, cn } from '@/lib/utils'
import type { MorningLogData } from '@/types/database'
import CreateSessionDialog from './CreateSessionDialog'

export default function CoachDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [copied, setCopied] = useState(false)

  const today = localDateStr()

  const { data: team } = useTeam(user?.team_id)
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)
  const { data: sessions = [] } = useSessions(user?.team_id, { from: today, to: today })
  const { data: teamLogs = [] } = useTeamWellnessLogs(user?.team_id, { days: 1 })
  const { data: unreviewedAlerts = [] } = useAlerts(user?.id)

  const todaySession = sessions.find(s => s.date === today) ?? null

  const todayLogs = teamLogs.filter(
    l => l.log_type === 'morning' && localDateStr(new Date(l.created_at)) === today
  )
  const checkedInCount = todayLogs.length
  const totalAthletes = athletes.length

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

  const checkedInIds = todayLogs.map(l => l.athlete_id)

  const copyInviteCode = () => {
    if (!team?.invite_code) return
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400 shrink-0" />
            <span className="truncate">Hey, {user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1 truncate">
            {formatDate(today)}{team?.name ? ` · ${team.name}` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <Plus className="h-4 w-4" /> New Session
        </button>
      </div>

      {/* Red Flag Alerts */}
      {unreviewedAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">Critical Alerts ({unreviewedAlerts.length})</h2>
          </div>
          {unreviewedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-2xl p-4 border border-y-0 border-r-0 border-l-[4px] flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors shadow-inner',
                alert.severity === 'high' ? 'bg-red-950/20 border-l-red-500' : 'bg-yellow-950/20 border-l-yellow-500'
              )}
              onClick={() => navigate(`/coach/athlete/${alert.athlete_id}`)}
            >
              <div className={cn(
                'rounded-full p-2 mt-0.5 border',
                alert.severity === 'high' ? 'bg-red-900/40 border-red-500/30' : 'bg-yellow-900/40 border-yellow-500/30'
              )}>
                {alert.type === 'soreness_streak' && <Activity className={cn('h-4 w-4', alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400')} />}
                {alert.type === 'low_sleep' && <Moon className="h-4 w-4 text-red-400" />}
                {alert.type === 'exam_tomorrow' && <BookOpen className="h-4 w-4 text-yellow-400" />}
                {alert.type === 'injury' && <AlertTriangle className="h-4 w-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-bold text-white text-sm tracking-wide">{athletes.find(a => a.id === alert.athlete_id)?.name ?? 'Athlete'}</p>
                <p className="text-xs text-gray-400 font-light mt-1 leading-relaxed">
                  {alert.type === 'soreness_streak' && `Soreness flagged ${(alert.data as {streak_days: number}).streak_days} days in a row (${(alert.data as {body_part: string}).body_part})`}
                  {alert.type === 'low_sleep' && `Slept ${(alert.data as {sleep_hours: number}).sleep_hours}h before today's ${(alert.data as {session_intensity: string}).session_intensity} session`}
                  {alert.type === 'exam_tomorrow' && `Exam tomorrow: ${(alert.data as {exam_subject: string}).exam_subject}`}
                  {alert.type === 'injury' && `Injury flagged`}
                </p>
              </div>
              <span className={cn(
                'px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest',
                alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
              )}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Grid Layouts for smaller panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Today's Session */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">Today's Session</h2>
            {todaySession && (
              <div className="flex gap-2">
                 <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white', sessionTypeColor(todaySession.type))}>
                  {todaySession.type}
                </span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest', intensityColor(todaySession.intensity))}>
                  {todaySession.intensity}
                </span>
              </div>
            )}
          </div>
          
          {todaySession ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Duration</p>
                  <p className="font-black text-xl text-white">{todaySession.duration}m</p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Target Split</p>
                  <p className="font-black text-xl text-white">{todaySession.target_split ?? '—'}</p>
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Main Set</p>
                <p className="text-sm text-gray-200 font-light leading-relaxed">{todaySession.main_set}</p>
              </div>
              <button
                className="w-full mt-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors"
                onClick={() => navigate(`/coach/session/${todaySession.id}`)}
              >
                Expand Details
              </button>
            </div>
          ) : (
            <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
              <Hexagon className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-gray-500 text-xs tracking-widest uppercase font-bold mb-4">No session scheduled today</p>
              <button
                className="bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                onClick={() => setShowCreate(true)}
              >
                Create Session
              </button>
            </div>
          )}
        </div>

        {/* Team Wellness Summary */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">Team Wellness</h2>
            {totalAthletes > 0 && (
              <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded-full border border-white/10">
                {checkedInCount}/{totalAthletes} Active
              </span>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {totalAthletes === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4 tracking-widest uppercase font-bold bg-black/20 rounded-2xl border border-white/5">No athletes yet</p>
            ) : (
              <>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-6 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    style={{ width: `${(checkedInCount / totalAthletes) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Sleep', value: avgSleep, icon: Moon, color: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]' },
                    { label: 'Energy', value: avgEnergy, icon: Zap, color: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.15)]' },
                    { label: 'Stress', value: avgStress, icon: Brain, color: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(192,132,252,0.15)]' },
                    { label: 'Drive', value: avgMotivation, icon: Activity, color: 'text-green-400', glow: 'shadow-[0_0_15px_rgba(74,222,128,0.15)]' },
                  ].map(({ label, value, icon: Icon, color, glow }) => (
                    <div key={label} className={cn('bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center', glow)}>
                      <Icon className={cn('h-5 w-5 mb-2', color)} />
                      <p className={cn('text-2xl font-black tracking-tight mb-1', color)}>{value}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Athlete Check-in Status */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Athlete Check-ins Today</h2>
        
        <div className="space-y-3">
          {athletes.length === 0 ? (
            <div className="py-8 text-center bg-black/20 rounded-2xl border border-white/5">
              <Users className="h-8 w-8 mx-auto text-white/20 mb-3" />
              <div>
                <p className="font-bold text-gray-300 text-sm uppercase tracking-widest">No athletes yet</p>
                <p className="text-xs text-gray-500 mt-1 font-light">Share your invite code to add athletes to your roster.</p>
              </div>
              {team?.invite_code && (
                <div className="mt-6">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Invite Code</p>
                  <p className="text-2xl font-black text-white tracking-widest mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{team.invite_code}</p>
                  <button 
                    onClick={copyInviteCode} 
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 uppercase tracking-widest text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            athletes.map((athlete) => {
              const checkedIn = checkedInIds.includes(athlete.id)
              const log = todayLogs.find(l => l.athlete_id === athlete.id)
              const data = log?.data as MorningLogData | undefined
              const hasAlert = unreviewedAlerts.some(a => a.athlete_id === athlete.id)

              return (
                <div
                  key={athlete.id}
                  className="flex items-center gap-4 py-3 px-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 cursor-pointer transition-all shadow-inner group"
                  onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white flex-shrink-0 relative border border-white/20 group-hover:bg-white group-hover:text-black transition-colors">
                    {athlete.name.split(' ').map(n => n[0]).join('')}
                    {hasAlert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm tracking-wide">{athlete.name}</p>
                    {data && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 flex items-center gap-1">
                          <Moon className="h-3 w-3 text-blue-400" /> {Number(data.sleep_hours).toFixed(1)}H
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-400" /> Energy {data.energy}/5
                        </span>
                        {data.has_soreness && (
                          <span className="text-[10px] text-red-400 uppercase font-black tracking-widest bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30">Sore</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {checkedIn
                      ? <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                      : <div className="w-5 h-5 rounded-full border-2 border-white/10" />
                    }
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <CreateSessionDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
