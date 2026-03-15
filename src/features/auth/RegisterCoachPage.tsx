import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Hexagon, Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { motion } from 'framer-motion'

type Step = 'account' | 'team' | 'pending'
type ProgressStep = 'account' | 'team'

export default function RegisterCoachPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    teamName: '', division: '', seasonStart: '', seasonEnd: '',
  })

  // ... (keep standard logic unchanged)
  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('team')
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!IS_SUPABASE) {
      // Demo: do NOT log in — show pending approval screen
      setLoading(false)
      setStep('pending')
      return
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { role: 'coach', name: form.name },
        },
      })
      if (signUpError) throw new Error(signUpError.message)
      if (!authData.user) throw new Error('Sign up failed — please try again.')

      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (signInError) {
          throw new Error('Account created! Please confirm your email, then sign in to complete team setup.')
        }
      }

      await supabase
        .from('profiles')
        .update({ status: 'pending' })
        .eq('id', authData.user.id)

      // Sign out — coach cannot access dashboard until approved
      await supabase.auth.signOut()

      setStep('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Custom UI components
  const darkInputClasses = "bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-11"
  const darkLabelClasses = "text-[10px] uppercase tracking-widest text-gray-400 font-bold"

  if (step === 'pending') {
    return (
      <div className="relative min-h-dvh bg-black flex flex-col font-sans text-white overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] blur-[150px] rounded-full" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-amber-500/15 blur-[40px] rounded-full" />
              <div className="relative bg-amber-950/30 border border-amber-500/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <Clock className="h-9 w-9 text-amber-400" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Request Submitted!</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
              Your coach account is pending approval. We'll review your request and reach out shortly.
            </p>

            <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-5 text-left space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">Usually within 24 hours</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Our team reviews every coach request to keep RowIQ a trusted platform.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">We'll email {form.email}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Once approved, sign in with your credentials to set up your team.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Back to Sign In
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-black flex flex-col font-sans text-white overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-white/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-6 pt-12 pb-6 border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <Link to="/login" className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-white" strokeWidth={1.5} />
            <span className="text-xl font-black text-white uppercase tracking-widest">RowIQ</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-12 w-full max-w-xl mx-auto">
          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {(['account', 'team'] as ProgressStep[]).map((s, i) => {
              const stepIdx = ['account', 'team'].indexOf(step)
              const isActive = i <= stepIdx
              return (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${isActive ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/10'}`} />
              )
            })}
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {step === 'account' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Create Coach Account</h1>
                <p className="text-gray-400 text-sm mb-6 font-light text-center">Set up your coaching profile</p>
                <form onSubmit={handleAccountNext} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Your Name</Label>
                    <Input placeholder="Coach Mike Teti" value={form.name} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Email</Label>
                    <Input type="email" placeholder="coach@berkeley.edu" value={form.email} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Password</Label>
                    <Input type="password" placeholder="Min 8 characters" value={form.password} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                  </div>
                  <div className="pt-4">
                    <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold h-12 shadow-[0_0_15px_rgba(255,255,255,0.2)]">Proceed</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'team' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Set Up Your Team</h1>
                <p className="text-gray-400 text-sm mb-6 font-light text-center">Tell us about your team</p>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Team Name</Label>
                    <Input placeholder="UC Berkeley Men's Rowing" value={form.teamName} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, teamName: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Division</Label>
                    <Select value={form.division} onValueChange={(v) => setForm({ ...form, division: v })}>
                      <SelectTrigger className={darkInputClasses}><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/20 text-white backdrop-blur-xl">
                        {['NCAA D1', 'NCAA D2', 'NCAA D3', 'NAIA', 'Club', 'High School'].map(d => (
                          <SelectItem key={d} value={d} className="focus:bg-white/10">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={darkLabelClasses}>Season Start</Label>
                      <Input type="date" value={form.seasonStart} className={darkInputClasses} style={{ colorScheme: 'dark' }}
                        onChange={(e) => setForm({ ...form, seasonStart: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={darkLabelClasses}>Season End</Label>
                      <Input type="date" value={form.seasonEnd} className={darkInputClasses} style={{ colorScheme: 'dark' }}
                        onChange={(e) => setForm({ ...form, seasonEnd: e.target.value })} />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/20 hover:bg-white/10 hover:text-white text-white uppercase tracking-widest text-xs h-12" onClick={() => setStep('account')}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold h-12 shadow-[0_0_15px_rgba(255,255,255,0.2)]" disabled={loading}>
                      {loading ? 'Creating…' : 'Create Team'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            <p className="text-center text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-8 border-t border-white/10 pt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-gray-300 transition-colors shadow-[0_0_5px_rgba(255,255,255,0.8)]">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
