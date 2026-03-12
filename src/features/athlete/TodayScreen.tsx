import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegisterPush } from '@/hooks/useRegisterPush'
import {
  Flame, Moon, Zap, Brain, Activity, MessageSquare,
  CheckCircle2, ChevronRight, AlertTriangle, BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useTodaySession } from '@/hooks/useSessions'
import { useWellnessLogs } from '@/hooks/useWellnessLogs'
import { useAllConversations } from '@/hooks/useMessages'
import { useTeam } from '@/hooks/useTeam'
import { sessionTypeColor, intensityColor, cn } from '@/lib/utils'
import type { MorningLogData, PostSessionLogData } from '@/types/database'
import MorningCheckinForm from './MorningCheckinForm'
import PostSessionForm from './PostSessionForm'
import EveningCheckinForm from './EveningCheckinForm'

export default function TodayScreen() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  useRegisterPush() // Register for Web Push notifications silently on first load
  const [showMorning, setShowMorning] = useState(false)
  const [showPost, setShowPost] = useState(false)
  const [showEvening, setShowEvening] = useState(false)
  const [morningDone, setMorningDone] = useState(false)
  const [postDone, setPostDone] = useState(false)
  const [eveningDone, setEveningDone] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const { data: team } = useTeam(user?.team_id)
  const coachId = team?.coach_id

  const { session: todaySession } = useTodaySession(user?.team_id)
  const { data: myLogs = [] } = useWellnessLogs(user?.id, { days: 30 })
  const { data: allMessages = [] } = useAllConversations(user?.id)

  // Check if athlete has submitted morning check-in today
  const existingMorning = myLogs.find(
    l => l.log_type === 'morning' && l.created_at.startsWith(today)
  )
  const hasMorningCheckin = morningDone || !!existingMorning
  const morningData = existingMorning?.data as MorningLogData | undefined

  // Check if post-session done
  const existingPost = myLogs.find(
    l => l.log_type === 'post' && l.created_at.startsWith(today)
  )
  const hasPostCheckin = postDone || !!existingPost

  // Unread messages
  const unreadMessages = allMessages.filter(
    m => m.receiver_id === user?.id && !m.read_at
  )

  // Streak: count consecutive days with morning check-in
  const morningLogDates = myLogs
    .filter(l => l.log_type === 'morning')
    .map(l => l.created_at.split('T')[0])
    .sort((a, b) => b.localeCompare(a))

  let streak = hasMorningCheckin ? 1 : 0
  if (morningLogDates.includes(today)) {
    streak = 1
    const dt = new Date(today)
    for (let i = 1; i < 30; i++) {
      dt.setDate(dt.getDate() - 1)
      const ds = dt.toISOString().split('T')[0]
      if (morningLogDates.includes(ds)) streak++
      else break
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-2xl px-3 py-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-lg font-black text-orange-600 leading-none">{streak}</p>
              <p className="text-xs text-orange-500">day streak</p>
            </div>
          </div>
        )}
      </div>

      {/* Morning Check-in prompt */}
      {!hasMorningCheckin && (
        <div
          className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowMorning(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base mb-1">Morning Check-in</p>
              <p className="text-blue-200 text-sm">How are you feeling today? ~90 sec</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="accent" size="sm" className="bg-white text-[#1e3a5f] hover:bg-white/90">
              Start Check-in →
            </Button>
          </div>
        </div>
      )}

      {/* Morning summary if done */}
      {hasMorningCheckin && morningData && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="font-semibold text-green-800">Morning check-in complete</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <Moon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold">{Number(morningData.sleep_hours).toFixed(1)}h sleep</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold">Energy {morningData.energy}/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold">Stress {morningData.stress}/5</span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Session */}
      {todaySession ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Today's Session</CardTitle>
              <div className="flex gap-2">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold text-white', sessionTypeColor(todaySession.type))}>
                  {todaySession.type}
                </span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', intensityColor(todaySession.intensity))}>
                  {todaySession.intensity}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Duration</p>
                <p className="font-bold text-slate-900">{todaySession.duration}min</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Split</p>
                <p className="font-bold text-slate-900">{todaySession.target_split ?? '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500">Rate</p>
                <p className="font-bold text-slate-900">{todaySession.stroke_rate ? `r${todaySession.stroke_rate}` : '—'}</p>
              </div>
            </div>

            {todaySession.warmup && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Warmup</p>
                <p className="text-sm text-slate-700">{todaySession.warmup}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Main Set</p>
              <p className="text-sm text-slate-900 font-medium">{todaySession.main_set}</p>
            </div>
            {todaySession.cooldown && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cooldown</p>
                <p className="text-sm text-slate-700">{todaySession.cooldown}</p>
              </div>
            )}
            {todaySession.is_notes_public && todaySession.coach_notes && (
              <div className="bg-[#1e3a5f]/5 rounded-xl p-3">
                <p className="text-xs font-semibold text-[#1e3a5f] mb-1">Coach's Note</p>
                <p className="text-sm text-slate-700 italic">"{todaySession.coach_notes}"</p>
              </div>
            )}

            {/* Post-session check-in */}
            {!hasPostCheckin ? (
              <Button className="w-full" variant="outline" onClick={() => setShowPost(true)}>
                Log Post-Session Check-in
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Post-session check-in logged
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-slate-500">No session scheduled for today</p>
            <p className="text-sm text-slate-400 mt-1">Check the calendar for upcoming sessions</p>
          </CardContent>
        </Card>
      )}

      {/* Academic Load */}
      {morningData?.exam_this_week && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Exam week</p>
            <p className="text-yellow-700 text-sm">Your coach has been notified about your academic load.</p>
          </div>
        </div>
      )}

      {/* Messages from Coach */}
      {unreadMessages.length > 0 && (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/athlete/messages')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#1e3a5f]/10 rounded-full p-2">
                <MessageSquare className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">
                  {unreadMessages.length} unread message{unreadMessages.length > 1 ? 's' : ''} from coach
                </p>
                <p className="text-xs text-slate-500 line-clamp-1">{unreadMessages[0]?.content}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evening log prompt */}
      {!eveningDone && hasMorningCheckin && (
        <div
          className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowEvening(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base mb-1">Evening Log</p>
              <p className="text-indigo-200 text-sm">Nutrition · Hydration · Sleep plan ~60 sec</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Moon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="accent" size="sm" className="bg-white text-indigo-700 hover:bg-white/90">
              Log Evening →
            </Button>
          </div>
        </div>
      )}

      {eveningDone && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
          <p className="font-semibold text-indigo-800 text-sm">Evening log complete</p>
        </div>
      )}

      {/* Injury flag shortcut */}
      <button
        className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-left hover:bg-red-100 transition-colors"
        onClick={() => navigate('/athlete/injury')}
      >
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-800 text-sm">Flag an Injury or Pain</p>
          <p className="text-red-600 text-xs">Alert your coach immediately</p>
        </div>
        <ChevronRight className="h-4 w-4 text-red-300 ml-auto" />
      </button>

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
