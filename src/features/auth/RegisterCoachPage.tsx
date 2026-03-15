import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Hexagon, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { generateInviteCode } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { motion } from 'framer-motion'

type Step = 'account' | 'team' | 'done'
type ProgressStep = 'account' | 'team'

export default function RegisterCoachPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('account')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')

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

    const code = generateInviteCode(form.teamName)
    setInviteCode(code)

    if (!IS_SUPABASE) {
      const mockProfile: Profile = {
        id: `coach-${Date.now()}`,
        email: form.email,
        name: form.name,
        role: 'coach',
        team_id: `team-${Date.now()}`,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }
      useAuthStore.setState({ user: mockProfile })
      setLoading(false)
      setStep('done')
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

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: form.teamName,
          invite_code: code,
          sport: 'Rowing',
          division: form.division || null,
          season_start: form.seasonStart || null,
          season_end: form.seasonEnd || null,
          coach_id: authData.user.id,
        })
        .select()
        .single()
      if (teamError) throw new Error(teamError.message)

      await supabase
        .from('profiles')
        .update({ team_id: team.id })
        .eq('id', authData.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      if (profile) useAuthStore.setState({ user: profile as Profile })

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Custom UI components
  const darkInputClasses = "bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-11"
  const darkLabelClasses = "text-[10px] uppercase tracking-widest text-gray-400 font-bold"

  if (step === 'done') {
    return (
      <div className="relative min-h-dvh bg-black flex flex-col font-sans text-white overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full mix-blend-screen" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="bg-white/10 rounded-full p-5 mb-6 inline-flex border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Check className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase">Team Created!</h1>
            <p className="text-gray-400 mb-8 font-light text-sm">
              Share this code with your athletes so they can join your team.
            </p>

            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 mb-8 w-full shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[30px] rounded-full" />
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Invite Code</p>
              <p className="text-3xl font-black text-white tracking-widest mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{inviteCode}</p>
              <Button onClick={copyCode} className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 uppercase tracking-widest text-xs font-bold transition-all h-10">
                {copied ? <><Check className="h-4 w-4 mr-2" /> Copied</> : <><Copy className="h-4 w-4 mr-2" /> Copy to Clipboard</>}
              </Button>
            </div>

            <p className="text-sm font-light text-gray-400 mb-8 border-t border-white/10 pt-6">
              Team: <strong className="text-white uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">{form.teamName}</strong>
            </p>

            <Button size="lg" className="w-full bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] h-12" onClick={() => navigate('/coach')}>
              Go to Dashboard
            </Button>
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
