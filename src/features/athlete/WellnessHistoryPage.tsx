import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Moon, Zap, Brain, Activity, Hexagon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useWellnessLogs } from '@/hooks/useWellnessLogs'
import { useSessions } from '@/hooks/useSessions'
import type { MorningLogData, PostSessionLogData } from '@/types/database'
import { formatDate, cn } from '@/lib/utils'

export default function WellnessHistoryPage() {
  const { user } = useAuthStore()
  const [range, setRange] = useState<7 | 14 | 30>(14)
  const [activeTab, setActiveTab] = useState<'sleep' | 'energy' | 'rpe'>('sleep')

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
    <div className="px-4 py-8 space-y-6 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> System Diagnostics
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            Historical Telemetry
          </p>
        </div>
        
        {/* Range Selector */}
        <div className="flex bg-black/40 border border-white/10 rounded-2xl p-1 gap-1 shadow-inner">
          {([7, 14, 30] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all',
                range === r 
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              )}>
              {r}D
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Pwr (H)', value: String(avgSleep), icon: Moon, color: 'text-blue-400', shadow: 'rgba(96,165,250,0.5)' },
          { label: 'Integrity', value: `${completionRate}%`, icon: Activity, color: 'text-green-400', shadow: 'rgba(74,222,128,0.5)' },
          { label: 'Avg Strain', value: String(avgRPE), icon: Zap, color: 'text-orange-400', shadow: 'rgba(251,146,60,0.5)' },
          { label: 'Dmg Cycles', value: String(sorenessDays), icon: Brain, color: 'text-purple-400', shadow: 'rgba(192,132,252,0.5)' },
        ].map(({ label, value, icon: Icon, color, shadow }) => (
          <div key={label} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 text-center shadow-[0_0_20px_rgba(0,0,0,0.5)] group hover:bg-white/10 transition-colors">
            <div className={cn(
               'w-10 h-10 mx-auto rounded-full bg-black/40 flex items-center justify-center border border-white/5 mb-3 group-hover:scale-110 transition-transform shadow-inner',
               // hacky way to add dynamic colored dropshadow
               `drop-shadow-[0_0_8px_${shadow.replace('0.5','0.8')}]`
             )}>
              <Icon className={cn('h-4 w-4 drop-shadow-[0_0_5px_currentColor]', color)} />
            </div>
            <p className="text-2xl font-black tracking-tight text-white mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{value}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">{label}</p>
          </div>
        ))}
      </div>

       {/* Charts Segment */}
       <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Trend Analysis</h2>
        
        {/* Custom Tabs */}
        <div className="flex gap-2 mb-8 bg-black/40 p-1 rounded-2xl border border-white/5 shadow-inner w-full md:w-fit">
          {[
            { id: 'sleep', label: 'Power (Sleep)' },
            { id: 'energy', label: 'Lvl & Str (En/St)' },
            { id: 'rpe', label: 'Strain (RPE)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all',
                activeTab === tab.id
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Render */}
        <div className="h-[250px] w-full text-xs font-mono font-bold">
          {activeTab === 'sleep' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} interval={Math.floor(chartData.length / 5)} />
                <YAxis domain={[4, 10]} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(v) => [`${v}H`, 'Power']}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                />
                <ReferenceLine y={8} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: 'Target', position: 'insideTopLeft', fill: 'rgba(255,255,255,0.4)', fontSize: 10, textAnchor: 'start', dy: 15 }} />
                <Line type="monotone" dataKey="Sleep" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#60a5fa' }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'energy' && (
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} interval={Math.floor(chartData.length / 5)} />
                  <YAxis domain={[1, 5]} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                  />
                  <Line type="monotone" dataKey="Energy" stroke="#facc15" strokeWidth={3} dot={{ r: 4, fill: '#713f12', stroke: '#facc15', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#facc15' }} />
                  <Line type="monotone" dataKey="Stress" stroke="#c084fc" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
          )}

          {activeTab === 'rpe' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.filter(d => d.RPE !== undefined)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} interval={Math.floor(chartData.length / 5)} />
                <YAxis domain={[1, 10]} stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                />
                <Line type="monotone" dataKey="RPE" stroke="#fb8c00" strokeWidth={3} dot={{ r: 4, fill: '#7c2d12', stroke: '#fb8c00', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fb8c00' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Chart Legend (for Energy tab) */}
         {activeTab === 'energy' && (
          <div className="flex gap-6 justify-center mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Level (Energy)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-purple-400 border-dashed border-purple-400 border-t-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Str (Stress)</span>
            </div>
          </div>
        )}
      </div>

       {/* Recent logs */}
       <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 mt-6">
        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 border-b border-white/5 pb-4">Recent Execution Cycles</h2>
        
        <div className="space-y-2">
           {postLogs.length === 0 ? (
             <div className="text-center py-6 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
               <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">No telemetry recorded</p>
             </div>
           ) : (
            postLogs.slice(0, 7).map(log => {
              const d = log.data as PostSessionLogData
              const dateStr = log.created_at.split('T')[0]
              const session = sessions.find(s => s.date === dateStr)
              return (
                <div key={log.id} className="flex items-center gap-4 py-3 px-4 bg-black/40 border border-white/5 rounded-2xl shadow-inner hover:bg-black/60 transition-colors">
                  <div className={cn(
                    'w-1.5 h-10 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]',
                    d.completion === 'full' ? 'bg-green-500 text-green-500' : 
                    d.completion === 'partial' ? 'bg-yellow-500 text-yellow-500' : 'bg-red-500 text-red-500'
                  )} />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm tracking-wide">
                      {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">
                      {session?.type ?? 'Cycle'} <span className="text-white/20 px-1">|</span> RPE {d.rpe}/10
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={cn(
                      'text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border',
                      d.completion === 'full' ? 'bg-green-950/40 border-green-500/50 text-green-400' :
                      d.completion === 'partial' ? 'bg-yellow-950/40 border-yellow-500/50 text-yellow-400' :
                      'bg-red-950/40 border-red-500/50 text-red-500'
                    )}>
                      {d.completion === 'full' ? 'Done' : d.completion === 'partial' ? 'Partial' : 'DNF'}
                    </span>
                    {d.has_pain && <p className="text-[9px] text-red-400 uppercase font-black tracking-widest drop-shadow-[0_0_5px_rgba(248,113,113,0.5)] mt-0.5">Dmg Flag</p>}
                  </div>
                </div>
              )
            })
           )}
        </div>
      </div>
    </div>
  )
}
