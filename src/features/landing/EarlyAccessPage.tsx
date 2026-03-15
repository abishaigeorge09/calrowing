import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Hexagon, Terminal } from 'lucide-react'
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
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transmission failed. Retrying required.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col font-sans bg-black text-white px-4 pb-10 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col pt-safe-top">
        {/* Header */}
        <div className="py-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 group cursor-pointer justify-center ml-2">
            <Hexagon className="h-6 w-6 text-white" strokeWidth={1.5} />
            <span className="text-white font-black text-xl tracking-widest uppercase">RowIQ</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {success ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center py-12 text-center relative">
              <div className="absolute inset-0 bg-green-500/20 blur-[40px] rounded-full z-0" />
              <div className="relative bg-green-950/40 border-2 border-green-500/50 rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)_inset] z-10">
                <CheckCircle2 className="h-10 w-10 text-green-400 drop-shadow-[0_0_10px_currentColor]" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3 relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">
                Access Request Logged
              </h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest max-w-[200px] leading-relaxed relative z-10">
                Awaiting node clearance. Redirecting to access terminal.
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="mb-8 border-b border-white/10 pb-4">
                <h1 className="text-xl font-black tracking-widest uppercase text-white mb-2 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-gray-400" />
                  Terminal Access
                </h1>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  Register node identity for early array access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400" htmlFor="name">
                    Identity Sequence <span className="text-white/40">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Subject Name"
                    value={form.name}
                    onChange={set('name')}
                    className="w-full bg-black/50 border border-white/10 focus:border-white focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all shadow-inner outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400" htmlFor="email">
                    Comlink (Email) <span className="text-white/40">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="subject@node.net"
                    value={form.email}
                    onChange={set('email')}
                    className="w-full bg-black/50 border border-white/10 focus:border-white focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all shadow-inner outline-none"
                  />
                </div>

                {/* Role toggle */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block mb-2">
                    Node Designation <span className="text-white/40">*</span>
                  </label>
                  <div className="flex gap-3">
                    {(['athlete', 'coach'] as Role[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, role: r }))}
                        className={cn(
                          'flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border',
                          form.role === r
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-[1.02]'
                            : 'bg-black/50 text-gray-500 border-white/10 hover:border-white/30'
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* School / team */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400" htmlFor="school">
                    Affiliated Array <span className="text-gray-600 font-bold">(Opt)</span>
                  </label>
                  <input
                    id="school"
                    type="text"
                    placeholder="Team/Institution"
                    value={form.school_or_team}
                    onChange={set('school_or_team')}
                    className="w-full bg-black/50 border border-white/10 focus:border-white focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all shadow-inner outline-none"
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-gray-400" htmlFor="reason">
                    Operational Intent <span className="text-gray-600 font-bold">(Opt)</span>
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    placeholder={
                      form.role === 'coach'
                        ? "E.g. monitor fleet telemetry, broadcast protocols..."
                        : "E.g. transmit regen logs, view session data..."
                    }
                    value={form.reason}
                    onChange={set('reason')}
                    className="w-full bg-black/50 border border-white/10 focus:border-white focus:bg-white/5 text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm transition-all shadow-inner outline-none resize-none leading-relaxed"
                  />
                </div>

                {error && (
                  <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-xs uppercase font-bold tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 mt-6 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                >
                  {submitting ? 'Transmitting Data...' : "Request System Access"}
                </button>

                <p className="text-center text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-6">
                  Identity Active?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-white hover:text-gray-300 ml-1 transition-colors drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
                  >
                    Authenticate
                  </button>
                </p>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
