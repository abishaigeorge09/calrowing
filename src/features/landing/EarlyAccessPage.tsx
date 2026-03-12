import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Waves, CheckCircle2, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { IS_SUPABASE } from '@/lib/db'

type Role = 'coach' | 'athlete'

interface FormState {
  name: string
  email: string
  role: Role
  school_or_team: string
  reason: string
}

export default function EarlyAccessPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    role: 'athlete',
    school_or_team: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (IS_SUPABASE) {
        const { error: sbError } = await supabase.from('waitlist').insert({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          school_or_team: form.school_or_team.trim() || null,
          reason: form.reason.trim() || null,
        })
        if (sbError) throw new Error(sbError.message)
      }
      // In demo mode we skip the DB write and go straight to success
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-[#0f2d52] via-[#1e3a5f] to-[#2d5a8e]">

      {/* Header */}
      <div className="px-5 pt-safe-top pt-4 pb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Waves className="h-6 w-6 text-orange-400" strokeWidth={2.5} />
          <span className="text-white font-black text-xl tracking-tight">RowIQ</span>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10 overflow-y-auto">

        {success ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-green-100 rounded-full p-4 mb-5">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">You're on the list!</h2>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              Thanks for your interest in RowIQ. We'll reach out when your early access is ready.
            </p>
            <p className="text-slate-400 text-xs mt-6">Taking you to sign in…</p>
          </div>
        ) : (
          /* ── Form ── */
          <>
            <div className="mb-7">
              <h1 className="text-2xl font-black text-slate-900 mb-1">Get early access</h1>
              <p className="text-slate-500 text-sm">Tell us a bit about yourself so we can make RowIQ great for you.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Full name <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Alex Chen"
                  value={form.name}
                  onChange={set('name')}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a5f] transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a5f] transition-colors"
                />
              </div>

              {/* Role toggle */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  I am a… <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  {(['athlete', 'coach'] as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, role: r }))}
                      className={`h-10 rounded-lg text-sm font-bold capitalize transition-all ${
                        form.role === r
                          ? 'bg-white text-[#1e3a5f] shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* School / team */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="school">
                  School or team <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="school"
                  type="text"
                  placeholder="UC Berkeley Rowing"
                  value={form.school_or_team}
                  onChange={set('school_or_team')}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a5f] transition-colors"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="reason">
                  What would you use RowIQ for? <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  placeholder={
                    form.role === 'coach'
                      ? 'e.g. Track athlete wellness, manage training loads, get early injury signals…'
                      : 'e.g. Keep my coach updated on how I'm feeling, track my training history…'
                  }
                  value={form.reason}
                  onChange={set('reason')}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a5f] transition-colors resize-none leading-relaxed"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-[#1e3a5f] hover:bg-[#162d4a] disabled:opacity-60 text-white font-bold text-base rounded-xl transition-colors mt-2"
              >
                {submitting ? 'Submitting…' : "Join the waitlist →"}
              </button>

              <p className="text-center text-slate-400 text-xs">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#1e3a5f] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>

            </form>
          </>
        )}
      </div>
    </div>
  )
}
