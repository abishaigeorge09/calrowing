import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Moon, Zap, Brain, Activity, MessageSquare,
  AlertTriangle, CheckCircle2, XCircle, Hexagon
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
    <div className="p-6 text-center text-gray-500 bg-black min-h-dvh flex items-center justify-center font-bold tracking-widest uppercase">Node not found</div>
  )

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
    <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto font-sans text-white">
      {/* Back + Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> {profile.name}
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            {[athlete?.boat_class, athlete?.seat_position, athlete?.year].filter(Boolean).join(' · ') || 'Unclassified Node'}
          </p>
        </div>
        <button 
          onClick={() => navigate(`/coach/messages?to=${id}`)} 
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <MessageSquare className="h-4 w-4" /> Comms
        </button>
      </div>

      {/* Known Injuries */}
      {athlete?.injuries_text && (
        <div className="bg-orange-950/40 border border-orange-500/50 rounded-2xl p-4 flex items-start gap-4 shadow-inner relative overflow-hidden">
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-32 h-32 bg-orange-500/20 blur-[30px] rounded-full pointer-events-none" />
          <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-300 mb-1">Hardware Damage Alert</p>
            <p className="text-sm font-medium text-orange-100/90 leading-relaxed">{athlete.injuries_text}</p>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={cn(
              'rounded-2xl p-4 border border-y-0 border-r-0 border-l-[4px] flex items-center gap-4 bg-black/40 shadow-inner',
              alert.severity === 'high' ? 'border-l-red-500' : 'border-l-yellow-500'
            )}>
              <Activity className={cn('h-5 w-5 flex-shrink-0 drop-shadow-[0_0_8px_currentColor]', alert.severity === 'high' ? 'text-red-500' : 'text-yellow-400')} />
              <p className="text-sm font-bold text-white flex-1 tracking-wide">
                {alert.type === 'soreness_streak' && `Soreness ${(alert.data as {streak_days: number}).streak_days} days in a row`}
                {alert.type === 'low_sleep' && `Slept ${(alert.data as {sleep_hours: number}).sleep_hours}h before high intensity session`}
                {alert.type === 'exam_tomorrow' && `Critical Evaluation: ${(alert.data as {exam_subject: string}).exam_subject}`}
                {alert.type === 'injury' && `Dmg report: ${(alert.data as {body_part: string}).body_part}`}
              </p>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { value: `${completionRate}%`, label: 'Integrity', color: 'text-white' },
          { value: String(avgRPE), label: 'Avg Strain', color: 'text-orange-400' },
          { value: `${avgSleep}H`, label: 'Avg Pwr', color: 'text-blue-400' },
          { value: `${athlete?.sleep_goal ?? 8}H`, label: 'Pwr Target', color: 'text-green-400' },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <p className={`text-3xl font-black tracking-tight mb-1 drop-shadow-[0_0_10px_currentColor] ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
          </div>
        ))}
      </div>

      {/* Main Stats UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="space-y-6 flex flex-col">
          {athlete && (
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex-1">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Node Specs</h2>
              <div className="space-y-5">
                {[
                  ['Y-Axis (cm)', athlete.height_cm ? `${athlete.height_cm}` : 'Unk'],
                  ['Mass (kg)', athlete.weight_kg ? `${athlete.weight_kg}` : 'Unk'],
                  ['Pwr Target', `${athlete.sleep_goal}H`],
                  ['Class', athlete.boat_class ?? 'Unk'],
                  ['Vector', athlete.seat_position ?? 'Unk'],
                  ['Cycle', athlete.year ?? 'Unk'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">{k}</p>
                    <p className="font-black text-sm text-white tracking-widest">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sessions */}
        <div className="md:col-span-2">
           {postLogs.length > 0 ? (
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] h-full">
              <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Session Telemetry</h2>
              <div className="space-y-1">
                {postLogs.map(log => {
                  const p = log.data as PostSessionLogData
                  return (
                    <div key={log.id} className="flex items-center gap-3 py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-lg transition-colors group">
                      {p.completion === 'full'
                        ? <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                        : p.completion === 'partial'
                        ? <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]" />
                        : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />}

                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 w-12 flex-shrink-0">
                        {formatDate(log.created_at).replace(/\w+, /, '')}
                      </span>

                      <span className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white flex-shrink-0">
                        RPE {p.rpe}
                      </span>

                      {p.has_pain && (
                        <span className="text-[9px] uppercase font-black tracking-widest text-red-400 border border-red-500/50 bg-red-950/40 px-1.5 py-0.5 rounded flex-shrink-0">
                          ⚠ Dmg
                        </span>
                      )}

                      {p.note_to_coach ? (
                        <span className="text-xs text-gray-400 font-light truncate flex-1 pl-2">"{p.note_to_coach}"</span>
                      ) : <span className="flex-1" />}

                      <span className={cn(
                        'text-[10px] uppercase font-black tracking-widest flex-shrink-0 px-2',
                        p.ready_tomorrow === 'yes' ? 'text-green-400' :
                        p.ready_tomorrow === 'maybe' ? 'text-orange-400' : 'text-red-500'
                      )}>
                        {p.ready_tomorrow === 'yes' ? 'Active' : p.ready_tomorrow === 'maybe' ? 'Warn' : 'Halt'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] h-full flex flex-col items-center justify-center py-12">
              <Hexagon className="h-10 w-10 text-white/10 mb-4" />
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">No Telemetry Recorded</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Trends Graph Full Width */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Diagnostic Trends (14 Cycles)</h2>
        <div className="h-[250px] w-full text-xs font-mono font-bold">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="Sleep" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#60a5fa' }} />
              <Line type="monotone" dataKey="Energy" stroke="#facc15" strokeWidth={3} dot={{ r: 4, fill: '#713f12', stroke: '#facc15', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="Stress" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: '#581c87', stroke: '#c084fc', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pwr (H)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lvl</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Strain</span></div>
        </div>
      </div>
    </div>
  )
}
