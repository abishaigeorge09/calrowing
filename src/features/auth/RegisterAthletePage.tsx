import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Hexagon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { IS_SUPABASE, supabase } from '@/lib/db'
import { MOCK_TEAM } from '@/lib/mock-data'
import type { Profile } from '@/types/database'
import { motion } from 'framer-motion'

type Step = 'invite' | 'account' | 'profile' | 'academic'

export default function RegisterAthletePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [resolvedTeamId, setResolvedTeamId] = useState('')
  const [resolvedTeamName, setResolvedTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    year: '', boat_class: '', seat_position: '',
    height: '', weight: '', sleep_goal: '8',
    classes_per_day: '3', hard_days: [] as string[], exam_weeks: '',
    injuries: '',
  })

  // ... (keep standard logic unchanged)
  const handleInviteCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')

    if (!IS_SUPABASE) {
      if (inviteCode.toUpperCase() === MOCK_TEAM.invite_code || inviteCode.length >= 6) {
        setResolvedTeamId(MOCK_TEAM.id)
        setResolvedTeamName(MOCK_TEAM.name)
        setStep('account')
      } else {
        setInviteError('Invalid invite code. Try CAL-ROW-2026 for the demo.')
      }
      return
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (teamError || !team) {
      setInviteError('Invalid invite code. Ask your coach for the correct code.')
      return
    }

    setResolvedTeamId(team.id)
    setResolvedTeamName(team.name)
    setStep('account')
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!IS_SUPABASE) {
      const profile: Profile = {
        id: `athlete-${Date.now()}`,
        email: form.email,
        name: form.name,
        role: 'athlete',
        team_id: resolvedTeamId || MOCK_TEAM.id,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }
      useAuthStore.setState({ user: profile })
      setLoading(false)
      navigate('/athlete')
      return
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { role: 'athlete', name: form.name },
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
          throw new Error('Account created! Please confirm your email, then sign in to complete your profile.')
        }
      }

      const uid = authData.user.id

      await supabase
        .from('profiles')
        .update({ team_id: resolvedTeamId })
        .eq('id', uid)

      await supabase.from('athletes').insert({
        id: uid,
        year: form.year || null,
        boat_class: form.boat_class || null,
        seat_position: form.seat_position || null,
        height_cm: form.height ? parseInt(form.height) : null,
        weight_kg: form.weight ? parseFloat(form.weight) : null,
        sleep_goal: parseInt(form.sleep_goal) || 8,
        injuries_text: form.injuries || null,
      })

      await supabase.from('academic_schedules').insert({
        athlete_id: uid,
        classes_per_day: parseInt(form.classes_per_day) || 3,
        hard_days: form.hard_days,
        exam_weeks: form.exam_weeks
          ? [{ week: form.exam_weeks, subject: 'Exam' }]
          : [],
      })

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (profile) useAuthStore.setState({ user: profile as Profile })

      navigate('/athlete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const toggleDay = (day: string) => {
    const updated = form.hard_days.includes(day)
      ? form.hard_days.filter(d => d !== day)
      : [...form.hard_days, day]
    setForm({ ...form, hard_days: updated })
  }

  // Custom UI components
  const darkInputClasses = "bg-black/50 border-white/10 focus:border-white text-white placeholder:text-gray-600 rounded-xl h-11"
  const darkLabelClasses = "text-[10px] uppercase tracking-widest text-gray-400 font-bold"

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
            {(['invite', 'account', 'profile', 'academic'] as Step[]).map((s, i) => {
              const stepIdx = ['invite', 'account', 'profile', 'academic'].indexOf(step)
              const isActive = i <= stepIdx
              return (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${isActive ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/10'}`} />
              )
            })}
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {step === 'invite' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Join Synchronization</h1>
                <p className="text-gray-400 text-sm mb-8 font-light text-center">Verify operational node via invite code</p>
                
                <form onSubmit={handleInviteCheck} className="space-y-6">
                  <div className="space-y-2">
                    <Label className={darkLabelClasses}>Access Identifier Code</Label>
                    <Input
                      placeholder="e.g. CAL-ROW-2026"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className={`${darkInputClasses} text-center tracking-[0.2em] font-mono text-xl uppercase h-14`}
                      required
                    />
                    {inviteError && <p className="text-red-400 text-xs text-center mt-2">{inviteError}</p>}
                    {!IS_SUPABASE && (
                      <p className="text-gray-500 text-xs text-center mt-2">Simulation bypass: <strong className="text-white">CAL-ROW-2026</strong></p>
                    )}
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-white text-black hover:bg-gray-200 uppercase tracking-widest font-bold mt-4 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    Verify Link
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'account' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Establish Identity</h1>
                <p className="text-gray-400 text-sm mb-6 font-light text-center">
                  Aligning with array: <strong className="text-white bg-white/10 px-2 py-0.5 rounded ml-1">{resolvedTeamName || MOCK_TEAM.name}</strong>
                </p>
                <form onSubmit={(e) => { e.preventDefault(); setStep('profile') }} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Operative Designation (Name)</Label>
                    <Input placeholder="Alex Chen" value={form.name} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Communication Link (Email)</Label>
                    <Input type="email" placeholder="alex@berkeley.edu" value={form.email} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Security Cipher (Password)</Label>
                    <Input type="password" placeholder="Min 8 characters" value={form.password} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/20 hover:bg-white/10 hover:text-white text-white uppercase tracking-widest text-xs h-12" onClick={() => setStep('invite')}>Abort</Button>
                    <Button type="submit" className="flex-1 bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold h-12 shadow-[0_0_15px_rgba(255,255,255,0.2)]">Proceed</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">Biometric Alignment</h1>
                <p className="text-gray-400 text-sm mb-6 font-light text-center">Define physiological parameters</p>
                <form onSubmit={(e) => { e.preventDefault(); setStep('academic') }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={darkLabelClasses}>Class Year</Label>
                      <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                        <SelectTrigger className={darkInputClasses}><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20 text-white backdrop-blur-xl">
                          {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(y => (
                            <SelectItem key={y} value={y} className="focus:bg-white/10">{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={darkLabelClasses}>Vessel Class</Label>
                      <Select value={form.boat_class} onValueChange={(v) => setForm({ ...form, boat_class: v })}>
                        <SelectTrigger className={darkInputClasses}><SelectValue placeholder="Boat" /></SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20 text-white backdrop-blur-xl">
                          {['Varsity 8', 'JV 8', 'Lightweight', 'Single', 'Double', 'Four'].map(b => (
                            <SelectItem key={b} value={b} className="focus:bg-white/10">{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Vector Position (Seat)</Label>
                    <Select value={form.seat_position} onValueChange={(v) => setForm({ ...form, seat_position: v })}>
                      <SelectTrigger className={darkInputClasses}><SelectValue placeholder="Assignment" /></SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/20 text-white backdrop-blur-xl">
                        {['Stroke', '2-seat', '3-seat', '4-seat', '5-seat', '6-seat', '7-seat', 'Bow', 'Cox'].map(s => (
                          <SelectItem key={s} value={s} className="focus:bg-white/10">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={darkLabelClasses}>Y-Axis (cm)</Label>
                      <Input type="number" placeholder="190" value={form.height} className={darkInputClasses}
                        onChange={(e) => setForm({ ...form, height: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={darkLabelClasses}>Mass (kg)</Label>
                      <Input type="number" placeholder="85" value={form.weight} className={darkInputClasses}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Regeneration Goal (HRS)</Label>
                    <Select value={form.sleep_goal} onValueChange={(v) => setForm({ ...form, sleep_goal: v })}>
                      <SelectTrigger className={darkInputClasses}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/20 text-white backdrop-blur-xl">
                        {['6', '7', '7.5', '8', '8.5', '9'].map(h => (
                          <SelectItem key={h} value={h} className="focus:bg-white/10">{h} hours</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Hardware Damage (Injuries)</Label>
                    <Input placeholder="e.g. L4-L5 disc" value={form.injuries} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, injuries: e.target.value })} />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/20 hover:bg-white/10 hover:text-white text-white uppercase tracking-widest text-xs h-12" onClick={() => setStep('account')}>Abort</Button>
                    <Button type="submit" className="flex-1 bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold h-12 shadow-[0_0_15px_rgba(255,255,255,0.2)]">Proceed</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'academic' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide text-center">External Load</h1>
                <p className="text-gray-400 text-sm mb-6 font-light text-center">Input academic strain metrics</p>
                <form onSubmit={handleFinish} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Daily Cognitive Load (Classes/Day)</Label>
                    <Select value={form.classes_per_day} onValueChange={(v) => setForm({ ...form, classes_per_day: v })}>
                      <SelectTrigger className={darkInputClasses}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-black/90 border-white/20 text-white backdrop-blur-xl">
                        {['1', '2', '3', '4', '5'].map(n => (
                          <SelectItem key={n} value={n} className="focus:bg-white/10">{n} {n === '1' ? 'unit' : 'units'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className={darkLabelClasses}>High Strain Cycles (Select Days)</Label>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {days.map(day => {
                        const isSelected = form.hard_days.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                                : 'bg-black/50 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={darkLabelClasses}>Critical Evaluation Windows (Exams)</Label>
                    <Input placeholder="e.g. October 10-14" value={form.exam_weeks} className={darkInputClasses}
                      onChange={(e) => setForm({ ...form, exam_weeks: e.target.value })} />
                  </div>

                  {error && (
                    <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/20 hover:bg-white/10 hover:text-white text-white uppercase tracking-widest text-xs h-12" onClick={() => setStep('profile')}>Abort</Button>
                    <Button type="submit" className="flex-1 bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold h-12 shadow-[0_0_15px_rgba(255,255,255,0.2)]" disabled={loading}>
                      {loading ? 'Initializing…' : <><Check className="h-4 w-4 mr-2" /> Finalize Link</>}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Basic motion div substitute since framer-motion might complain without wrapper if not imported properly. */}
    </div>
  )
}
