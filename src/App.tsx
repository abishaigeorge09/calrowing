import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { MOCK_SESSIONS } from '@/lib/mock-data'
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
  const session = MOCK_SESSIONS.find(s => s.id === id)
  if (!session) return <div className="p-6 text-center text-slate-500">Session not found</div>
  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ChevronLeft className="h-5 w-5" /> Back
      </button>
      <h1 className="text-xl font-bold">
        {session.type} — {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {([
            ['Duration', `${session.duration}min`],
            ['Intensity', session.intensity],
            ['Target Split', session.target_split ?? '—'],
            ['Stroke Rate', session.stroke_rate ? `r${session.stroke_rate}` : '—'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{k}</p>
              <p className="font-bold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        {session.warmup && <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Warmup</p><p className="text-sm">{session.warmup}</p></div>}
        <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Main Set</p><p className="text-sm font-medium">{session.main_set}</p></div>
        {session.cooldown && <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Cooldown</p><p className="text-sm">{session.cooldown}</p></div>}
        {session.is_notes_public && session.coach_notes && (
          <div className="bg-[#1e3a5f]/5 rounded-xl p-3">
            <p className="text-xs font-semibold text-[#1e3a5f] mb-1">Coach Note</p>
            <p className="text-sm italic">"{session.coach_notes}"</p>
          </div>
        )}
      </div>
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
