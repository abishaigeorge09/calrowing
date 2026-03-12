import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ChevronLeft, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_SESSIONS } from '@/lib/mock-data'
import { useTeamAthletes } from '@/hooks/useTeamAthletes'
import { useTeamWellnessLogs } from '@/hooks/useWellnessLogs'
import { useDeleteSession } from '@/hooks/mutations'
import { localDateStr } from '@/lib/utils'
import type { Session, PostSessionLogData } from '@/types/database'
import LoginPage from '@/features/auth/LoginPage'
import RegisterCoachPage from '@/features/auth/RegisterCoachPage'
import RegisterAthletePage from '@/features/auth/RegisterAthletePage'
import AppShell from '@/components/layout/AppShell'
import CoachDashboard from '@/features/coach/CoachDashboard'
import RosterPage from '@/features/coach/RosterPage'
import CalendarPage from '@/features/coach/CalendarPage'
import AthleteProfile from '@/features/coach/AthleteProfile'
import CoachProfilePage from '@/features/coach/CoachProfilePage'
import TodayScreen from '@/features/athlete/TodayScreen'
import WellnessHistoryPage from '@/features/athlete/WellnessHistoryPage'
import InjuryFlagPage from '@/features/athlete/InjuryFlagPage'
import AthleteCalendarPage from '@/features/athlete/AthleteCalendarPage'
import AthleteProfilePage from '@/features/athlete/AthleteProfilePage'
import MessagesPage from '@/features/messaging/MessagesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
  },
})

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'coach' | 'athlete' }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'coach' ? '/coach' : '/athlete'} replace />
  }
  return <>{children}</>
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0f2d52] to-[#1e3a5f] flex flex-col">
      <div className="flex-1 bg-white rounded-t-3xl mt-20 px-6 pt-8 pb-8">
        <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
        <p className="text-slate-500 text-sm mb-6">Enter your email to receive a reset link</p>
        {sent ? (
          <div className="text-center py-8">
            <p className="text-green-600 font-semibold">Reset link sent! Check your email.</p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="space-y-4">
            <input type="email"
              className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 focus:outline-none focus:border-[#1e3a5f]"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="w-full h-11 bg-[#1e3a5f] text-white rounded-xl font-semibold">
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteSession = useDeleteSession()

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: async (): Promise<Session | null> => {
      if (!IS_SUPABASE) return (MOCK_SESSIONS.find(s => s.id === id) ?? null) as Session | null
      const { data, error } = await supabase.from('sessions').select('*').eq('id', id!).single()
      if (error) return null
      return data as Session
    },
    enabled: !!id,
  })

  // Athlete completion data (coach only)
  const { data: athletes = [] } = useTeamAthletes(user?.team_id)
  const { data: teamLogs = [] } = useTeamWellnessLogs(user?.team_id, { days: 60 })

  const handleDelete = async () => {
    if (!id) return
    await deleteSession.mutateAsync(id)
    navigate(-1)
  }

  if (isLoading) return (
    <div className="px-4 py-5 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-4"><ChevronLeft className="h-5 w-5" /> Back</button>
      <div className="text-center text-slate-400 py-12">Loading session…</div>
    </div>
  )

  if (!session) return (
    <div className="px-4 py-5 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 mb-4"><ChevronLeft className="h-5 w-5" /> Back</button>
      <div className="text-center text-slate-500 py-12">Session not found</div>
    </div>
  )

  // Parse session date at local noon to avoid UTC-shift for date-only strings
  const sessionDateLabel = new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

  // Athlete post-session completion for this session's date
  const postLogsForDate = teamLogs.filter(
    l => l.log_type === 'post' && localDateStr(new Date(l.created_at)) === session.date
  )
  const isPast = session.date <= localDateStr()

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{session.type} Session</h1>
          <p className="text-sm text-slate-500">{sessionDateLabel}</p>
        </div>
        {/* Delete */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Cancel session"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-slate-500 px-2 py-1 rounded-lg hover:bg-slate-100">
              Keep
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteSession.isPending}
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-60"
            >
              {deleteSession.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Session details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {([
            ['Duration', `${session.duration}min`],
            ['Intensity', session.intensity],
            ['Target Split', session.target_split ?? '—'],
            ['Stroke Rate', session.stroke_rate ? `r${session.stroke_rate}` : '—'],
            ['HR Zone', session.hr_zone ?? '—'],
            ['Assigned To', session.assigned_to === 'whole_team' ? 'Whole Team' : session.assigned_to],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{k}</p>
              <p className="font-bold text-slate-900 text-sm">{v}</p>
            </div>
          ))}
        </div>
        {session.warmup && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Warmup</p>
            <p className="text-sm text-slate-700">{session.warmup}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Main Set</p>
          <p className="text-sm font-medium text-slate-900">{session.main_set}</p>
        </div>
        {session.cooldown && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cooldown</p>
            <p className="text-sm text-slate-700">{session.cooldown}</p>
          </div>
        )}
        {session.coach_notes && (
          <div className={session.is_notes_public ? 'bg-[#1e3a5f]/5 rounded-xl p-3' : 'bg-amber-50 rounded-xl p-3 border border-amber-200'}>
            <p className="text-xs font-semibold text-[#1e3a5f] mb-1">
              Coach Note {!session.is_notes_public && <span className="text-amber-600">(private)</span>}
            </p>
            <p className="text-sm italic text-slate-700">"{session.coach_notes}"</p>
          </div>
        )}
      </div>

      {/* Athlete Completion Panel (only for past/today sessions) */}
      {isPast && athletes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-900 text-sm">Athlete Completion</p>
            <span className="text-xs text-slate-500">
              {postLogsForDate.length}/{athletes.length} submitted
            </span>
          </div>
          <div className="space-y-2">
            {athletes.map(athlete => {
              const log = postLogsForDate.find(l => l.athlete_id === athlete.id)
              const post = log?.data as PostSessionLogData | undefined
              return (
                <div
                  key={athlete.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 rounded-lg px-1 -mx-1"
                  onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                >
                  {/* Status icon */}
                  {log ? (
                    post?.completion === 'full'
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      : post?.completion === 'partial'
                      ? <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  )}

                  {/* Name */}
                  <p className="flex-1 text-sm font-medium text-slate-900 truncate">{athlete.name}</p>

                  {/* Stats if submitted */}
                  {post && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="bg-slate-100 rounded-md px-1.5 py-0.5 font-semibold">RPE {post.rpe}</span>
                      {post.has_pain && <span className="text-red-500 font-semibold">⚠ Pain</span>}
                      <span className={
                        post.ready_tomorrow === 'yes' ? 'text-green-600' :
                        post.ready_tomorrow === 'maybe' ? 'text-orange-500' : 'text-red-500'
                      }>
                        {post.ready_tomorrow === 'yes' ? '✓ Ready' : post.ready_tomorrow === 'maybe' ? '~ Maybe' : '✗ Not ready'}
                      </span>
                    </div>
                  )}
                  {!log && <span className="text-xs text-slate-300">Not submitted</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function AcademicSchedulePage() {
  const navigate = useNavigate()
  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600">
        <ChevronLeft className="h-5 w-5" /> Back
      </button>
      <h1 className="text-xl font-bold">Academic Schedule</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-slate-500 text-sm">Academic schedule management is available from your profile settings. Your current schedule was saved during onboarding.</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user } = useAuthStore()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/coach" element={<RegisterCoachPage />} />
          <Route path="/register/athlete" element={<RegisterAthletePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/coach" element={<ProtectedRoute requiredRole="coach"><AppShell /></ProtectedRoute>}>
            <Route index element={<CoachDashboard />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="athlete/:id" element={<AthleteProfile />} />
            <Route path="session/:id" element={<SessionDetailPage />} />
            <Route path="profile" element={<CoachProfilePage />} />
          </Route>
          <Route path="/athlete" element={<ProtectedRoute requiredRole="athlete"><AppShell /></ProtectedRoute>}>
            <Route index element={<TodayScreen />} />
            <Route path="calendar" element={<AthleteCalendarPage />} />
            <Route path="history" element={<WellnessHistoryPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<AthleteProfilePage />} />
            <Route path="injury" element={<InjuryFlagPage />} />
            <Route path="academic" element={<AcademicSchedulePage />} />
          </Route>
          <Route path="/" element={
            user ? <Navigate to={user.role === 'coach' ? '/coach' : '/athlete'} replace /> : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
