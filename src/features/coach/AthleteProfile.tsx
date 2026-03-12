import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Moon, Zap, Brain, Activity, MessageSquare,
  AlertTriangle, CheckCircle2, XCircle, Hexagon, TrendingUp,
  Heart, BookOpen,
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useAuthStore } from '@/stores/auth'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useWellnessLogs } from '@/hooks/useWellnessLogs'
import { useAlerts } from '@/hooks/useAlerts'
import { useSessions } from '@/hooks/useSessions'
import type { MorningLogData, PostSessionLogData } from '@/types/database'
import { formatDate, localDateStr, cn } from '@/lib/utils'

type AnalyticsTab = 'overview' | 'load' | 'recovery' | 'wellness'

const CHART_MARGIN = { top: 5, right: 10, left: -20, bottom: 5 }
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'rgba(0,0,0,0.85)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px' },
  itemStyle: { fontWeight: 'bold' },
}

function shortDate(created_at: string) {
  return formatDate(created_at).replace(/\w+, /, '')
}

export default function AthleteProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')

  const { data: teamAthletes = [] } = useTeamAthletes(user?.team_id)
  const { data: allAlerts = [] } = useAlerts(user?.id)
  const { data: athleteLogs = [] } = useWellnessLogs(id, { days: 60 })

  // Get recent sessions for training load computation
  const pastDate = (() => { const d = new Date(); d.setDate(d.getDate() - 60); return localDateStr(d) })()
  const { data: sessions = [] } = useSessions(user?.team_id, { from: pastDate, to: localDateStr() })

  const athleteWithProfile = teamAthletes.find(a => a.id === id)
  const profile = athleteWithProfile
  const athlete = athleteWithProfile?.athleteProfile
  const alerts = allAlerts.filter(a => a.athlete_id === id && !a.reviewed_at)

  if (!profile) return (
    <div className="p-6 text-center text-gray-500 bg-black min-h-dvh flex items-center justify-center font-bold tracking-widest uppercase">Node not found</div>
  )

  // ── Data prep ────────────────────────────────────────────────────────────────
  const morningLogs = athleteLogs
    .filter(l => l.log_type === 'morning')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-14)

  const postLogs14 = athleteLogs
    .filter(l => l.log_type === 'post')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-14)

  const postLogsRecent = [...postLogs14].reverse().slice(0, 10)

  // ── Overview stats ──────────────────────────────────────────────────────────
  const completionRate = postLogs14.length > 0
    ? Math.round(postLogs14.filter(l => (l.data as PostSessionLogData).completion === 'full').length / postLogs14.length * 100)
    : 0
  const avgRPE = postLogs14.length > 0
    ? (postLogs14.reduce((s, l) => s + ((l.data as PostSessionLogData).rpe ?? 0), 0) / postLogs14.length).toFixed(1)
    : '—'
  const avgSleep = morningLogs.length > 0
    ? (morningLogs.reduce((s, l) => s + ((l.data as MorningLogData).sleep_hours ?? 0), 0) / morningLogs.length).toFixed(1)
    : '—'

  // ── Training Load chart (RPE × duration in hours) ───────────────────────────
  const trainingLoadData = postLogs14.map(log => {
    const sessionDate = localDateStr(new Date(log.created_at))
    const session = sessions.find(s => s.date === sessionDate)
    const rpe = (log.data as PostSessionLogData).rpe ?? 0
    const durationHr = (session?.duration ?? 60) / 60
    return {
      date: shortDate(log.created_at),
      Load: Math.round(rpe * durationHr * 10) / 10,
    }
  })

  // Weekly totals (last 4 weeks)
  const weeklyLoadData = (() => {
    const weeks: { week: string; Load: number }[] = []
    for (let w = 3; w >= 0; w--) {
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - w * 7)
      const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6)
      const label = `W${4 - w}`
      const total = postLogs14
        .filter(l => {
          const d = new Date(l.created_at)
          return d >= weekStart && d <= weekEnd
        })
        .reduce((sum, l) => {
          const sessionDate = localDateStr(new Date(l.created_at))
          const session = sessions.find(s => s.date === sessionDate)
          const rpe = (l.data as PostSessionLogData).rpe ?? 0
          const durationHr = (session?.duration ?? 60) / 60
          return sum + rpe * durationHr
        }, 0)
      weeks.push({ week: label, Load: Math.round(total) })
    }
    return weeks
  })()

  // ── Recovery charts ──────────────────────────────────────────────────────────
  const recoveryData = postLogs14.map(log => ({
    date: shortDate(log.created_at),
    Recovery: (log.data as PostSessionLogData).recovery_status ?? 0,
  }))

  const splitCounts = postLogs14.reduce(
    (acc, l) => {
      const v = (l.data as PostSessionLogData).hit_target_splits
      if (v === 'yes') acc.yes++
      else if (v === 'close') acc.close++
      else acc.no++
      return acc
    },
    { yes: 0, close: 0, no: 0 }
  )
  const splitPieData = [
    { name: 'Hit', value: splitCounts.yes, color: '#4ade80' },
    { name: 'Close', value: splitCounts.close, color: '#facc15' },
    { name: 'Missed', value: splitCounts.no, color: '#f87171' },
  ].filter(d => d.value > 0)

  const readinessCounts = postLogs14.reduce(
    (acc, l) => {
      if ((l.data as PostSessionLogData).ready_tomorrow === 'yes') acc.yes++
      else acc.maybe++
      return acc
    },
    { yes: 0, maybe: 0 }
  )

  // ── Wellness score chart ─────────────────────────────────────────────────────
  const sleepGoal = athlete?.sleep_goal ?? 8
  const wellnessData = morningLogs.map(log => {
    const d = log.data as MorningLogData
    const score = Math.round(
      ((d.sleep_hours / sleepGoal) * 0.3 +
       (d.energy / 5) * 0.25 +
       ((5 - d.stress) / 5) * 0.25 +
       (d.motivation / 5) * 0.2) * 100
    )
    return { date: shortDate(log.created_at), Score: Math.min(score, 100) }
  })

  // Soreness frequency by body part
  const sorenessMap: Record<string, { count: number; totalLevel: number }> = {}
  morningLogs.forEach(log => {
    const d = log.data as MorningLogData
    if (d.has_soreness && d.soreness_body_part) {
      const bp = d.soreness_body_part
      if (!sorenessMap[bp]) sorenessMap[bp] = { count: 0, totalLevel: 0 }
      sorenessMap[bp].count++
      sorenessMap[bp].totalLevel += d.soreness_level ?? 3
    }
  })
  const sorenessData = Object.entries(sorenessMap)
    .map(([part, { count, totalLevel }]) => ({
      part,
      Frequency: count,
      avgLevel: Math.round(totalLevel / count),
    }))
    .sort((a, b) => b.Frequency - a.Frequency)
    .slice(0, 6)

  // Academic load data
  const academicData = morningLogs.map(log => {
    const d = log.data as MorningLogData
    return {
      date: shortDate(log.created_at),
      Stress: d.stress ?? 0,
      Classes: d.classes_today ?? 0,
    }
  })

  // ── Current wellness score (today / latest) ─────────────────────────────────
  const latestWellness = wellnessData.at(-1)?.Score ?? null
  const weeklyLoad7d = trainingLoadData.slice(-7).reduce((s, d) => s + d.Load, 0)

  const tabs: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Hexagon className="h-3.5 w-3.5" /> },
    { id: 'load',     label: 'Load',     icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: 'recovery', label: 'Recovery', icon: <Heart className="h-3.5 w-3.5" /> },
    { id: 'wellness', label: 'Wellness', icon: <Brain className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto font-sans text-white">
      {/* Back + Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors">
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
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all"
        >
          <MessageSquare className="h-4 w-4" /> Comms
        </button>
      </div>

      {/* Known Injuries */}
      {athlete?.injuries_text && (
        <div className="bg-orange-950/40 border border-orange-500/50 rounded-2xl p-4 flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-300 mb-1">Known Injury</p>
            <p className="text-sm text-orange-100/90">{athlete.injuries_text}</p>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={cn(
              'rounded-2xl p-4 border-l-4 bg-black/40 flex items-center gap-3',
              alert.severity === 'high' ? 'border-l-red-500' : 'border-l-yellow-500'
            )}>
              <Activity className={cn('h-4 w-4 flex-shrink-0', alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400')} />
              <p className="text-sm font-bold text-white flex-1">
                {alert.type === 'soreness_streak' && `Soreness ${(alert.data as {streak_days:number}).streak_days}d streak`}
                {alert.type === 'low_sleep' && `Low sleep: ${(alert.data as {sleep_hours:number}).sleep_hours}h`}
                {alert.type === 'exam_tomorrow' && `Exam: ${(alert.data as {exam_subject:string}).exam_subject}`}
                {alert.type === 'injury' && `Injury: ${(alert.data as {body_part:string}).body_part}`}
              </p>
              <span className={cn('text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest',
                alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black')}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { value: `${completionRate}%`, label: 'Completion', color: 'text-white' },
          { value: String(avgRPE), label: 'Avg RPE', color: 'text-orange-400' },
          { value: `${avgSleep}h`, label: 'Avg Sleep', color: 'text-blue-400' },
          { value: latestWellness !== null ? `${latestWellness}` : '—', label: 'Wellness', color: 'text-green-400' },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <p className={`text-2xl font-black tracking-tight mb-0.5 ${color}`}>{value}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-widest transition-all',
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white bg-white/5'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">7-Day Training Load</p>
                  <p className="text-3xl font-black text-orange-400">{weeklyLoad7d.toFixed(0)} <span className="text-xs text-gray-500">AU</span></p>
                  {weeklyLoad7d > 80 && <p className="text-[10px] text-red-400 font-bold mt-1">⚠ High load week</p>}
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Current Wellness</p>
                  <p className="text-3xl font-black text-green-400">{latestWellness ?? '—'}<span className="text-xs text-gray-500">/100</span></p>
                  {latestWellness !== null && latestWellness < 60 && <p className="text-[10px] text-red-400 font-bold mt-1">⚠ Below threshold</p>}
                </div>
              </div>

              {/* Physical specs */}
              {athlete && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Node Specs</p>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    {[
                      ['Height', athlete.height_cm ? `${athlete.height_cm}cm` : '—'],
                      ['Weight', athlete.weight_kg ? `${athlete.weight_kg}kg` : '—'],
                      ['Sleep Goal', `${athlete.sleep_goal}h`],
                      ['Class', athlete.boat_class ?? '—'],
                      ['Position', athlete.seat_position ?? '—'],
                      ['Year', athlete.year ?? '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                        <p className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">{k}</p>
                        <p className="text-white font-black mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session telemetry */}
              {postLogsRecent.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Recent Sessions</p>
                  <div className="space-y-1">
                    {postLogsRecent.map(log => {
                      const p = log.data as PostSessionLogData
                      return (
                        <div key={log.id} className="flex items-center gap-3 py-2.5 px-2 border-b border-white/5 hover:bg-white/5 rounded-lg">
                          {p.completion === 'full' ? <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                            : p.completion === 'partial' ? <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                            : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                          <span className="text-[10px] text-gray-500 font-bold w-12 flex-shrink-0">{shortDate(log.created_at)}</span>
                          <span className="bg-white/10 rounded px-2 py-0.5 text-[10px] font-black text-white flex-shrink-0">RPE {p.rpe}</span>
                          {p.has_pain && <span className="text-[9px] text-red-400 border border-red-500/50 bg-red-950/40 px-1.5 py-0.5 rounded flex-shrink-0">⚠ Pain</span>}
                          <span className="flex-1" />
                          <span className={cn('text-[10px] font-black',
                            p.ready_tomorrow === 'yes' ? 'text-green-400' : p.ready_tomorrow === 'maybe' ? 'text-orange-400' : 'text-red-400')}>
                            {p.ready_tomorrow === 'yes' ? '✓' : p.ready_tomorrow === 'maybe' ? '~' : '✗'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRAINING LOAD TAB */}
          {activeTab === 'load' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Daily Training Load (AU = RPE × Hours)</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trainingLoadData} margin={CHART_MARGIN}>
                      <defs>
                        <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={80} stroke="rgba(239,68,68,0.5)" strokeDasharray="4 4" label={{ value: 'High', fill: 'rgba(239,68,68,0.7)', fontSize: 9 }} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="Load" stroke="#f97316" strokeWidth={2} fill="url(#loadGrad)" dot={{ r: 3, fill: '#f97316', stroke: '#000', strokeWidth: 1 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Weekly Load (Last 4 Weeks)</p>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyLoadData} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="week" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={80} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="Load" radius={[6, 6, 0, 0]}>
                        {weeklyLoadData.map((d, i) => (
                          <Cell key={i} fill={d.Load > 80 ? '#ef4444' : '#f97316'} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-white/5 rounded-xl p-3 border border-white/5">
                <TrendingUp className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span>7-day total: <strong className="text-orange-400">{weeklyLoad7d.toFixed(1)} AU</strong> · Threshold: 80 AU/week for high intensity warning</span>
              </div>
            </div>
          )}

          {/* RECOVERY TAB */}
          {activeTab === 'recovery' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Recovery Status (1=Poor · 5=Peak)</p>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recoveryData} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[1, 5]} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={3} stroke="rgba(250,204,21,0.4)" strokeDasharray="4 4" />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="Recovery" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3, fill: '#000', stroke: '#4ade80', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#4ade80' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Split achievement donut */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Split Achievement</p>
                  {splitPieData.length > 0 ? (
                    <>
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={splitPieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                              {splitPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip {...TOOLTIP_STYLE} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-2 justify-center flex-wrap mt-1">
                        {splitPieData.map(d => (
                          <div key={d.name} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                            <span className="text-[9px] text-gray-400 font-bold">{d.name} ({d.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-xs text-center py-8">No data</p>
                  )}
                </div>

                {/* Readiness */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Readiness</p>
                  <div className="space-y-3 mt-4">
                    {[
                      { label: 'Ready', count: readinessCounts.yes, color: '#4ade80', total: postLogs14.length },
                      { label: 'Uncertain', count: readinessCounts.maybe, color: '#facc15', total: postLogs14.length },
                    ].map(({ label, count, color, total }) => (
                      <div key={label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400 font-bold uppercase tracking-widest">{label}</span>
                          <span className="font-black" style={{ color }}>{count}/{total}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: total > 0 ? `${count / total * 100}%` : '0%', background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WELLNESS TAB */}
          {activeTab === 'wellness' && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Composite Wellness Score (/100)</p>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wellnessData} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={70} stroke="rgba(250,204,21,0.4)" strokeDasharray="4 4" label={{ value: '70', fill: 'rgba(250,204,21,0.6)', fontSize: 9 }} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="Score" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 3, fill: '#000', stroke: '#a78bfa', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-gray-500 mt-2">Score = Sleep(30%) + Energy(25%) + Low-Stress(25%) + Motivation(20%)</p>
              </div>

              {/* Soreness heatmap / bar */}
              {sorenessData.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Soreness Frequency (14 days)</p>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sorenessData} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="part" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="Frequency" radius={[0, 6, 6, 0]}>
                          {sorenessData.map((d, i) => (
                            <Cell key={i} fill={d.avgLevel >= 4 ? '#ef4444' : d.avgLevel >= 3 ? '#f97316' : '#facc15'} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-3 mt-2">
                    {[['#ef4444', 'Severe (4-5)'], ['#f97316', 'Moderate (3)'], ['#facc15', 'Mild (1-2)']].map(([c, l]) => (
                      <div key={l} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                        <span className="text-[9px] text-gray-500">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic load */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">
                  <BookOpen className="h-3 w-3 inline mr-1" /> Academic Load
                </p>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={academicData} margin={CHART_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 6]} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="Stress" stroke="#f87171" strokeWidth={2} dot={{ r: 2, fill: '#f87171' }} name="Academic Stress" />
                      <Line type="monotone" dataKey="Classes" stroke="#93c5fd" strokeWidth={2} strokeDasharray="4 2" dot={false} name="Classes/day" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-red-400" /><span className="text-[9px] text-gray-500">Stress</span></div>
                  <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-blue-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 4px, transparent 4px, transparent 6px)' }} /><span className="text-[9px] text-gray-500">Classes</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
