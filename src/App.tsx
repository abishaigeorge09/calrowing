import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ChevronLeft, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle, Link, Play, Hexagon, Calendar } from 'lucide-react'
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
import PendingApprovalPage from '@/features/auth/PendingApprovalPage'
import SuperadminDashboard from '@/features/superadmin/SuperadminDashboard'
import LandingPage from '@/features/landing/LandingPage'
import EarlyAccessPage from '@/features/landing/EarlyAccessPage'
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
import SurveysPage from '@/features/coach/SurveysPage'
import SurveyResponsePage from '@/features/athlete/SurveyResponsePage'
import { cn, sessionTypeColor, intensityColor } from '@/lib/utils'

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

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'coach' | 'athlete' | 'superadmin' }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  // Pending coaches can only see the pending approval page
  if (user.role === 'coach' && user.status === 'pending') {
    return <Navigate to="/pending-approval" replace />
  }
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />
    return <Navigate to={user.role === 'coach' ? '/coach' : '/athlete'} replace />
  }
  return <>{children}</>
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh bg-black flex flex-col font-sans text-white overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors mb-6 shadow-inner">
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h1 className="text-2xl font-black text-white mb-2 tracking-widest uppercase flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-gray-400" /> Reset Password
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Enter your email and we'll send a reset link</p>
          
          {sent ? (
            <div className="bg-green-950/40 border border-green-500/30 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden text-green-200">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[30px] rounded-full" />
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3 drop-shadow-[0_0_8px_currentColor]" />
              <p className="font-black text-sm tracking-widest uppercase mb-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">Email Sent!</p>
              <p className="text-[10px] text-green-300/70 font-bold uppercase tracking-widest">Check your inbox for a reset link</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Email Address</label>
                <input type="email"
                  className="w-full bg-black/50 border border-white/10 focus:border-white focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all shadow-inner outline-none"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-black tracking-widest uppercase text-xs rounded-xl py-4 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`
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
    <div className="px-4 py-8 max-w-2xl mx-auto text-white font-sans text-center">
      <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 mx-auto"><ChevronLeft className="h-4 w-4" /> Go Back</button>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 py-12">Loading session...</div>
    </div>
  )

  if (!session) return (
    <div className="px-4 py-8 max-w-2xl mx-auto text-white font-sans text-center">
      <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 mx-auto"><ChevronLeft className="h-4 w-4" /> Go Back</button>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 py-12">Session not found</div>
    </div>
  )

  const sessionDateLabel = new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

  const postLogsForDate = teamLogs.filter(
    l => l.log_type === 'post' && localDateStr(new Date(l.created_at)) === session.date
  )
  const isPast = session.date <= localDateStr()

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-6 text-white font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/20 text-white transition-colors shadow-inner">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gray-400" /> {session.type} Session
          </h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
            {sessionDateLabel}
          </p>
        </div>
        {/* Delete — coach only */}
        {user?.role === 'coach' && (!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 border border-white/10 bg-white/5 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors shadow-inner"
            title="Delete session"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-xl p-1 shadow-inner">
            <button onClick={() => setConfirmDelete(false)} className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1.5 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteSession.isPending}
              className="text-[10px] uppercase font-black tracking-widest bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-400 disabled:opacity-50 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            >
              {deleteSession.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>

      {/* Session details */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 p-6 space-y-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[40px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-2 gap-3 relative z-10">
          {([
            session.start_time && session.end_time
              ? ['Time', `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`]
              : ['Duration', `${session.duration}min`],
            ['Intensity', session.intensity],
            ['Target Split', session.target_split ?? '—'],
            ['Stroke Rate', session.stroke_rate ? `r${session.stroke_rate}` : '—'],
            ['HR Zone', session.hr_zone ?? '—'],
            ['Assigned To', session.assigned_to === 'whole_team' ? 'Entire Team' : session.assigned_to],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-black/40 rounded-2xl p-4 border border-white/5 shadow-inner">
              <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">{k}</p>
              <p className={cn(
                "font-black text-sm uppercase tracking-widest", 
                k === 'Intensity' ? intensityColor(v as any) : 'text-white'
              )}>{v}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 relative z-10 pt-2">
          {session.warmup && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-inner">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Warmup</p>
              <p className="text-sm font-medium text-gray-200 leading-relaxed whitespace-pre-wrap">{session.warmup}</p>
            </div>
          )}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(255,255,255,0.05)_inset]">
            <p className="text-[10px] font-black uppercase tracking-widest border-b border-white/10 pb-2 mb-3 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] flex items-center gap-2">
               <Hexagon className="h-4 w-4 opacity-50"/> Main Set
            </p>
            <p className="text-base font-black tracking-wide text-white leading-relaxed whitespace-pre-wrap">{session.main_set}</p>
          </div>
          {session.cooldown && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-inner">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Cooldown</p>
              <p className="text-sm font-medium text-gray-300 leading-relaxed whitespace-pre-wrap">{session.cooldown}</p>
            </div>
          )}
        </div>

        {session.coach_notes && (
          <div className={cn(
            "rounded-2xl p-5 shadow-inner relative z-10 border",
            session.is_notes_public ? "bg-blue-950/20 border-blue-500/20" : "bg-amber-950/20 border-amber-500/20"
          )}>
            <p className={cn(
               "text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2",
               session.is_notes_public ? "text-blue-400" : "text-amber-500"
            )}>
              Coach Note {!session.is_notes_public && <span className="opacity-60">(Private)</span>}
            </p>
            <p className={cn(
              "text-sm italic font-medium",
              session.is_notes_public ? "text-blue-200" : "text-amber-200"
            )}>"{session.coach_notes}"</p>
          </div>
        )}

        {/* Media attachments */}
        {session.media_urls && session.media_urls.length > 0 && (
          <div className="relative z-10 pt-2 border-t border-white/10 mt-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-gray-500 mb-3 block">Resources</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {session.media_urls.map((media, i) => {
                const ytMatch = media.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
                return (
                  <a
                    key={i}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group shadow-inner"
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} alt={media.title ?? 'Image'} className="h-12 w-16 object-cover rounded-lg border border-white/10 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : media.type === 'video' && ytMatch ? (
                      <div className="relative flex-shrink-0 border border-white/10 rounded-lg overflow-hidden">
                        <img src={`https://img.youtube.com/vi/${ytMatch[1]}/default.jpg`} alt="video" className="h-12 w-16 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                          <Play className="h-5 w-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-12 w-16 bg-white/5 border border-white/10 flex items-center justify-center rounded-lg flex-shrink-0">
                         <Link className="h-5 w-5 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs font-bold text-white uppercase tracking-widest truncate group-hover:text-gray-300 transition-colors">
                        {media.title || 'Resource'}
                      </p>
                      {media.title && (
                        <p className="text-[9px] text-gray-500 truncate mt-0.5" title={media.url}>{media.url}</p>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Athlete Completion Panel (only for past/today sessions) */}
      {isPast && athletes.length > 0 && (
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <p className="text-xs font-black uppercase tracking-widest text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">Athlete Check-ins</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-black/40 border border-white/5 px-2 py-1 rounded-full">
              {postLogsForDate.length}/{athletes.length} Submitted
            </span>
          </div>
          <div className="space-y-2">
            {athletes.map(athlete => {
              const log = postLogsForDate.find(l => l.athlete_id === athlete.id)
              const post = log?.data as PostSessionLogData | undefined
              return (
                <div
                  key={athlete.id}
                  className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors group shadow-inner"
                  onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                >
                  {/* Status icon */}
                  {log ? (
                    post?.completion === 'full'
                      ? <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] flex-shrink-0" />
                      : post?.completion === 'partial'
                      ? <AlertTriangle className="h-5 w-5 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] flex-shrink-0" />
                      : <XCircle className="h-5 w-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  )}

                  {/* Name */}
                  <p className="flex-1 text-xs font-bold uppercase tracking-widest text-white truncate">{athlete.name}</p>

                  {/* Stats if submitted */}
                  {post && (
                    <div className="flex items-center gap-2">
                      <span className="bg-white/10 border border-white/20 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-inner">RPE {post.rpe}</span>
                      {post.has_pain && <span className="bg-red-950/40 border border-red-500/40 text-[9px] font-black uppercase tracking-widest text-red-400 px-1.5 py-0.5 rounded-md shadow-inner">⚠ Pain</span>}
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border shadow-inner",
                        post.ready_tomorrow === 'yes' ? 'bg-green-950/40 border-green-500/40 text-green-400' :
                        post.ready_tomorrow === 'maybe' ? 'bg-orange-950/40 border-orange-500/40 text-orange-400' : 'bg-red-950/40 border-red-500/40 text-red-400'
                      )}>
                        {post.ready_tomorrow === 'yes' ? '✓ Ready' : post.ready_tomorrow === 'maybe' ? '~ Maybe' : '✗ No'}
                      </span>
                    </div>
                  )}
                  {!log && <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">No Data</span>}
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
    <div className="px-4 py-8 max-w-lg mx-auto space-y-6 text-white font-sans text-center">
      <button onClick={() => navigate(-1)} className="p-2 border border-white/10 rounded-xl bg-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 mx-auto hover:bg-white/20 hover:text-white transition-colors"><ChevronLeft className="h-4 w-4" /> Return to Hub</button>
       
       <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
           <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
             <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-4" />
             <h1 className="text-xl font-black uppercase tracking-widest text-white mb-3">Academic Schedule</h1>
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed max-w-sm mx-auto">
               Your academic schedule is managed in your profile. Tap below to update it.
             </p>
             <button onClick={() => navigate('/athlete/profile')} className="mt-8 mx-auto w-full max-w-[200px] bg-white text-black hover:bg-gray-200 text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
               Access Profile
             </button>
           </div>
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
          <Route path="/" element={
            user
              ? <Navigate to={
                  user.role === 'superadmin' ? '/superadmin' :
                  user.role === 'coach' && user.status === 'pending' ? '/pending-approval' :
                  user.role === 'coach' ? '/coach' : '/athlete'
                } replace />
              : <LandingPage />
          } />
          <Route path="/early-access" element={<EarlyAccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/coach" element={<RegisterCoachPage />} />
          <Route path="/register/athlete" element={<RegisterAthletePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route path="/superadmin" element={<ProtectedRoute requiredRole="superadmin"><SuperadminDashboard /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute requiredRole="coach"><AppShell /></ProtectedRoute>}>
            <Route index element={<CoachDashboard />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="athlete/:id" element={<AthleteProfile />} />
            <Route path="session/:id" element={<SessionDetailPage />} />
            <Route path="surveys" element={<SurveysPage />} />
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
            <Route path="survey/:assignmentId" element={<SurveyResponsePage />} />
            <Route path="session/:id" element={<SessionDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
