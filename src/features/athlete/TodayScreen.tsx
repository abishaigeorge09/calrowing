import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegisterPush } from '@/hooks/useRegisterPush'
import {
  Flame, Moon, Zap, Brain, Activity, MessageSquare,
  CheckCircle2, ChevronRight, AlertTriangle, BookOpen, Hexagon, ClipboardList
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useTodaySession } from '@/hooks/useSessions'
import { useWellnessLogs } from '@/hooks/useWellnessLogs'
import { useAllConversations } from '@/hooks/useMessages'
import { useTeam } from '@/hooks/useTeam'
import { useSurveyAssignments } from '@/hooks/useSurveys'
import { sessionTypeColor, intensityColor, localDateStr, cn } from '@/lib/utils'
import type { MorningLogData } from '@/types/database'
import MorningCheckinForm from './MorningCheckinForm'
import PostSessionForm from './PostSessionForm'
import EveningCheckinForm from './EveningCheckinForm'

export default function TodayScreen() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  useRegisterPush()
  const [showMorning, setShowMorning] = useState(false)
  const [showPost, setShowPost] = useState(false)
  const [showEvening, setShowEvening] = useState(false)
  const [morningDone, setMorningDone] = useState(false)
  const [postDone, setPostDone] = useState(false)
  const [eveningDone, setEveningDone] = useState(false)

  const today = localDateStr()

  const { data: team } = useTeam(user?.team_id)
  const coachId = team?.coach_id

  const { data: surveyAssignments = [] } = useSurveyAssignments(user?.id)

  const { session: todaySession } = useTodaySession(user?.team_id)
  const { data: myLogs = [] } = useWellnessLogs(user?.id, { days: 30 })
  const { data: allMessages = [] } = useAllConversations(user?.id)

  const existingMorning = myLogs.find(
    l => l.log_type === 'morning' && localDateStr(new Date(l.created_at)) === today
  )
  const hasMorningCheckin = morningDone || !!existingMorning
  const morningData = existingMorning?.data as MorningLogData | undefined

  const existingPost = myLogs.find(
    l => l.log_type === 'post' && localDateStr(new Date(l.created_at)) === today
  )
  const hasPostCheckin = postDone || !!existingPost

  const unreadMessages = allMessages.filter(
    m => m.receiver_id === user?.id && !m.read_at
  )

  const morningLogDates = myLogs
    .filter(l => l.log_type === 'morning')
    .map(l => localDateStr(new Date(l.created_at)))
    .sort((a, b) => b.localeCompare(a))

  let streak = hasMorningCheckin ? 1 : 0
  if (morningLogDates.includes(today)) {
    streak = 1
    const dt = new Date()
    for (let i = 1; i < 30; i++) {
      dt.setDate(dt.getDate() - 1)
      const ds = localDateStr(dt)
      if (morningLogDates.includes(ds)) streak++
      else break
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 py-8 space-y-6 max-w-2xl mx-auto font-sans text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
           <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
            <Hexagon className="h-5 w-5 text-gray-400" /> {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-950/40 border border-orange-500/50 rounded-2xl px-4 py-2 shadow-[0_0_15px_rgba(251,146,60,0.2)]">
            <Flame className="h-6 w-6 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            <div>
              <p className="text-2xl font-black text-white tracking-widest leading-none drop-shadow-[0_0_5px_currentColor]">{streak}</p>
              <p className="text-[9px] uppercase font-bold tracking-widest text-orange-300">Day Streak</p>
            </div>
          </div>
        )}
      </div>

      {/* Morning Check-in prompt */}
      {!hasMorningCheckin && (
        <div
          className="bg-white/5 backdrop-blur-2xl border border-white/20 hover:bg-white/10 rounded-3xl p-6 cursor-pointer hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all group relative overflow-hidden"
          onClick={() => setShowMorning(true)}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[20px] rounded-full pointer-events-none group-hover:bg-white/10 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-lg font-black text-white uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Morning Check-in</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">~90 seconds</p>
            </div>
            <div className="bg-white/10 rounded-full p-4 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-shadow">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-6 relative z-10">
            <button className="bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] w-w-auto">
              Start Check-in
            </button>
          </div>
        </div>
      )}

      {/* Morning summary if done */}
      {hasMorningCheckin && morningData && (
        <div className="bg-green-950/20 border border-green-500/30 rounded-3xl p-5 shadow-inner backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4 border-b border-green-500/20 pb-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            <p className="font-black text-green-400 uppercase tracking-widest text-sm drop-shadow-[0_0_5px_rgba(74,222,128,0.2)]">Morning Check-in Done</p>
          </div>
          <div className="flex gap-6 justify-center">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-400" />
              <span className="text-[11px] uppercase font-bold tracking-widest text-gray-300">{Number(morningData.sleep_hours).toFixed(1)}h sleep</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-[11px] uppercase font-bold tracking-widest text-gray-300">Energy {morningData.energy}/5</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-[11px] uppercase font-bold tracking-widest text-gray-300">Stress {morningData.stress}/5</span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Session */}
      {todaySession ? (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="text-sm font-black text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Today's Session</h2>
            <div className="flex gap-2">
              <span className={cn('px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_10px_currentColor]', sessionTypeColor(todaySession.type).replace('bg-','text-').replace('shadow-','drop-shadow-'))}>
                {todaySession.type}
              </span>
              <span className={cn('px-2.5 py-0.5 rounded-sm text-[10px] uppercase tracking-widest font-black', intensityColor(todaySession.intensity).replace('bg-','text-').replace('text-gray-800','text-yellow-400'))}>
                {todaySession.intensity}
              </span>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Time</p>
                <p className="font-black text-xl text-white">{todaySession.duration}m</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Split</p>
                <p className="font-black text-xl text-white">{todaySession.target_split ?? '—'}</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Rate</p>
                <p className="font-black text-xl text-white">{todaySession.stroke_rate ? `r${todaySession.stroke_rate}` : '—'}</p>
              </div>
            </div>

            {todaySession.warmup && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-orange-400"/> Warmup</p>
                <p className="text-sm text-gray-300 leading-relaxed font-light">{todaySession.warmup}</p>
              </div>
            )}
            
            <div className="bg-black/60 border border-white/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.8)_inset] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[30px] rounded-full pointer-events-none" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2 relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)] flex items-center gap-2"><Activity className="w-4 h-4"/> Main Set</p>
              <p className="text-lg text-white font-medium leading-relaxed relative z-10">{todaySession.main_set}</p>
            </div>
            
            {todaySession.cooldown && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Moon className="w-3.5 h-3.5 text-blue-400"/> Cooldown</p>
                <p className="text-sm text-gray-300 leading-relaxed font-light">{todaySession.cooldown}</p>
              </div>
            )}
            
            {todaySession.is_notes_public && todaySession.coach_notes && (
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 shadow-inner">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5"/> Coach Note</p>
                <p className="text-sm text-blue-200 italic font-light">"{todaySession.coach_notes}"</p>
              </div>
            )}

            {/* Post-session check-in */}
            <div className="pt-2">
              {!hasPostCheckin ? (
                <button 
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white uppercase tracking-widest text-xs font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  onClick={() => setShowPost(true)}
                >
                  Log Post-Session
                </button>
              ) : (
                <div className="flex justify-center items-center gap-2 text-green-400 text-xs uppercase font-black tracking-widest bg-green-950/20 border border-green-500/30 py-3 rounded-xl shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                  <CheckCircle2 className="h-4 w-4 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
                  Post-Session Logged ✓
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <Hexagon className="h-10 w-10 text-white/20 mx-auto mb-4" />
          <p className="text-white text-lg font-black uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">No Session Today</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Check your calendar for upcoming sessions</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Messages from Coach */}
        {unreadMessages.length > 0 && (
          <div 
            className="bg-blue-950/40 border border-blue-500/40 rounded-3xl p-5 cursor-pointer hover:bg-blue-900/40 transition-colors shadow-inner flex items-center justify-between group"
            onClick={() => navigate('/athlete/messages')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-full p-3 shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-shadow">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-black text-white text-sm uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                  {unreadMessages.length} New Message{unreadMessages.length !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest line-clamp-1">{unreadMessages[0]?.content}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
        )}

        {/* Pending Surveys */}
        {surveyAssignments.length > 0 && (
          <div
            className="bg-purple-950/40 border border-purple-500/40 rounded-3xl p-5 cursor-pointer hover:bg-purple-900/40 transition-colors shadow-inner flex items-center justify-between group"
            onClick={() => navigate(`/athlete/survey/${surveyAssignments[0].id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 border border-purple-500/40 rounded-full p-3 shadow-[0_0_10px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-shadow">
                <ClipboardList className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-black text-white text-sm uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                  Survey Pending
                </p>
                <p className="text-[10px] text-purple-300/70 font-bold uppercase tracking-widest line-clamp-1">
                  {surveyAssignments[0].survey?.title ?? 'Coach Survey'}
                  {surveyAssignments[0].due_at && (
                    <> · Due {new Date(surveyAssignments[0].due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
          </div>
        )}

        {/* Academic Load */}
        {morningData?.exam_this_week && (
          <div className="bg-yellow-950/30 border border-yellow-500/40 rounded-3xl p-5 shadow-inner flex items-start gap-4">
            <BookOpen className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
            <div>
              <p className="font-black text-yellow-500 text-sm uppercase tracking-widest mb-1">Exam Week Active</p>
              <p className="text-[10px] text-yellow-200/70 font-bold uppercase tracking-widest leading-relaxed">Your coach has been notified.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evening log prompt */}
        {!eveningDone && hasMorningCheckin && (
          <div
            className="bg-white/5 backdrop-blur-2xl border border-white/20 hover:bg-white/10 rounded-3xl p-5 cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all group flex items-center justify-between"
            onClick={() => setShowEvening(true)}
          >
            <div>
              <p className="text-white font-black text-sm uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Evening Log</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">~60 seconds</p>
            </div>
            <div className="bg-white/10 rounded-full p-3 border border-white/20 group-hover:border-white/40 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.05)] text-white group-hover:text-black group-hover:bg-white">
              <Moon className="h-5 w-5 transition-colors" />
            </div>
          </div>
        )}

        {eveningDone && (
          <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-3xl p-5 flex items-center justify-between shadow-inner">
             <div>
              <p className="text-indigo-300 font-black text-sm uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(165,180,252,0.3)]">Evening Log Done</p>
              <p className="text-[10px] text-indigo-400/60 font-bold uppercase tracking-widest">Rest well tonight</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]" />
          </div>
        )}

        {/* Injury flag shortcut */}
        <button
          className="w-full flex items-center gap-4 bg-red-950/30 border border-red-500/40 rounded-3xl p-5 text-left hover:bg-red-900/40 transition-all group shadow-inner"
          onClick={() => navigate('/athlete/injury')}
        >
          <div className="bg-red-500/20 rounded-full p-2 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:bg-red-500/30 transition-all">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-black text-red-500 text-sm uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]">Report Injury</p>
            <p className="text-[10px] text-red-300/70 font-bold uppercase tracking-widest">Flag immediately for your coach</p>
          </div>
          <ChevronRight className="h-5 w-5 text-red-900 group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* Forms */}
      {showMorning && (
        <MorningCheckinForm
          onClose={() => setShowMorning(false)}
          onDone={() => { setMorningDone(true); setShowMorning(false) }}
          coachId={coachId}
          recentLogs={myLogs}
        />
      )}
      {showPost && todaySession && (
        <PostSessionForm
          session={todaySession}
          onClose={() => setShowPost(false)}
          onDone={() => { setPostDone(true); setShowPost(false) }}
          coachId={coachId}
        />
      )}
      {showEvening && (
        <EveningCheckinForm
          onClose={() => setShowEvening(false)}
          onDone={() => { setEveningDone(true); setShowEvening(false) }}
          coachId={coachId}
        />
      )}
    </div>
  )
}
