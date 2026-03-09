import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Waves, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { MOCK_TEAM } from '@/lib/mock-data'
import type { Profile } from '@/types/database'

type Step = 'invite' | 'account' | 'profile' | 'academic'

export default function RegisterAthletePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    year: '', boat_class: '', seat_position: '',
    height: '', weight: '', sleep_goal: '8',
    classes_per_day: '3', hard_days: [] as string[], exam_weeks: '',
    injuries: '',
  })

  const handleInviteCheck = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteCode.toUpperCase() === MOCK_TEAM.invite_code || inviteCode.length >= 6) {
      setInviteError('')
      setStep('account')
    } else {
      setInviteError('Invalid invite code. Try CAL-ROW-2026 for the demo.')
    }
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const profile: Profile = {
      id: `athlete-${Date.now()}`,
      email: form.email,
      name: form.name,
      role: 'athlete',
      team_id: MOCK_TEAM.id,
      avatar_url: null,
      created_at: new Date().toISOString(),
    }
    useAuthStore.setState({ user: profile })
    setLoading(false)
    navigate('/athlete')
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const toggleDay = (day: string) => {
    const updated = form.hard_days.includes(day)
      ? form.hard_days.filter(d => d !== day)
      : [...form.hard_days, day]
    setForm({ ...form, hard_days: updated })
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0f2d52] to-[#1e3a5f] flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-12 pb-6">
        <Link to="/login" className="text-white/70 hover:text-white">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-2">
          <Waves className="h-6 w-6 text-white" />
          <span className="text-xl font-black text-white">RowIQ</span>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-8 overflow-y-auto">
        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {(['invite', 'account', 'profile', 'academic'] as Step[]).map((s, i) => {
            const stepIdx = ['invite', 'account', 'profile', 'academic'].indexOf(step)
            return (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= stepIdx ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`} />
            )
          })}
        </div>

        {step === 'invite' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Join Your Team</h1>
            <p className="text-slate-500 text-sm mb-6">Enter the invite code from your coach</p>
            <form onSubmit={handleInviteCheck} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Team Invite Code</Label>
                <Input
                  placeholder="e.g. CAL-ROW-2026"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="uppercase tracking-widest text-lg font-mono text-center"
                  required
                />
                {inviteError && <p className="text-red-600 text-sm">{inviteError}</p>}
                <p className="text-slate-400 text-xs">Demo: use <strong>CAL-ROW-2026</strong></p>
              </div>
              <Button type="submit" size="lg" className="w-full">Verify Code</Button>
            </form>
          </>
        )}

        {step === 'account' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Create Your Account</h1>
            <p className="text-slate-500 text-sm mb-2">Joining: <strong className="text-[#1e3a5f]">{MOCK_TEAM.name}</strong></p>
            <form onSubmit={(e) => { e.preventDefault(); setStep('profile') }} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="Alex Chen" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="alex@berkeley.edu" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="Min 8 characters" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep('invite')}>Back</Button>
                <Button type="submit" size="lg" className="flex-1">Continue</Button>
              </div>
            </form>
          </>
        )}

        {step === 'profile' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Athlete Profile</h1>
            <p className="text-slate-500 text-sm mb-4">Tell us about you as a rower</p>
            <form onSubmit={(e) => { e.preventDefault(); setStep('academic') }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Boat Class</Label>
                  <Select value={form.boat_class} onValueChange={(v) => setForm({ ...form, boat_class: v })}>
                    <SelectTrigger><SelectValue placeholder="Boat" /></SelectTrigger>
                    <SelectContent>
                      {['Varsity 8', 'JV 8', 'Lightweight', 'Single', 'Double', 'Four'].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Seat Position</Label>
                <Select value={form.seat_position} onValueChange={(v) => setForm({ ...form, seat_position: v })}>
                  <SelectTrigger><SelectValue placeholder="Seat position" /></SelectTrigger>
                  <SelectContent>
                    {['Stroke', '2-seat', '3-seat', '4-seat', '5-seat', '6-seat', '7-seat', 'Bow', 'Cox'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Height (cm)</Label>
                  <Input type="number" placeholder="190" value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (kg)</Label>
                  <Input type="number" placeholder="85" value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sleep Goal (hours/night)</Label>
                <Select value={form.sleep_goal} onValueChange={(v) => setForm({ ...form, sleep_goal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['6', '7', '7.5', '8', '8.5', '9'].map(h => (
                      <SelectItem key={h} value={h}>{h} hours</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Known Injuries / Limitations (optional)</Label>
                <Input placeholder="e.g. chronic lower back" value={form.injuries}
                  onChange={(e) => setForm({ ...form, injuries: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep('account')}>Back</Button>
                <Button type="submit" size="lg" className="flex-1">Continue</Button>
              </div>
            </form>
          </>
        )}

        {step === 'academic' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Academic Schedule</h1>
            <p className="text-slate-500 text-sm mb-4">Help your coach understand your academic load</p>
            <form onSubmit={handleFinish} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Classes per day (average)</Label>
                <Select value={form.classes_per_day} onValueChange={(v) => setForm({ ...form, classes_per_day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5'].map(n => (
                      <SelectItem key={n} value={n}>{n} {n === '1' ? 'class' : 'classes'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hard academic days (select all that apply)</Label>
                <div className="flex gap-2 flex-wrap">
                  {days.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        form.hard_days.includes(day)
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Upcoming exam weeks (optional)</Label>
                <Input placeholder="e.g. March 15-19 (Midterms)" value={form.exam_weeks}
                  onChange={(e) => setForm({ ...form, exam_weeks: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep('profile')}>Back</Button>
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? 'Joining…' : <>
                    <Check className="h-4 w-4" /> Join Team
                  </>}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
