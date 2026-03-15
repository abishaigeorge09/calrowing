import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Hexagon, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { IS_SUPABASE } from '@/lib/db'
import { cn } from '@/lib/utils'

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
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/3 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/3 blur-[100px] rounded-full" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-5 py-5 flex items-center gap-3 border-b border-white/5">
        <button
          onClick={() => navigate('/')}
          className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Hexagon className="h-5 w-5 text-white" strokeWidth={1.5} />
          <span className="text-white font-black text-base tracking-widest uppercase">RowIQ</span>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {success ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-500/20 blur-[40px] rounded-full" />
                <div className="relative bg-green-950/40 border border-green-500/40 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)_inset]">
                  <CheckCircle2 className="h-9 w-9 text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">You're on the list</h2>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                We'll reach out when your spot is ready. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Limited Early Access</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2">Request Access</h1>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Join the waitlist for RowIQ — the performance platform built for competitive rowing.
                </p>
              </div>

              {/* Form card */}
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400" htmlFor="name">
                      Full Name <span className="text-white/30">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={set('name')}
                      className="w-full bg-black/40 border border-white/10 focus:border-white/40 focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400" htmlFor="email">
                      Email Address <span className="text-white/30">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={set('email')}
                      className="w-full bg-black/40 border border-white/10 focus:border-white/40 focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">
                      I am a <span className="text-white/30">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['athlete', 'coach'] as Role[]).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, role: r }))}
                          className={cn(
                            'py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border',
                            form.role === r
                              ? 'bg-white text-black border-white'
                              : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/25 hover:text-white'
                          )}
                        >
                          {r === 'athlete' ? '🏋️ Athlete' : '📋 Coach'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* School / team */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400" htmlFor="school">
                      School / Team <span className="text-gray-600 text-[9px] normal-case tracking-normal font-normal">(optional)</span>
                    </label>
                    <input
                      id="school"
                      type="text"
                      placeholder="e.g. UC Berkeley, Penn Rowing…"
                      value={form.school_or_team}
                      onChange={set('school_or_team')}
                      className="w-full bg-black/40 border border-white/10 focus:border-white/40 focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                    />
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400" htmlFor="reason">
                      How will you use RowIQ? <span className="text-gray-600 text-[9px] normal-case tracking-normal font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="reason"
                      rows={3}
                      placeholder={
                        form.role === 'coach'
                          ? 'e.g. Track athlete wellness, manage training sessions…'
                          : 'e.g. Log daily check-ins, monitor my recovery…'
                      }
                      value={form.reason}
                      onChange={set('reason')}
                      className="w-full bg-black/40 border border-white/10 focus:border-white/40 focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase tracking-widest text-xs rounded-xl transition-all hover:bg-gray-100 flex items-center justify-center gap-2 group"
                  >
                    {submitting ? 'Submitting…' : (
                      <>
                        Request Access
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <p className="text-center text-gray-500 text-xs mt-5">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-white hover:text-gray-300 transition-colors font-semibold"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
